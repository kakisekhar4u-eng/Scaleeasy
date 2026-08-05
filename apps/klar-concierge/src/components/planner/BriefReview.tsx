"use client";

import { useState } from "react";
import type { BudgetBand, Pace, TravelBrief, TravellerType } from "@/types/brief";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const TRAVELLER_TYPES: TravellerType[] = [
  "family", "couple", "honeymoon", "solo", "friends", "senior", "corporate",
];
const PACES: Pace[] = ["relaxed", "balanced", "active"];
const BUDGETS: BudgetBand[] = ["value", "comfort", "premium", "luxury"];
const INTEREST_OPTIONS = [
  "beach", "food", "culture", "history", "city", "shopping", "adventure",
  "nature", "relaxation", "nightlife", "themeparks", "romance", "wildlife", "snow",
];

export function BriefReview({
  brief,
  busy,
  onBack,
  onConfirm,
}: {
  brief: TravelBrief;
  busy: boolean;
  onBack: () => void;
  onConfirm: (brief: TravelBrief) => void;
}) {
  const [draft, setDraft] = useState<TravelBrief>(brief);

  function set<K extends keyof TravelBrief>(key: K, value: TravelBrief[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <section aria-labelledby="brief-heading">
      <h1 id="brief-heading" className="text-2xl font-bold text-brand sm:text-3xl">
        Your trip brief
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Check the details and adjust anything before we suggest destinations.
      </p>

      <form
        className="mt-6 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm(draft);
        }}
      >
        <div>
          <label className="field-label" htmlFor="bf-origin">Starting city</label>
          <input
            id="bf-origin"
            className="field-input"
            value={draft.originCity ?? ""}
            onChange={(e) => set("originCity", e.target.value || undefined)}
            placeholder="e.g. Hyderabad"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="bf-month">Travel month</label>
          <select
            id="bf-month"
            className="field-input"
            value={draft.travelMonth ?? ""}
            onChange={(e) => set("travelMonth", e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Not sure yet</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="bf-nights">Nights</label>
          <input
            id="bf-nights"
            type="number"
            min={1}
            max={30}
            className="field-input"
            value={draft.durationNights ?? ""}
            onChange={(e) =>
              set("durationNights", e.target.value ? Number(e.target.value) : undefined)
            }
          />
        </div>
        <div>
          <label className="field-label" htmlFor="bf-type">Trip type</label>
          <select
            id="bf-type"
            className="field-input"
            value={draft.travellerType ?? ""}
            onChange={(e) =>
              set("travellerType", (e.target.value || undefined) as TravellerType | undefined)
            }
          >
            <option value="">Choose…</option>
            {TRAVELLER_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="bf-adults">Adults</label>
          <input
            id="bf-adults"
            type="number"
            min={1}
            max={20}
            className="field-input"
            value={draft.adults}
            onChange={(e) => set("adults", Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="bf-children">Children&rsquo;s ages</label>
          <input
            id="bf-children"
            className="field-input"
            value={draft.childrenAges.join(", ")}
            onChange={(e) =>
              set(
                "childrenAges",
                e.target.value
                  .split(/[,\s]+/)
                  .map((v) => parseInt(v, 10))
                  .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 17),
              )
            }
            placeholder="e.g. 6, 10"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="bf-seniors">Senior travellers</label>
          <input
            id="bf-seniors"
            type="number"
            min={0}
            max={20}
            className="field-input"
            value={draft.seniorTravellers}
            onChange={(e) => set("seniorTravellers", Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="bf-pace">Pace</label>
          <select
            id="bf-pace"
            className="field-input"
            value={draft.pace ?? ""}
            onChange={(e) => set("pace", (e.target.value || undefined) as Pace | undefined)}
          >
            <option value="">Choose…</option>
            {PACES.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="bf-budget">Comfort level</label>
          <select
            id="bf-budget"
            className="field-input"
            value={draft.budgetBand ?? ""}
            onChange={(e) => set("budgetBand", (e.target.value || undefined) as BudgetBand | undefined)}
          >
            <option value="">Not sure yet</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <fieldset>
            <legend className="field-label">Interests</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const active = draft.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    aria-pressed={active}
                    className={
                      active
                        ? "chip border-brand bg-brand-soft font-medium"
                        : "chip"
                    }
                    onClick={() =>
                      set(
                        "interests",
                        active
                          ? draft.interests.filter((i) => i !== interest)
                          : [...draft.interests, interest],
                      )
                    }
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 sm:col-span-2">
          <button type="button" className="btn-secondary" onClick={onBack} disabled={busy}>
            Back to conversation
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Finding directions…" : "Show My Three Directions"}
          </button>
        </div>
      </form>
    </section>
  );
}
