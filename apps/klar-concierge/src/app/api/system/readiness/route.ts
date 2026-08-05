import { NextResponse } from "next/server";
import { runReadinessChecks } from "@/services/readiness/checks";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET() {
  const result = await runReadinessChecks();
  await audit("portal", "readiness.checked", "system", undefined, { ready: result.ready });
  return NextResponse.json(result);
}
