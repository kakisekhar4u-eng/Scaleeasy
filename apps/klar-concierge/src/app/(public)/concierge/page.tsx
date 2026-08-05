import type { Metadata } from "next";
import { Planner } from "@/components/planner/Planner";

export const metadata: Metadata = {
  title: "Plan a Holiday",
  description:
    "Tell Klar about the holiday you have in mind and receive three personalised destination directions with a draft itinerary.",
};

export default function ConciergePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Planner />
    </div>
  );
}
