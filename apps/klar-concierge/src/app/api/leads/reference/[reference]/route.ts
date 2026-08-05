import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidLeadReference } from "@/services/leads/reference";

export const runtime = "nodejs";

/** Public status lookup by reference — returns only non-sensitive fields. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  if (!isValidLeadReference(reference)) {
    return NextResponse.json({ error: "Invalid reference." }, { status: 400 });
  }
  try {
    const lead = await getDb().lead.findUnique({ where: { reference } });
    if (!lead) {
      return NextResponse.json({ error: "Reference not found." }, { status: 404 });
    }
    return NextResponse.json({
      reference: lead.reference,
      destination: lead.selectedDestinationSlug,
      stage: lead.stage.replace(/_/g, "-"),
      createdAt: lead.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Temporarily unavailable." }, { status: 503 });
  }
}
