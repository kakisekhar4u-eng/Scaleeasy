import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireRole("admin");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const records = await getDb().auditRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ records });
}
