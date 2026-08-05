import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How Klar Concierge turns a conversation into a personalised holiday plan, finished by a Klar travel expert.",
};

const STAGES = [
  {
    title: "1. Tell us about your holiday",
    copy: "Start with anything — a destination, a month, a feeling. Klar Concierge asks one useful question at a time to understand who's travelling, when, for how long and what you enjoy.",
  },
  {
    title: "2. Review your trip brief",
    copy: "Your preferences become a clear, editable summary. Change anything before Klar suggests destinations.",
  },
  {
    title: "3. Compare three directions",
    copy: "Klar's destination intelligence proposes a Best Match, a Best for Your Taste and a Something Special option — each with honest reasons and one trade-off.",
  },
  {
    title: "4. Shape the itinerary",
    copy: "See a practical day-by-day starting plan for your chosen destination, paced the way you like to travel.",
  },
  {
    title: "5. A Klar expert takes over",
    copy: "Share your contact details and consent, and a Klar travel expert reviews the full plan, verifies practical details like visas and seasons, and prepares your quotation.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-brand">How Klar Concierge works</h1>
      <p className="mt-3 text-foreground/70">
        A calm, guided way to plan — with a real Klar travel expert completing every holiday.
      </p>
      <ol className="mt-10 space-y-6">
        {STAGES.map((s) => (
          <li key={s.title} className="card">
            <h2 className="font-semibold text-brand">{s.title}</h2>
            <p className="mt-2 text-sm text-foreground/70">{s.copy}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-2xl bg-surface-muted p-6">
        <h2 className="font-semibold text-brand">What Klar Concierge is not</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Klar Concierge doesn&rsquo;t show live prices, availability or bookings. It prepares a
          qualified plan; your Klar expert confirms every operational detail before quoting.
        </p>
      </div>
      <div className="mt-10">
        <Link href="/concierge" className="btn-primary">Plan My Holiday</Link>
      </div>
    </div>
  );
}
