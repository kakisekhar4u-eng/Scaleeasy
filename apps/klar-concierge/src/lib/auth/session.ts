import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { getDb } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "knowledge_editor" | "consultant" | "operations" | "viewer";
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + config.authSessionHours * 3600_000);
  await getDb().session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await getDb().session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;
  if (!token) return null;
  try {
    const session = await getDb().session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || !session.user.active) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as SessionUser["role"],
    };
  } catch {
    // Database unavailable — treat as unauthenticated rather than crashing.
    return null;
  }
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

const ROLE_ACCESS: Record<string, SessionUser["role"][]> = {
  admin: ["admin", "knowledge_editor", "operations"],
  consultant: ["admin", "consultant", "operations"],
};

export function canAccess(area: "admin" | "consultant", role: SessionUser["role"]): boolean {
  return ROLE_ACCESS[area].includes(role);
}

/** Server-side guard for protected pages/APIs. Returns the user or null. */
export async function requireRole(area: "admin" | "consultant"): Promise<SessionUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  return canAccess(area, user.role) ? user : null;
}
