import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["draft", "reviewed", "verified"]).optional(),
  reviewedBy: z.string().max(200).optional(),
  summary: z.string().max(2000).optional(),
  positioningLine: z.string().max(300).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const destination = await getDb().destination.findUnique({
    where: { slug },
    include: { months: { orderBy: { month: "asc" } }, sources: true },
  });
  if (!destination) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ destination });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let parsed: z.infer<typeof patchSchema>;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = getDb();
  const destination = await db.destination.findUnique({ where: { slug } });
  if (!destination) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const profile = destination.profile as Record<string, unknown>;
  if (parsed.summary) profile.summary = parsed.summary;
  if (parsed.positioningLine) profile.positioningLine = parsed.positioningLine;

  const updated = await db.destination.update({
    where: { slug },
    data: {
      status: parsed.status ?? destination.status,
      reviewedBy: parsed.reviewedBy ?? destination.reviewedBy,
      reviewedAt: parsed.status ? new Date() : destination.reviewedAt,
      nextReviewAt: parsed.status === "verified"
        ? new Date(Date.now() + 90 * 24 * 3600_000)
        : destination.nextReviewAt,
      profile: profile as object,
    },
  });

  await audit(
    "portal",
    parsed.status === "verified" ? "knowledge.verified" : "knowledge.edited",
    "destination",
    slug,
    { status: updated.status },
  );

  return NextResponse.json({ ok: true, status: updated.status });
}
