import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";
import { requireRole } from "@/lib/auth/session";
import { createCRMProvider } from "@/services/crm/factory";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const bodySchema = z.object({
  dryRun: z.boolean().default(true),
  batchSize: z.number().int().min(1).max(100).default(25),
});

/**
 * Backfill workflow: when a real CRM is connected later, deliver historical
 * leads that were stored while CRM was disabled. Idempotent, batched,
 * dry-run by default. Disabled scaffolding while CRM_ENABLED=false.
 */
export async function POST(request: Request) {
  const user = await requireRole("admin");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  if (!config.crmEnabled) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      message:
        "CRM is disabled. Enable and configure a real provider before running the backfill.",
    });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = getDb();
  const candidates = await db.lead.findMany({
    where: { crmStatus: "disabled" },
    take: parsed.batchSize,
    orderBy: { createdAt: "asc" },
  });

  if (parsed.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldProcess: candidates.length,
      references: candidates.map((c) => c.reference),
    });
  }

  const provider = createCRMProvider(config);
  let succeeded = 0;
  let failed = 0;
  for (const lead of candidates) {
    const attempt = lead.crmAttempts + 1;
    const result = await provider.submitLead(
      {
        id: lead.id,
        reference: lead.reference,
        idempotencyKey: lead.idempotencyKey,
        customerName: lead.customerName,
        customerPhone: lead.customerPhone,
        customerEmail: lead.customerEmail,
        destinationSlug: lead.selectedDestinationSlug ?? undefined,
        leadScore: lead.leadScore,
        createdAt: lead.createdAt.toISOString(),
      },
      { idempotencyKey: lead.idempotencyKey },
    );
    await db.cRMDeliveryAttempt.create({
      data: {
        leadId: lead.id,
        provider: provider.id,
        attempt,
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      },
    });
    await db.lead.update({
      where: { id: lead.id },
      data: {
        crmStatus: result.success ? "submitted" : "failed",
        crmAttempts: attempt,
        crmReferenceId: result.crmReferenceId ?? lead.crmReferenceId,
        crmLastError: result.errorMessage,
        crmLastAttempt: new Date(),
      },
    });
    if (result.success) succeeded++;
    else failed++;
  }

  await audit(user.id, "crm.backfill", "system", undefined, {
    processed: candidates.length, succeeded, failed,
  });

  return NextResponse.json({ ok: true, processed: candidates.length, succeeded, failed });
}
