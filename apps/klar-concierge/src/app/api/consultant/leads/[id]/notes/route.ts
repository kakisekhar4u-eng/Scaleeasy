import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const bodySchema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("consultant");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const { id } = await params;
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = getDb();
  const lead = await db.lead.findUnique({ where: { id }, select: { id: true } });
  if (!lead) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const note = await db.leadNote.create({
    data: { leadId: id, authorId: user.id, body: parsed.body },
  });
  await audit(user.id, "lead.note.added", "lead", id);

  return NextResponse.json({ ok: true, noteId: note.id });
}
