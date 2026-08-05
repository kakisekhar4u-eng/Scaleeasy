import Link from "next/link";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  verified: "bg-success-soft text-success",
  reviewed: "bg-warning-soft text-warning",
  draft: "bg-surface-muted text-foreground/50",
};

export default async function DestinationsPage() {
  const destinations = await getDb().destination.findMany({
    orderBy: { name: "asc" },
    select: {
      slug: true,
      name: true,
      country: true,
      region: true,
      status: true,
      reviewedBy: true,
      nextReviewAt: true,
      version: true,
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">KTIE destinations</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Seeded content is marked <em>reviewed</em> and requires Klar verification before launch.
        At least 10 destinations must be <em>verified</em> for Phase 1 readiness.
      </p>
      {destinations.length === 0 ? (
        <div className="card mt-8 py-14 text-center text-foreground/60">
          <p className="font-medium text-brand">No destinations in the database</p>
          <p className="mt-1 text-sm">Run <code>npm run db:seed</code> to load the KTIE seed pack.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-foreground/55">
              <tr>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reviewed by</th>
                <th className="px-4 py-3">Next review</th>
              </tr>
            </thead>
            <tbody>
              {destinations.map((d) => (
                <tr key={d.slug} className="border-b border-line last:border-0 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <Link href={`/admin/knowledge/destinations/${d.slug}`} className="font-medium text-brand underline">
                      {d.name}
                    </Link>
                    <span className="ml-2 text-xs text-foreground/50">{d.country}</span>
                  </td>
                  <td className="px-4 py-3">{d.region}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[d.status]}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{d.reviewedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">{d.nextReviewAt?.toISOString().slice(0, 10) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
