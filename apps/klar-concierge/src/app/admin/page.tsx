import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const db = getDb();
  const [leadCount, verified, reviewed, crmFailed, events] = await Promise.all([
    db.lead.count(),
    db.destination.count({ where: { status: "verified" } }),
    db.destination.count({ where: { status: "reviewed" } }),
    db.lead.count({ where: { crmStatus: { in: ["failed", "manual_intervention"] } } }),
    db.analyticsEvent.count(),
  ]);

  const cards = [
    { label: "Total leads", value: leadCount, href: "/consultant" },
    { label: "Verified destinations", value: verified, href: "/admin/knowledge/destinations" },
    { label: "Reviewed (awaiting verification)", value: reviewed, href: "/admin/knowledge/destinations" },
    { label: "CRM delivery failures", value: crmFailed, href: "/admin/integrations/crm" },
    { label: "Analytics events", value: events, href: "/admin/analytics" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">Overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card block hover:border-brand">
            <p className="text-3xl font-bold text-brand">{c.value}</p>
            <p className="mt-1 text-sm text-foreground/60">{c.label}</p>
          </Link>
        ))}
      </div>
      <p className="mt-8 rounded-2xl bg-surface-muted p-5 text-sm text-foreground/70">
        Phase 1 launch requires at least 10 verified destinations, durable lead storage and
        protected internal routes. Check <Link className="text-brand underline" href="/admin/readiness">Readiness</Link> for
        the live status.
      </p>
    </div>
  );
}
