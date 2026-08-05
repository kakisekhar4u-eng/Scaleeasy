import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { klarPrisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalForPrisma.klarPrisma) {
    globalForPrisma.klarPrisma = new PrismaClient();
  }
  return globalForPrisma.klarPrisma;
}
