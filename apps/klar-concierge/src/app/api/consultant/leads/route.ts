import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireRole("consultant");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const leads = await getDb().lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      customerName: true,
      selectedDestinationSlug: true,
      stage: true,
      priority: true,
      leadScore: true,
      crmStatus: true,
      consultantOwnerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ leads });
}
