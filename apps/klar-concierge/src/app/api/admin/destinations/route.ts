import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireRole("admin");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const destinations = await getDb().destination.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true, country: true, region: true, status: true, version: true },
  });
  return NextResponse.json({ destinations });
}
