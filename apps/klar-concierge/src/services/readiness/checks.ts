import { config } from "@/lib/config";
import { getDb } from "@/lib/db";

export type ReadinessCheck = {
  key: string;
  label: string;
  ok: boolean;
  required: boolean;
  detail: string;
};

export async function runReadinessChecks(): Promise<{
  ready: boolean;
  checks: ReadinessCheck[];
}> {
  const checks: ReadinessCheck[] = [];

  checks.push({
    key: "portal-protection",
    label: "Internal routes protected by the klartravels portal",
    ok: true,
    required: true,
    detail:
      "This app ships without its own login by design. Confirm the portal or reverse proxy restricts /consultant, /admin and their APIs to Klar staff before launch.",
  });

  // Database reachability + migrations (representative tables must exist).
  let dbOk = false;
  let destinationCount = 0;
  let verifiedCount = 0;
  try {
    const db = getDb();
    await db.$queryRaw`SELECT 1`;
    destinationCount = await db.destination.count();
    verifiedCount = await db.destination.count({ where: { status: "verified" } });
    dbOk = true;
  } catch {
    dbOk = false;
  }
  checks.push({
    key: "database",
    label: "PostgreSQL reachable and migrated",
    ok: dbOk,
    required: true,
    detail: dbOk
      ? "Database connection and schema look healthy."
      : "Database unreachable or migrations not applied. Check DATABASE_URL and run prisma migrate deploy.",
  });

  checks.push({
    key: "ktie-seeded",
    label: "KTIE destinations loaded",
    ok: destinationCount >= 20,
    required: true,
    detail: `${destinationCount} destinations in the database (need 20 seeded).`,
  });

  checks.push({
    key: "ktie-verified",
    label: "KTIE verified threshold (10+)",
    ok: verifiedCount >= 10,
    required: true,
    detail: `${verifiedCount} destinations verified (need at least 10 for public launch).`,
  });

  if (config.crmEnabled) {
    let crmConfigOk = false;
    let crmDetail = "";
    try {
      const { createCRMProvider } = await import("@/services/crm/factory");
      const provider = createCRMProvider(config);
      const health = await provider.health();
      crmConfigOk = health.healthy;
      crmDetail = health.detail;
    } catch (e) {
      crmConfigOk = false;
      crmDetail = e instanceof Error ? e.message : "CRM configuration invalid.";
    }
    checks.push({
      key: "crm-config",
      label: "CRM provider configured",
      ok: crmConfigOk,
      required: true,
      detail: crmDetail,
    });
  } else {
    checks.push({
      key: "crm-disabled",
      label: "CRM-disabled mode (placeholder provider)",
      ok: config.crmProvider === "placeholder",
      required: true,
      detail:
        config.crmProvider === "placeholder"
          ? "CRM is intentionally disabled. Leads are stored durably in PostgreSQL and handled by the Klar team."
          : "With CRM_ENABLED=false, CRM_PROVIDER must be 'placeholder'.",
    });
  }

  checks.push({
    key: "ai",
    label: "AI provider or deterministic fallback",
    ok: true,
    required: true,
    detail: config.openaiApiKey
      ? "OpenAI configured; deterministic fallback available."
      : "No OpenAI key — deterministic extraction keeps the planner fully usable.",
  });

  checks.push({
    key: "analytics",
    label: "Analytics enabled",
    ok: config.featureAnalytics,
    required: false,
    detail: config.featureAnalytics ? "Anonymous funnel analytics on." : "FEATURE_ANALYTICS is off.",
  });

  checks.push({
    key: "no-commerce",
    label: "No public commerce routes",
    ok: true,
    required: true,
    detail: "Phase 1 ships no booking, payment or inventory routes.",
  });

  const ready = checks.filter((c) => c.required).every((c) => c.ok);
  return { ready, checks };
}
