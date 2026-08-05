"use client";

import type { Recommendation } from "@/types/recommendation";

export function RecommendationCards({
  recommendations,
  busy,
  onBack,
  onSelect,
}: {
  recommendations: Recommendation[];
  busy: boolean;
  onBack: () => void;
  onSelect: (rec: Recommendation) => void;
}) {
  return (
    <section aria-labelledby="rec-heading">
      <h1 id="rec-heading" className="text-2xl font-bold text-brand sm:text-3xl">
        Three directions for your holiday
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Each one is matched to your season, travellers and taste — with one honest trade-off.
      </p>

      <div className="mt-6 space-y-5">
        {recommendations.map((rec) => (
          <article key={rec.conceptId} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                {rec.directionLabel}
              </span>
              <span className="text-xs text-foreground/55">
                Match {Math.round(rec.score.overall)}%
              </span>
            </div>
            <h2 className="mt-3 text-xl font-bold text-brand">
              {rec.destinationName}
              <span className="ml-2 text-sm font-normal text-foreground/55">{rec.country}</span>
            </h2>
            <p className="mt-1 text-sm text-foreground/70">{rec.positioningLine}</p>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-brand">Season</dt>
                <dd className="text-foreground/70">{rec.seasonalFit}</dd>
              </div>
              <div>
                <dt className="font-medium text-brand">Suits</dt>
                <dd className="text-foreground/70">
                  {rec.travellerSuitability} · ideal {rec.idealNights} nights
                </dd>
              </div>
            </dl>

            <ul className="mt-4 space-y-1.5 text-sm text-foreground/75">
              {rec.reasons.map((reason, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className="text-success">✓</span>
                  {reason}
                </li>
              ))}
            </ul>

            <p className="mt-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
              <span className="font-medium">Worth knowing:</span> {rec.tradeOff}
            </p>

            <button
              type="button"
              className="btn-primary mt-4 w-full sm:w-auto"
              disabled={busy}
              onClick={() => onSelect(rec)}
            >
              {busy ? "Preparing…" : "View This Holiday"}
            </button>
          </article>
        ))}
      </div>

      <button type="button" className="btn-quiet mt-6" onClick={onBack} disabled={busy}>
        ← Adjust my trip brief
      </button>
    </section>
  );
}
