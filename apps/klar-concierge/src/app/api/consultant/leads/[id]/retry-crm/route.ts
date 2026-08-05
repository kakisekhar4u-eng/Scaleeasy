import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";
import { createCRMProvider, nextRetryAt } from "@/services/crm/factory";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!config.crmEnabled) {
    return NextResponse.json({
      ok: false,
      message:
        "CRM/RMS integration is not configured. The lead is stored safely in Klar's database.",
    });
  }

  const { id } = await params;
  const db = getDb();
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  try {
    const provider = createCRMProvider(config);
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
    await db.lead.update({
      where: { id: lead.id },
      data: {
        crmStatus: result.success ? "submitted" : retryAt ? "failed" : "manual_intervention",
        crmAttempts: attempt,
        crmReferenceId: result.crmReferenceId ?? lead.crmReferenceId,
        crmLastError: result.errorMessage,
        crmLastAttempt: new Date(),
        crmNextRetryAt: result.success ? null : retryAt,
      },
    });
    await audit("portal", "crm.retry", "lead", lead.id, { success: result.success });

    return NextResponse.json({
      ok: result.success,
      message: result.success ? "CRM delivery succeeded." : "CRM delivery failed again — retry scheduled.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "CRM retry could not run — check CRM configuration." },
      { status: 500 },
    );
  }
}
