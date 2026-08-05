import { randomBytes } from "node:crypto";

/** Unambiguous alphabet — no 0/O or 1/I confusion when read over the phone. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateLeadReference(now: Date = new Date()): string {
  const year = now.getFullYear();
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `KLAR-${year}-${code}`;
}

export function isValidLeadReference(reference: string): boolean {
  return /^KLAR-\d{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(reference);
}
