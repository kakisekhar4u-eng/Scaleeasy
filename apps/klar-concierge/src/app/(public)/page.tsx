import Link from "next/link";
import { buildDiscoverCollections } from "@/services/ktie/discover";

const STEPS = [
  { n: 1, title: "Tell us about your holiday", copy: "Describe where you want to go — or simply how you want it to feel." },
  { n: 2, title: "Compare three personalised directions", copy: "Klar suggests three destinations matched to your season, taste and travellers." },
  { n: 3, title: "Shape your itinerary", copy: "Review a practical day-by-day starting plan for your chosen direction." },
  { n: 4, title: "Let a Klar expert finalise it", copy: "A real Klar travel expert reviews everything and prepares your quotation." },
];

export default function LandingPage() {
  const month = new Date().getMonth() + 1;
  const collections = buildDiscoverCollections(month).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="bg-surface">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold leading-tight text-brand sm:text-5xl">
              Your perfect holiday starts with a conversation.
            </h1>
            <p className="mt-5 text-lg text-foreground/75">
              Tell Klar where you want to go—or simply how you want the holiday to feel.
              We&rsquo;ll help you discover the right destination, shape the itinerary and
              connect you with a Klar travel expert.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/concierge" className="btn-primary">Plan My Holiday</Link>
              <Link href="/concierge/how-it-works" className="btn-secondary">See How It Works</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery collections */}
      <section aria-labelledby="collections-heading" className="mx-auto max-w-content px-4 py-14 sm:px-6">
        <h2 id="collections-heading" className="text-2xl font-bold text-brand">
          Where could you go?
        </h2>
        <p className="mt-2 text-foreground/70">
          A taste of the destinations Klar knows well, matched to the time of year.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {collections.map((c) => (
            <div key={c.key} className="card">
              <h3 className="font-semibold text-brand">{c.title}</h3>
              <p className="mt-1 text-sm text-foreground/65">{c.description}</p>
              <ul className="mt-4 space-y-2">
                {c.destinations.map((d) => (
                  <li key={d.slug} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-right text-foreground/60">{d.positioningLine}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/concierge/discover" className="btn-quiet">
            See all collections →
          </Link>
        </div>
      </section>

      {/* How Klar helps */}
      <section aria-labelledby="steps-heading" className="bg-surface-muted">
        <div className="mx-auto max-w-content px-4 py-14 sm:px-6">
          <h2 id="steps-heading" className="text-2xl font-bold text-brand">How Klar helps</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.n} className="card">
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
                >
                  {s.n}
                </span>
                <h3 className="mt-3 font-semibold text-brand">{s.title}</h3>
                <p className="mt-1 text-sm text-foreground/65">{s.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Human handover */}
      <section className="mx-auto max-w-content px-4 py-14 sm:px-6">
        <div className="rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
          <h2 className="text-2xl font-bold">AI-assisted planning. Human travel expertise.</h2>
          <p className="mt-3 max-w-2xl text-white/80">
            Klar Concierge helps organise your ideas and preferences. A Klar travel expert
            reviews the complete plan before preparing the final quotation.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/concierge" className="btn-primary">Let Klar Finalise My Holiday</Link>
            <Link
              href="/concierge"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Talk to a Klar Travel Expert
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
