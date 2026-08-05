import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sessionCookieOptions } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { config } from "@/lib/config";
import { audit, maskEmail } from "@/lib/audit";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "login"), config.rateLimitLoginPerMinute);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const user = await getDb().user.findUnique({ where: { email: parsed.email } });
    if (!user || !user.active || !verifyPassword(parsed.password, user.passwordHash)) {
      await audit("anonymous", "auth.login.failure", "user", undefined, {
        email: maskEmail(parsed.email),
      });
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const { token, expiresAt } = await createSession(user.id);
    await audit(user.id, "auth.login.success", "user", user.id);

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    response.cookies.set(config.authCookieName, token, sessionCookieOptions(expiresAt));
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503 });
  }
}
