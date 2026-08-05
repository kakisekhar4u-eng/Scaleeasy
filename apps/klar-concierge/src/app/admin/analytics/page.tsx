import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const db = getDb();
  const [eventCounts, crmPending, crmFailed, converted, lost, topDestinations, leadCount] =
    await Promise.all([
      db.analyticsEvent.groupBy({ by: ["name"], _count: { name: true } }),
      db.lead.count({ where: { crmStatus: "pending" } }),
      db.lead.count({ where: { crmStatus: { in: ["failed", "manual_intervention"] } } }),
      db.lead.count({ where: { stage: "converted" } }),
      db.lead.count({ where: { stage: "lost" } }),
      db.lead.groupBy({
        by: ["selectedDestinationSlug"],
        _count: { selectedDestinationSlug: true },
        orderBy: { _count: { selectedDestinationSlug: "desc" } },
        take: 8,
      }),
      db.lead.count(),
    ]);

  const counts = Object.fromEntries(eventCounts.map((e) => [e.name, e._count.name]));
  const starts = counts["planner_started"] ?? 0;
  const submissions = counts["lead_submitted"] ?? 0;

  const funnel = [
    { label: "Planner starts", value: starts },
    { label: "Trip briefs completed", value: counts["trip_brief_completed"] ?? 0 },
    { label: "Recommendations viewed", value: counts["recommendations_viewed"] ?? 0 },
    { label: "Recommendation selected", value: counts["recommendation_selected"] ?? 0 },
    { label: "Itinerary viewed", value: counts["itinerary_viewed"] ?? 0 },
    { label: "Lead form started", value: counts["lead_form_started"] ?? 0 },
    { label: "Leads submitted", value: submissions },
    { label: "Submission failures", value: counts["lead_submission_failed"] ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">Analytics</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Anonymous funnel events only — no personal data is ever recorded.
      </p>

      {leadCount === 0 && starts === 0 ? (
        <div className="card mt-8 py-14 text-center text-foreground/60">
          <p className="font-medium text-brand">No analytics yet</p>
          <p className="mt-1 text-sm">Events appear as soon as customers use the planner.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {funnel.map((f) => (
              <div key={f.label} className="card py-4">
                <p className="text-2xl font-bold text-brand">{f.value}</p>
                <p className="mt-1 text-xs text-foreground/60">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <h2 className="font-semibold text-brand">Lead outcomes</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt>Total leads</dt><dd className="font-medium">{leadCount}</dd></div>
                <div className="flex justify-between"><dt>Converted</dt><dd className="font-medium">{converted}</dd></div>
                <div className="flex justify-between"><dt>Lost</dt><dd className="font-medium">{lost}</dd></div>
                <div className="flex justify-between"><dt>CRM pending</dt><dd className="font-medium">{crmPending}</dd></div>
                <div className="flex justify-between"><dt>CRM failed</dt><dd className="font-medium">{crmFailed}</dd></div>
                <div className="flex justify-between">
                  <dt>Lead → conversion rate</dt>
                  <dd className="font-medium">
                    {leadCount > 0 ? `${Math.round((converted / leadCount) * 100)}%` : "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="card">
              <h2 className="font-semibold text-brand">Top requested destinations</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {topDestinations.filter((d) => d.selectedDestinationSlug).map((d) => (
                  <li key={d.selectedDestinationSlug} className="flex justify-between">
                    <span>{d.selectedDestinationSlug}</span>
                    <span className="font-medium">{d._count.selectedDestinationSlug}</span>
                  </li>
                ))}
                {topDestinations.length === 0 ? (
                  <li className="text-foreground/55">No selections yet.</li>
                ) : null}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
