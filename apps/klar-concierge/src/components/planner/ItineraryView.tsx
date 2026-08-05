"use client";

import type { ItineraryDay } from "@/types/recommendation";

const PACE_LABEL: Record<ItineraryDay["pace"], string> = {
  light: "Light day",
  balanced: "Balanced day",
  active: "Active day",
};

export function ItineraryView({
  destinationName,
  itinerary,
  onBack,
  onContinue,
}: {
  destinationName: string;
  itinerary: ItineraryDay[];
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <section aria-labelledby="itin-heading">
      <h1 id="itin-heading" className="text-2xl font-bold text-brand sm:text-3xl">
        Your {destinationName} itinerary
      </h1>
      <p className="mt-2 rounded-lg bg-brand-soft px-4 py-2.5 text-sm font-medium text-brand">
        A starting plan for your Klar expert to refine.
      </p>

      <ol className="mt-6 space-y-4">
        {itinerary.map((day) => (
          <li key={day.day} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold text-brand">
                Day {day.day} — {day.title}
              </h2>
              <span className="text-xs text-foreground/55">{PACE_LABEL[day.pace]}</span>
            </div>
            <ul className="mt-3 space-y-2">
              {day.activities.map((activity, i) => (
                <li key={i} className="text-sm">
                  <span className="font-medium text-foreground">
                    {activity.title}
                    {activity.optional ? (
                      <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-xs font-normal text-foreground/60">
                        optional
                      </span>
                    ) : null}
                  </span>
                  <p className="text-foreground/65">{activity.description}</p>
                </li>
              ))}
            </ul>
            {day.notes.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-line pt-2 text-xs text-foreground/55">
                {day.notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" className="btn-secondary" onClick={onBack}>
          ← Other directions
        </button>
        <button type="button" className="btn-primary" onClick={onContinue}>
          Let Klar Finalise My Holiday
        </button>
      </div>
    </section>
  );
}
