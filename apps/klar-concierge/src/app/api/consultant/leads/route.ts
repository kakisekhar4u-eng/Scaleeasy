import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

// No app-level auth: this API is reached only through the klartravels portal,
// which is responsible for access control to /consultant and /api/consultant.
export async function GET() {
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
      consultantOwner: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ leads });
}
