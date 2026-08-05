import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";
import { createCRMProvider, nextRetryAt, CRM_RETRY_SCHEDULE_MINUTES } from "@/services/crm/factory";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const BATCH_LIMIT = 20;

function secretMatches(request: Request): boolean {
  const provided = request.headers.get("x-crm-retry-secret") ?? "";
  const expected = config.crmRetrySecret;
  if (!expected || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * Durable retry worker for failed CRM deliveries. Disabled response when CRM
 * is off. Requires the CRM_RETRY_SECRET header (set it before enabling CRM).
 * Wire to Vercel Cron when CRM is enabled (see vercel.json example).
 */
export async function POST(request: Request) {
  if (!config.crmEnabled) {
    return NextResponse.json({
      ok: true,
      disabled: true,
      message: "CRM is disabled — no retries are scheduled and none are needed.",
    });
  }

  if (!secretMatches(request)) {
    return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
  }

  const db = getDb();
  const due = await db.lead.findMany({
    where: { crmStatus: "failed", crmNextRetryAt: { lte: new Date() } },
    take: BATCH_LIMIT,
    orderBy: { crmNextRetryAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;
  let escalated = 0;

  const provider = createCRMProvider(config);
  for (const lead of due) {
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
    const retryAt = nextRetryAt(attempt);
    const manualIntervention = !result.success && !retryAt;
    await db.lead.update({
      where: { id: lead.id },
      data: {
        crmStatus: result.success ? "submitted" : manualIntervention ? "manual_intervention" : "failed",
        crmAttempts: attempt,
        crmReferenceId: result.crmReferenceId ?? lead.crmReferenceId,
        crmLastError: result.errorMessage,
        crmLastAttempt: new Date(),
        crmNextRetryAt: result.success || manualIntervention ? null : retryAt,
      },
    });
    if (result.success) succeeded++;
    else if (manualIntervention) escalated++;
    else failed++;
  }

  await audit("system", "crm.retry.batch", "system", undefined, {
    processed: due.length, succeeded, failed, escalated,
  });

  return NextResponse.json({
    ok: true,
    processed: due.length,
    succeeded,
    failed,
    escalated,
    schedule: CRM_RETRY_SCHEDULE_MINUTES,
  });
}
