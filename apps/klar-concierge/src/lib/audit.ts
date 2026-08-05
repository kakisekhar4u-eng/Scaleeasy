import { getDb } from "@/lib/db";

/** Mask an email like a***@d***.com for audit safety. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain.slice(0, 1)}***`;
}

/** Mask a phone number keeping the last two digits. */
export function maskPhone(phone: string): string {
  return phone.length <= 2 ? "**" : `${"*".repeat(Math.max(0, phone.length - 2))}${phone.slice(-2)}`;
}

export async function audit(
  actor: string,
  action: string,
  entity?: string,
  entityId?: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await getDb().auditRecord.create({
      data: { actor, action, entity, entityId, detail: detail as object | undefined },
    });
  } catch {
    // Auditing must never break the customer flow.
  }
}
