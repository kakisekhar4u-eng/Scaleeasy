/**
 * Seed script: 20 KTIE destinations (status "reviewed" — Klar must verify
 * before launch) and an initial admin user from SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD. No hard-coded credentials.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from "../src/generated/prisma";
import { KTIE_DESTINATIONS } from "../src/services/ktie/data";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  for (const d of KTIE_DESTINATIONS) {
    const { monthlyIntelligence, sources, version, ...profileRest } = d;
    const destination = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {
        name: d.name,
        country: d.country,
        region: d.region,
        status: d.status,
        profile: profileRest as object,
        reviewedBy: version.reviewedBy,
        reviewedAt: new Date(version.reviewedAt),
        nextReviewAt: new Date(version.nextReviewAt),
        version: version.version,
      },
      create: {
        slug: d.slug,
        name: d.name,
        country: d.country,
        region: d.region,
        status: d.status,
        profile: profileRest as object,
        reviewedBy: version.reviewedBy,
        reviewedAt: new Date(version.reviewedAt),
        nextReviewAt: new Date(version.nextReviewAt),
        version: version.version,
      },
    });

    await prisma.destinationMonth.deleteMany({ where: { destinationId: destination.id } });
    await prisma.destinationMonth.createMany({
      data: monthlyIntelligence.map((m) => ({
        destinationId: destination.id,
        month: m.month,
        seasonScore: m.seasonScore,
        seasonLabel: m.seasonLabel,
        rainfall: m.rainfall,
        humidity: m.humidity,
        crowdLevel: m.crowdLevel,
        highlights: m.highlights,
        warnings: m.warnings,
      })),
    });

    await prisma.destinationSource.deleteMany({ where: { destinationId: destination.id } });
    await prisma.destinationSource.createMany({
      data: sources.map((s) => ({
        destinationId: destination.id,
        sourceName: s.sourceName,
        sourceType: s.sourceType,
        sourceReference: s.sourceReference,
        reliability: s.reliability,
        accessedAt: new Date(s.accessedAt),
      })),
    });
    console.log(`Seeded destination: ${d.name}`);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: "Klar Admin",
        passwordHash: hashPassword(adminPassword),
        role: "admin",
      },
    });
    console.log(`Seeded admin user: ${adminEmail}`);
  } else {
    console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin user.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
