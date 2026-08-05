import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession } from "@/lib/auth/session";
import { config } from "@/lib/config";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;
  if (token) {
    try {
      await destroySession(token);
    } catch {
      // Session row may already be gone — cookie clearing is what matters.
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(config.authCookieName, "", { maxAge: 0, path: "/" });
  return response;
}
