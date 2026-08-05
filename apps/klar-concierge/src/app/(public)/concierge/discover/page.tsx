import type { Metadata } from "next";
import Link from "next/link";
import { buildDiscoverCollections } from "@/services/ktie/discover";

export const metadata: Metadata = {
  title: "Discover",
  description: "Destination ideas from Klar's travel intelligence — by season, traveller and taste.",
};

export default function DiscoverPage() {
  const month = new Date().getMonth() + 1;
  const collections = buildDiscoverCollections(month);

  return (
    <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-brand">Discover</h1>
      <p className="mt-3 max-w-2xl text-foreground/70">
        Ideas from Klar&rsquo;s destination intelligence. When something catches your eye,
        start a conversation and we&rsquo;ll shape it around you.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {collections.map((c) => (
          <section key={c.key} aria-labelledby={`col-${c.key}`} className="card">
            <h2 id={`col-${c.key}`} className="font-semibold text-brand">{c.title}</h2>
            <p className="mt-1 text-sm text-foreground/65">{c.description}</p>
            <ul className="mt-4 space-y-3">
              {c.destinations.map((d) => (
                <li key={d.slug} className="rounded-lg bg-surface-muted px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-brand">{d.name}</span>
                    <span className="text-xs text-foreground/55">{d.country}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/65">{d.positioningLine}</p>
                  {d.seasonLabel ? (
                    <p className="mt-1 text-xs text-foreground/55">This month: {d.seasonLabel}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link href="/concierge" className="btn-primary">Plan My Holiday</Link>
      </div>
    </div>
  );
}
