"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGES = [
  "new-enquiry",
  "consultant-assigned",
  "contact-attempted",
  "requirement-confirmed",
  "quote-in-preparation",
  "quote-sent",
  "follow-up",
  "converted",
  "lost",
];

export function LeadActions({
  leadId,
  currentStage,
  currentOwner,
  followUpDueAt,
  crmStatus,
  copyText,
}: {
  leadId: string;
  currentStage: string;
  currentOwner: string;
  followUpDueAt: string;
  crmStatus: string;
  copyText: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [owner, setOwner] = useState(currentOwner);
  const [followUp, setFollowUp] = useState(followUpDueAt);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/consultant/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/consultant/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: note.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setNote("");
      setMessage("Note added.");
      router.refresh();
    } catch {
      setMessage("Could not add the note — please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function retryCrm() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/consultant/leads/${leadId}/retry-crm`, { method: "POST" });
      const data = (await res.json()) as { message?: string };
      setMessage(data.message ?? (res.ok ? "Retry attempted." : "Retry failed."));
      router.refresh();
    } catch {
      setMessage("Retry failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2 className="font-semibold text-brand">Actions</h2>
      {message ? <p className="mt-2 text-xs text-foreground/60" role="status">{message}</p> : null}

      <div className="mt-3 space-y-3 text-sm">
        <div>
          <label htmlFor="act-stage" className="field-label">Stage</label>
          <select
            id="act-stage"
            className="field-input"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="button" className="btn-secondary mt-2 w-full" disabled={busy} onClick={() => void patch({ stage })}>
            Update stage
          </button>
        </div>

        <div>
          <label htmlFor="act-owner" className="field-label">Assign consultant</label>
          <input
            id="act-owner"
            className="field-input"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Consultant name"
          />
          <button type="button" className="btn-secondary mt-2 w-full" disabled={busy} onClick={() => void patch({ consultantOwner: owner.trim() || null })}>
            Assign
          </button>
        </div>

        <div>
          <label htmlFor="act-followup" className="field-label">Follow-up date</label>
          <input
            id="act-followup"
            type="date"
            className="field-input"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
          />
          <button type="button" className="btn-secondary mt-2 w-full" disabled={busy} onClick={() => void patch({ followUpDueAt: followUp || null })}>
            Set follow-up
          </button>
        </div>

        <div>
          <label htmlFor="act-note" className="field-label">Add note</label>
          <textarea
            id="act-note"
            className="field-input"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button type="button" className="btn-secondary mt-2 w-full" disabled={busy || !note.trim()} onClick={() => void addNote()}>
            Add note
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void patch({ stage: "converted" })}>
            Mark converted
          </button>
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void patch({ stage: "lost" })}>
            Mark lost
          </button>
        </div>

        {crmStatus === "failed" || crmStatus === "manual-intervention" ? (
          <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void retryCrm()}>
            Retry CRM delivery
          </button>
        ) : null}

        <button
          type="button"
          className="btn-quiet w-full"
          onClick={() => {
            void navigator.clipboard.writeText(copyText).then(() => setMessage("Copied lead summary."));
          }}
        >
          Copy lead summary
        </button>
      </div>
    </section>
  );
}
