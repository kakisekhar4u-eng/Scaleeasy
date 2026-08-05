import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { stageFromDb } from "@/lib/enums";
import { LeadActions } from "@/components/internal/LeadActions";
import type { TravelBrief } from "@/types/brief";
import type { ItineraryDay } from "@/types/recommendation";

export const dynamic = "force-dynamic";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      recommendations: true,
      notes: { orderBy: { createdAt: "desc" } },
      crmDeliveries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!lead) notFound();

  const brief = lead.tripBrief as unknown as TravelBrief;
  const itinerary = lead.itinerary as unknown as ItineraryDay[];
  const transcript = lead.transcript as unknown as Array<{ role: string; content: string }>;

  return (
    <div>
      <Link href="/consultant" className="btn-quiet text-sm">← All leads</Link>
      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand">
          {lead.customerName}
          <span className="ml-3 font-mono text-sm font-normal text-foreground/55">{lead.reference}</span>
        </h1>
        <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
          {stageFromDb(lead.stage)} · {lead.priority} · score {lead.leadScore}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-5">
          {/* Contact */}
          <section className="card">
            <h2 className="font-semibold text-brand">Customer</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-foreground/55">Phone</dt><dd className="font-medium">{lead.customerPhone}</dd></div>
              <div><dt className="text-foreground/55">Email</dt><dd className="font-medium">{lead.customerEmail}</dd></div>
              <div><dt className="text-foreground/55">Preferred channel</dt><dd>{lead.preferredContactChannel}</dd></div>
              <div><dt className="text-foreground/55">Best time</dt><dd>{lead.preferredContactTime || "—"}</dd></div>
            </dl>
            {lead.additionalNotes ? (
              <p className="mt-3 rounded-lg bg-surface-muted p-3 text-sm">{lead.additionalNotes}</p>
            ) : null}
            <p className="mt-3 text-xs text-foreground/50">
              Consent recorded {lead.consentTimestamp.toISOString()}
            </p>
          </section>

          {/* Brief */}
          <section className="card">
            <h2 className="font-semibold text-brand">Travel brief</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-foreground/55">From</dt><dd>{brief.originCity ?? "—"}</dd></div>
              <div><dt className="text-foreground/55">Month</dt><dd>{brief.travelMonth ? MONTHS[brief.travelMonth - 1] : "—"}</dd></div>
              <div><dt className="text-foreground/55">Nights</dt><dd>{brief.durationNights ?? "—"}</dd></div>
              <div><dt className="text-foreground/55">Type</dt><dd>{brief.travellerType ?? "—"}</dd></div>
              <div><dt className="text-foreground/55">Party</dt><dd>{brief.adults} adults{brief.childrenAges.length ? `, children ${brief.childrenAges.join(", ")}` : ""}{brief.seniorTravellers ? `, ${brief.seniorTravellers} seniors` : ""}</dd></div>
              <div><dt className="text-foreground/55">Pace / budget</dt><dd>{brief.pace ?? "—"} / {brief.budgetBand ?? "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-foreground/55">Interests</dt><dd>{brief.interests.join(", ") || "—"}</dd></div>
              {brief.accessibilityNeeds.length ? (
                <div className="sm:col-span-2"><dt className="text-foreground/55">Accessibility</dt><dd>{brief.accessibilityNeeds.join(", ")}</dd></div>
              ) : null}
              {brief.foodPreferences.length ? (
                <div className="sm:col-span-2"><dt className="text-foreground/55">Food</dt><dd>{brief.foodPreferences.join(", ")}</dd></div>
              ) : null}
            </dl>
            <p className="mt-3 rounded-lg bg-surface-muted p-3 text-xs text-foreground/65">
              Original prompt: “{brief.originalPrompt}”
            </p>
          </section>

          {/* Recommendations */}
          <section className="card">
            <h2 className="font-semibold text-brand">Recommendations shown</h2>
            <ul className="mt-3 space-y-3 text-sm">
              {lead.recommendations.map((r) => (
                <li key={r.id} className={`rounded-lg border p-3 ${r.destinationSlug === lead.selectedDestinationSlug ? "border-accent bg-accent-soft/40" : "border-line"}`}>
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{r.destinationSlug}</span>
                    <span className="text-xs text-foreground/55">{r.direction}{r.destinationSlug === lead.selectedDestinationSlug ? " · selected" : ""}</span>
                  </div>
                  <ul className="mt-1 list-inside list-disc text-foreground/70">
                    {(r.reasons as string[]).map((reason, i) => <li key={i}>{reason}</li>)}
                  </ul>
                  <p className="mt-1 text-xs text-foreground/55">Trade-off: {r.tradeOff}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Itinerary */}
          <section className="card">
            <h2 className="font-semibold text-brand">Draft itinerary</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {itinerary.map((d) => (
                <li key={d.day} className="rounded-lg bg-surface-muted p-3">
                  <p className="font-medium">Day {d.day} — {d.title} <span className="text-xs text-foreground/50">({d.pace})</span></p>
                  <ul className="mt-1 list-inside list-disc text-foreground/70">
                    {d.activities.map((a, i) => (
                      <li key={i}>{a.title}{a.optional ? " (optional)" : ""}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          {/* Transcript */}
          <section className="card">
            <h2 className="font-semibold text-brand">Conversation transcript</h2>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
              {transcript.map((m, i) => (
                <p key={i} className={m.role === "user" ? "rounded-lg bg-brand-soft p-2" : "rounded-lg bg-surface-muted p-2"}>
                  <span className="font-medium">{m.role === "user" ? "Customer" : "Concierge"}:</span>{" "}
                  {m.content}
                </p>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar: actions, CRM, notes */}
        <div className="space-y-5">
          <LeadActions
            leadId={lead.id}
            currentStage={stageFromDb(lead.stage)}
            currentOwner={lead.consultantOwner ?? ""}
            followUpDueAt={lead.followUpDueAt?.toISOString().slice(0, 10) ?? ""}
            crmStatus={lead.crmStatus.replace(/_/g, "-")}
            copyText={buildCopySummary(lead.reference, lead.customerName, lead.customerPhone, lead.customerEmail, brief, lead.selectedDestinationSlug)}
          />

          <section className="card">
            <h2 className="font-semibold text-brand">CRM delivery</h2>
            <p className="mt-2 text-sm">
              Status: <span className="font-medium">{lead.crmStatus.replace(/_/g, " ")}</span>
              {lead.crmReferenceId ? <> · ref {lead.crmReferenceId}</> : null}
            </p>
            {lead.crmStatus === "disabled" ? (
              <p className="mt-2 rounded-lg bg-surface-muted p-3 text-xs text-foreground/65">
                CRM/RMS integration is not configured. This lead is stored safely in Klar&rsquo;s
                database and can be handled by the team.
              </p>
            ) : null}
            {lead.crmDeliveries.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-foreground/60">
                {lead.crmDeliveries.map((d) => (
                  <li key={d.id}>
                    #{d.attempt} {d.status} {d.errorCode ? `(${d.errorCode})` : ""} —{" "}
                    {d.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className="card">
            <h2 className="font-semibold text-brand">Notes</h2>
            {lead.notes.length === 0 ? (
              <p className="mt-2 text-sm text-foreground/55">No notes yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {lead.notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-surface-muted p-3">
                    <p>{n.body}</p>
                    <p className="mt-1 text-xs text-foreground/50">
                      {n.authorName} · {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function buildCopySummary(
  reference: string,
  name: string,
  phone: string,
  email: string,
  brief: TravelBrief,
  destination: string | null,
): string {
  return [
    `Klar lead ${reference}`,
    `Customer: ${name} · ${phone} · ${email}`,
    `Destination: ${destination ?? "—"}`,
    `Month: ${brief.travelMonth ?? "—"} · Nights: ${brief.durationNights ?? "—"} · Type: ${brief.travellerType ?? "—"}`,
    `Party: ${brief.adults} adults${brief.childrenAges.length ? `, children ${brief.childrenAges.join(", ")}` : ""}${brief.seniorTravellers ? `, ${brief.seniorTravellers} seniors` : ""}`,
    `Interests: ${brief.interests.join(", ") || "—"}`,
  ].join("\n");
}
