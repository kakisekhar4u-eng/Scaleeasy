"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const VERIFICATION_CHECKLIST = [
  "Seasonal guidance matches Klar's operational experience",
  "Suitability scores reviewed for families, children and seniors",
  "Signature experiences are bookable through Klar's partners",
  "Trade-offs and who-should-avoid are honest and current",
  "Visa complexity marked 'verify' where rules change often",
];

export function DestinationReview({
  slug,
  status,
  reviewedBy,
}: {
  slug: string;
  status: string;
  reviewedBy: string;
}) {
  const router = useRouter();
  const [reviewer, setReviewer] = useState(reviewedBy);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function setStatus(next: "draft" | "reviewed" | "verified") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/destinations/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, reviewedBy: reviewer }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage("Saved.");
      router.refresh();
    } catch {
      setMessage("Could not save — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card h-fit">
      <h2 className="font-semibold text-brand">Review &amp; verification</h2>
      <p className="mt-1 text-xs text-foreground/55">Current status: {status}</p>
      {message ? <p role="status" className="mt-2 text-xs text-foreground/60">{message}</p> : null}

      <ul className="mt-3 space-y-1.5 text-xs text-foreground/70">
        {VERIFICATION_CHECKLIST.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden>☐</span>
            {item}
          </li>
        ))}
      </ul>

      <label htmlFor="rev-name" className="field-label mt-4">Reviewer</label>
      <input
        id="rev-name"
        className="field-input"
        value={reviewer}
        onChange={(e) => setReviewer(e.target.value)}
        placeholder="Your name"
      />

      <div className="mt-3 space-y-2">
        <button
          type="button"
          className="btn-primary w-full"
          disabled={busy || !reviewer.trim()}
          onClick={() => void setStatus("verified")}
        >
          Mark verified
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={busy}
          onClick={() => void setStatus("reviewed")}
        >
          Mark reviewed
        </button>
        <button
          type="button"
          className="btn-quiet w-full"
          disabled={busy}
          onClick={() => void setStatus("draft")}
        >
          Back to draft
        </button>
      </div>
    </section>
  );
}
