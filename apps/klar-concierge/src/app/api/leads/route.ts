import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { config } from "@/lib/config";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { generateLeadReference } from "@/services/leads/reference";
import { scoreLead } from "@/services/leads/scoring";
import { createCRMProvider, nextRetryAt } from "@/services/crm/factory";
import { audit, maskEmail } from "@/lib/audit";
import { track } from "@/lib/analytics";
import type { TravelBrief } from "@/types/brief";

export const runtime = "nodejs";

const customerSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().regex(/^[+\d][\d\s-]{7,15}$/),
  email: z.string().email().max(200),
  preferredContactChannel: z.enum(["phone", "email", "whatsapp"]),
  preferredContactTime: z.string().max(120).optional(),
  additionalNotes: z.string().max(2000).optional(),
  consent: z.literal(true),
});

const bodySchema = z.object({
  customer: customerSchema,
  brief: z.record(z.unknown()),
  recommendations: z
    .array(
      z.object({
        conceptId: z.string().max(120),
        destinationSlug: z.string().max(80),
        direction: z.enum(["best-match", "best-for-taste", "something-special"]),
        score: z.record(z.number()),
        reasons: z.array(z.string().max(500)).max(5),
        tradeOff: z.string().max(500),
      }),
    )
    .max(3),
  selected: z.object({
    conceptId: z.string().max(120),
    destinationSlug: z.string().max(80),
    direction: z.enum(["best-match", "best-for-taste", "something-special"]),
  }),
  itinerary: z
    .array(
      z.object({
        day: z.number().int().min(1).max(31),
        title: z.string().max(200),
        pace: z.enum(["light", "balanced", "active"]),
        activities: z
          .array(
            z.object({
              title: z.string().max(200),
              description: z.string().max(1000),
              optional: z.boolean().optional(),
            }),
          )
          .max(10),
        notes: z.array(z.string().max(500)).max(10),
      }),
    )
    .max(31),
  transcript: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
        createdAt: z.string().max(40),
      }),
    )
    .max(200),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "leads"), config.rateLimitLeadsPerMinute);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    return NextResponse.json({ error: "Idempotency-Key header is required." }, { status: 400 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Please check the form details and try again." },
      { status: 400 },
    );
  }

  const db = getDb();

  try {
    // Duplicate submission (same idempotency key) → return the stored lead.
    const existing = await db.lead.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json({ reference: existing.reference, duplicate: true });
    }

    const brief = parsed.brief as unknown as TravelBrief;
    const leadScore = scoreLead({
      brief,
      destinationSelected: true,
      itineraryViewed: parsed.itinerary.length > 0,
      contactChannelKnown: Boolean(parsed.customer.preferredContactChannel),
      conversationMessages: parsed.transcript.filter((m) => m.role === "user").length,
    });

    const reference = generateLeadReference();
    const initialCrmStatus = config.crmEnabled ? "pending" : "disabled";

    // 1. Durable save FIRST. The customer only sees success after this commits.
    const lead = await db.lead.create({
      data: {
        reference,
        idempotencyKey,
        stage: "new_enquiry",
        priority: leadScore.priority,
        customerName: parsed.customer.name,
        customerPhone: parsed.customer.phone,
        customerEmail: parsed.customer.email,
        preferredContactChannel: parsed.customer.preferredContactChannel,
        preferredContactTime: parsed.customer.preferredContactTime,
        additionalNotes: parsed.customer.additionalNotes,
        consent: true,
        consentTimestamp: new Date(),
        tripBrief: parsed.brief as object,
        transcript: parsed.transcript as object[],
        selectedConceptId: parsed.selected.conceptId,
        selectedDestinationSlug: parsed.selected.destinationSlug,
        selectedDirection: parsed.selected.direction,
        itinerary: parsed.itinerary as object[],
        leadScore: leadScore.score,
        leadScoreReasons: leadScoreReasonsJson(leadScore.reasons),
        crmStatus: initialCrmStatus,
        crmProvider: config.crmEnabled ? config.crmProvider : "placeholder",
        recommendations: {
          create: parsed.recommendations.map((r) => ({
            conceptId: r.conceptId,
            destinationSlug: r.destinationSlug,
            direction: r.direction,
            score: r.score as object,
            reasons: r.reasons as string[],
            tradeOff: r.tradeOff,
          })),
        },
        itineraryDays: {
          create: parsed.itinerary.map((d) => ({
            day: d.day,
            title: d.title,
            pace: d.pace,
            activities: d.activities as object[],
            notes: d.notes as string[],
          })),
        },
      },
    });

    await audit("customer", "lead.created", "lead", lead.id, {
      reference,
      email: maskEmail(parsed.customer.email),
      destination: parsed.selected.destinationSlug,
    });

    // 2. CRM delivery AFTER durable storage. Failure never blocks the customer.
    try {
      const provider = createCRMProvider(config);
      const result = await provider.submitLead(
        {
          id: lead.id,
          reference,
          idempotencyKey,
          customerName: parsed.customer.name,
          customerPhone: parsed.customer.phone,
          customerEmail: parsed.customer.email,
          destinationSlug: parsed.selected.destinationSlug,
          leadScore: leadScore.score,
          createdAt: lead.createdAt.toISOString(),
        },
        { idempotencyKey },
      );

      const attempts = config.crmEnabled ? 1 : 0;
      await db.lead.update({
        where: { id: lead.id },
        data: {
          crmStatus: result.status === "submitted" ? "submitted" : result.status === "disabled" ? "disabled" : "failed",
          crmAttempts: attempts,
          crmReferenceId: result.crmReferenceId,
          crmLastError: result.errorMessage,
          crmLastAttempt: config.crmEnabled ? new Date() : undefined,
          crmNextRetryAt:
            config.crmEnabled && !result.success ? nextRetryAt(attempts) : undefined,
        },
      });
      if (config.crmEnabled) {
        await db.cRMDeliveryAttempt.create({
          data: {
            leadId: lead.id,
            provider: provider.id,
            attempt: 1,
            status: result.status,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
          },
        });
        await audit("system", result.success ? "crm.delivery.success" : "crm.delivery.failure", "lead", lead.id, {
          provider: provider.id,
        });
      }
    } catch (crmError) {
      // Misconfigured CRM with CRM_ENABLED=true: keep lead, mark failed, never fake success.
      await db.lead.update({
        where: { id: lead.id },
        data: {
          crmStatus: "failed",
          crmAttempts: 1,
          crmLastError: crmError instanceof Error ? crmError.message : "CRM configuration error",
          crmLastAttempt: new Date(),
          crmNextRetryAt: nextRetryAt(1),
        },
      });
      await audit("system", "crm.delivery.failure", "lead", lead.id, { configuration: true });
    }

    await track("consultant_handover_completed", {
      destination: parsed.selected.destinationSlug,
    });

    return NextResponse.json({ reference });
  } catch (error) {
    // Unique-constraint race on idempotency key → fetch and return stored lead.
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const existing = await db.lead.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return NextResponse.json({ reference: existing.reference, duplicate: true });
      }
    }
    await track("lead_submission_failed");
    return NextResponse.json(
      { error: "We couldn't save your plan just now. Please try again — nothing has been lost." },
      { status: 500 },
    );
  }
}

function leadScoreReasonsJson(reasons: string[]): string[] {
  return reasons;
}
