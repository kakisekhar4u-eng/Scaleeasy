import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { DestinationReview } from "@/components/internal/DestinationReview";

export const dynamic = "force-dynamic";

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDb().destination.findUnique({
    where: { slug },
    include: { months: { orderBy: { month: "asc" } }, sources: true },
  });
  if (!destination) notFound();

  const profile = destination.profile as Record<string, unknown>;
  const summary = String(profile.summary ?? "");
  const positioningLine = String(profile.positioningLine ?? "");
  const tradeOffs = (profile.tradeOffs as string[]) ?? [];
  const signatureExperiences = (profile.signatureExperiences as string[]) ?? [];
  const hiddenGems = (profile.hiddenGems as string[]) ?? [];

  return (
    <div>
      <Link href="/admin/knowledge/destinations" className="btn-quiet text-sm">← All destinations</Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand">
          {destination.name}
          <span className="ml-2 text-sm font-normal text-foreground/55">{destination.country}</span>
        </h1>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          {destination.status} · v{destination.version}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-5">
          <section className="card">
            <h2 className="font-semibold text-brand">Profile</h2>
            <p className="mt-2 text-sm text-foreground/75">{summary}</p>
            <p className="mt-2 text-sm italic text-foreground/60">“{positioningLine}”</p>
          </section>

          <section className="card">
            <h2 className="font-semibold text-brand">Signature experiences</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-foreground/75">
              {signatureExperiences.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-brand">Hidden gems</h3>
            <ul className="mt-1 list-inside list-disc text-sm text-foreground/75">
              {hiddenGems.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
            <h3 className="mt-4 text-sm font-semibold text-brand">Trade-offs</h3>
            <ul className="mt-1 list-inside list-disc text-sm text-foreground/75">
              {tradeOffs.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </section>

          <section className="card">
            <h2 className="font-semibold text-brand">Monthly intelligence</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="text-foreground/55">
                  <tr>
                    <th className="py-1 pr-3">Month</th>
                    <th className="py-1 pr-3">Score</th>
                    <th className="py-1 pr-3">Season</th>
                    <th className="py-1 pr-3">Rain</th>
                    <th className="py-1 pr-3">Crowds</th>
                    <th className="py-1">Warnings</th>
                  </tr>
                </thead>
                <tbody>
                  {destination.months.map((m) => (
                    <tr key={m.month} className="border-t border-line">
                      <td className="py-1.5 pr-3">{m.month}</td>
                      <td className="py-1.5 pr-3">{m.seasonScore}</td>
                      <td className="py-1.5 pr-3">{m.seasonLabel}</td>
                      <td className="py-1.5 pr-3">{m.rainfall}</td>
                      <td className="py-1.5 pr-3">{m.crowdLevel}</td>
                      <td className="py-1.5">{(m.warnings as string[]).join("; ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2 className="font-semibold text-brand">Sources</h2>
            <ul className="mt-2 text-sm text-foreground/70">
              {destination.sources.map((s) => (
                <li key={s.id}>
                  {s.sourceName} ({s.sourceType}, reliability {s.reliability}) — accessed{" "}
                  {s.accessedAt.toISOString().slice(0, 10)}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <DestinationReview
          slug={destination.slug}
          status={destination.status}
          reviewedBy={destination.reviewedBy ?? ""}
        />
      </div>
    </div>
  );
}
