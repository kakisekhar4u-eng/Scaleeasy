import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Klar Travels handles the information you share with Klar Concierge.",
};

export default function PrivacyPage() {
  return (
    <div className="prose mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-brand">Privacy</h1>
      <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/75">
        <p>
          Klar Concierge collects the details you choose to share — your holiday preferences,
          and, when you submit a plan, your name, phone number, email and preferred contact
          method — so a Klar travel expert can contact you about your enquiry.
        </p>
        <p>
          Your plan is stored securely in Klar&rsquo;s own database. We do not sell your data.
          We never ask for passport or payment details inside Klar Concierge.
        </p>
        <p>
          Submitting a plan requires your explicit consent, recorded with a timestamp. You can
          ask Klar to delete your enquiry at any time by contacting Klar Travels.
        </p>
        <p>
          Product analytics are anonymous: we count steps like &ldquo;plan started&rdquo; or
          &ldquo;lead submitted&rdquo; and never include names, contact details, conversation
          content, dietary needs or accessibility information.
        </p>
        <p>
          Enquiry records are retained while your enquiry is active and for a reasonable
          period afterwards, in line with Klar Travels&rsquo; retention policy.
        </p>
      </div>
    </div>
  );
}
