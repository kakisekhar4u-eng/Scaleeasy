"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TravelBrief } from "@/types/brief";
import type { ItineraryDay, Recommendation } from "@/types/recommendation";
import { BriefReview } from "./BriefReview";
import { RecommendationCards } from "./RecommendationCards";
import { ItineraryView } from "./ItineraryView";
import { LeadForm, type LeadFormValues } from "./LeadForm";
import { SuccessView } from "./SuccessView";

type Stage =
  | "conversation"
  | "brief-review"
  | "recommendations"
  | "itinerary"
  | "lead-capture"
  | "submitted";

type ChatMessage = { role: "user" | "assistant"; content: string; createdAt: string };

const CHIPS = [
  "Family holiday",
  "Honeymoon",
  "Best visited this month",
  "Relaxed beach escape",
  "Senior-friendly trip",
  "Something different",
];

const EXAMPLE =
  "We are a family of four from Hyderabad looking for a relaxed seven-night holiday in December. Our children are 6 and 10, and we enjoy food, easy sightseeing and fun activities.";

function track(name: string, props?: Record<string, unknown>) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, props }),
    keepalive: true,
  }).catch(() => undefined);
}

export function Planner() {
  const [stage, setStage] = useState<Stage>("conversation");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Tell us about the holiday you have in mind. Where would you like to go — or how would you like it to feel?",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [brief, setBrief] = useState<TravelBrief | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selected, setSelected] = useState<Recommendation | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [reference, setReference] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("planner_started");
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setBusy(true);
      setError(null);
      const userMessage: ChatMessage = {
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMessage]);
      setInput("");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, brief, turnIndex }),
        });
        if (res.status === 429) {
          setError("You're sending messages a little fast — give it a few seconds and try again.");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          brief: TravelBrief;
          assistantMessage: string;
          readyForRecommendations: boolean;
        };
        setBrief(data.brief);
        setReady(data.readyForRecommendations);
        setTurnIndex((t) => t + 1);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.assistantMessage, createdAt: new Date().toISOString() },
        ]);
        track("planner_message_sent");
      } catch {
        setError(
          "We couldn't process that just now. Your conversation is safe — please try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [brief, busy, turnIndex],
  );

  const goToBriefReview = useCallback(() => {
    if (!brief) return;
    setStage("brief-review");
    track("trip_brief_completed");
  }, [brief]);

  const fetchRecommendations = useCallback(
    async (finalBrief: TravelBrief) => {
      setBusy(true);
      setError(null);
      setBrief(finalBrief);
      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: finalBrief }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { recommendations: Recommendation[] };
        setRecommendations(data.recommendations);
        setStage("recommendations");
        track("recommendations_viewed");
      } catch {
        setError("We couldn't prepare recommendations just now. Please try again in a moment.");
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const selectRecommendation = useCallback(
    async (rec: Recommendation) => {
      if (!brief) return;
      setBusy(true);
      setError(null);
      setSelected(rec);
      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief, destinationSlug: rec.destinationSlug }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { itinerary: ItineraryDay[] };
        setItinerary(data.itinerary);
        setStage("itinerary");
        track("recommendation_selected", { destination: rec.destinationSlug, direction: rec.direction });
        track("itinerary_viewed", { destination: rec.destinationSlug });
      } catch {
        setError("We couldn't build the itinerary just now. Please try again.");
        setSelected(null);
      } finally {
        setBusy(false);
      }
    },
    [brief],
  );

  const submitLead = useCallback(
    async (values: LeadFormValues) => {
      if (!brief || !selected) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify({
            customer: values,
            brief,
            recommendations,
            selected: {
              conceptId: selected.conceptId,
              destinationSlug: selected.destinationSlug,
              direction: selected.direction,
            },
            itinerary,
            transcript: messages,
          }),
        });
        if (res.status === 429) {
          setError("Too many attempts in a short time. Please wait a minute and try again.");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { reference: string };
        setReference(data.reference);
        setStage("submitted");
        track("lead_submitted", { destination: selected.destinationSlug });
      } catch {
        track("lead_submission_failed");
        setError(
          "We couldn't submit your plan just now. Nothing has been lost — please try again in a moment.",
        );
      } finally {
        setBusy(false);
      }
    },
    [brief, selected, recommendations, itinerary, messages, idempotencyKey],
  );

  // ---------- Render per stage ----------

  if (stage === "submitted" && reference && selected) {
    return <SuccessView reference={reference} destinationName={selected.destinationName} />;
  }

  return (
    <div>
      <StageIndicator stage={stage} />
      {error ? (
        <p role="alert" className="mb-4 rounded-lg bg-accent-soft px-4 py-3 text-sm text-accent-strong">
          {error}
        </p>
      ) : null}

      {stage === "conversation" ? (
        <section aria-label="Holiday conversation">
          <h1 className="text-2xl font-bold text-brand sm:text-3xl">
            Tell us about the holiday you have in mind.
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            For example: &ldquo;{EXAMPLE}&rdquo;
          </p>

          <div
            ref={logRef}
            aria-live="polite"
            className="mt-6 max-h-[45vh] space-y-3 overflow-y-auto rounded-2xl border border-line bg-surface p-4"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm text-white"
                    : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-muted px-4 py-2.5 text-sm text-foreground"
                }
              >
                {m.content}
              </div>
            ))}
            {busy ? (
              <p className="text-sm text-foreground/50" aria-live="polite">
                Klar is thinking…
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Quick ideas">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="chip"
                onClick={() => setInput((v) => (v ? `${v} ${chip.toLowerCase()}` : chip))}
              >
                {chip}
              </button>
            ))}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <label htmlFor="planner-input" className="sr-only">
              Describe your holiday
            </label>
            <input
              id="planner-input"
              className="field-input mt-0 flex-1"
              placeholder="Describe your holiday…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              autoComplete="off"
            />
            <button type="submit" className="btn-primary shrink-0" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>

          {ready && brief ? (
            <div className="mt-6 rounded-2xl bg-success-soft p-4 text-center">
              <p className="text-sm text-success">Your trip brief is taking shape.</p>
              <button type="button" className="btn-primary mt-3" onClick={goToBriefReview}>
                Review My Trip Brief
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {stage === "brief-review" && brief ? (
        <BriefReview
          brief={brief}
          busy={busy}
          onBack={() => setStage("conversation")}
          onConfirm={(b) => void fetchRecommendations(b)}
        />
      ) : null}

      {stage === "recommendations" ? (
        <RecommendationCards
          recommendations={recommendations}
          busy={busy}
          onBack={() => setStage("brief-review")}
          onSelect={(rec) => void selectRecommendation(rec)}
        />
      ) : null}

      {stage === "itinerary" && selected ? (
        <ItineraryView
          destinationName={selected.destinationName}
          itinerary={itinerary}
          onBack={() => setStage("recommendations")}
          onContinue={() => {
            setStage("lead-capture");
            track("lead_form_started");
          }}
        />
      ) : null}

      {stage === "lead-capture" && selected ? (
        <LeadForm
          destinationName={selected.destinationName}
          busy={busy}
          onBack={() => setStage("itinerary")}
          onSubmit={(values) => void submitLead(values)}
        />
      ) : null}
    </div>
  );
}

const STAGE_LABELS: Array<{ key: Stage; label: string }> = [
  { key: "conversation", label: "Conversation" },
  { key: "brief-review", label: "Trip brief" },
  { key: "recommendations", label: "Directions" },
  { key: "itinerary", label: "Itinerary" },
  { key: "lead-capture", label: "Handover" },
];

function StageIndicator({ stage }: { stage: Stage }) {
  const activeIndex = STAGE_LABELS.findIndex((s) => s.key === stage);
  return (
    <nav aria-label="Planning progress" className="mb-8">
      <ol className="flex flex-wrap items-center gap-2 text-xs">
        {STAGE_LABELS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              aria-current={i === activeIndex ? "step" : undefined}
              className={
                i === activeIndex
                  ? "rounded-full bg-brand px-3 py-1 font-semibold text-white"
                  : i < activeIndex
                    ? "rounded-full bg-success-soft px-3 py-1 font-medium text-success"
                    : "rounded-full bg-surface-muted px-3 py-1 text-foreground/50"
              }
            >
              {s.label}
            </span>
            {i < STAGE_LABELS.length - 1 ? (
              <span aria-hidden className="text-foreground/30">→</span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
