import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const destinations = await getDb().destination.findMany({
    orderBy: { name: "asc" },
    select: { slug: true, name: true, country: true, region: true, status: true, version: true },
  });
  return NextResponse.json({ destinations });
}
