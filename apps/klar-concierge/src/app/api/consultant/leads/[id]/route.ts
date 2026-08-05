import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { stageToDb, LEAD_STAGES } from "@/lib/enums";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  stage: z.enum(LEAD_STAGES as [string, ...string[]]).optional(),
  consultantOwnerId: z.string().max(64).nullable().optional(),
  followUpDueAt: z.string().max(30).nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("consultant");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { id } = await params;
  const lead = await getDb().lead.findUnique({
    where: { id },
    include: { recommendations: true, notes: true, crmDeliveries: true },
  });
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("consultant");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { id } = await params;
  let parsed: z.infer<typeof patchSchema>;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = getDb();
  const existing = await db.lead.findUnique({ where: { id }, select: { id: true, stage: true } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.stage) data.stage = stageToDb(parsed.stage as never);
  if (parsed.priority) data.priority = parsed.priority;
  if (parsed.consultantOwnerId !== undefined) data.consultantOwnerId = parsed.consultantOwnerId;
  if (parsed.followUpDueAt !== undefined) {
    data.followUpDueAt = parsed.followUpDueAt ? new Date(parsed.followUpDueAt) : null;
  }

  const lead = await db.lead.update({ where: { id }, data });

  if (parsed.consultantOwnerId) {
    await db.leadAssignment.create({
      data: { leadId: id, consultantId: parsed.consultantOwnerId },
    });
    await audit(user.id, "lead.assigned", "lead", id, { to: parsed.consultantOwnerId });
  }
  if (parsed.stage) {
    await audit(user.id, "lead.stage.changed", "lead", id, {
      from: existing.stage,
      to: parsed.stage,
    });
  }

  return NextResponse.json({ ok: true, stage: lead.stage });
}
