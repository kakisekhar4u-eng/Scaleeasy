import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for Klar Concierge by Klar Travels.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-brand">Terms of use</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/75">
        <p>
          Klar Concierge is a planning assistant provided by Klar Travels. It suggests
          destination directions and draft itineraries based on your stated preferences and
          Klar&rsquo;s destination knowledge.
        </p>
        <p>
          Klar Concierge does not display live availability, live pricing or booking
          confirmation, and nothing in the planner constitutes a reservation, quotation or
          contract. Seasonal notes and practical guidance are indicative; visa rules and
          operational details are verified by your Klar travel expert.
        </p>
        <p>
          Submitting your plan creates an enquiry. A Klar travel expert will contact you to
          confirm requirements and prepare a formal quotation, which is the only document
          that defines prices and inclusions.
        </p>
        <p>
          Please use Klar Concierge fairly and provide accurate information so we can help
          you well.
        </p>
      </div>
    </div>
  );
}
