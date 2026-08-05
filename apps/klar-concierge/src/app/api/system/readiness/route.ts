import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { runReadinessChecks } from "@/services/readiness/checks";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireRole("admin");
  if (!user) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

  const result = await runReadinessChecks();
  await audit(user.id, "readiness.checked", "system", undefined, { ready: result.ready });
  return NextResponse.json(result);
}
