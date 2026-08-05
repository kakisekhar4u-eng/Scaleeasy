import type { TravelBrief } from "@/types/brief";
import type { LeadPriority } from "@/types/lead";

export type LeadScoreResult = {
  score: number;
  priority: LeadPriority;
  reasons: string[];
};

export type LeadScoringInput = {
  brief: TravelBrief;
  destinationSelected: boolean;
  itineraryViewed: boolean;
  contactChannelKnown: boolean;
  conversationMessages: number;
};

/** Deterministic 0–100 lead score used for consultant prioritisation. */
export function scoreLead(input: LeadScoringInput): LeadScoreResult {
  const { brief } = input;
  let score = 0;
  const reasons: string[] = [];

  if (brief.travelMonth) {
    score += 15;
    reasons.push("Travel timing known");
  }
  if (brief.durationNights) {
    score += 10;
    reasons.push("Duration known");
  }
  if (brief.travellerType && brief.adults > 0) {
    score += 15;
    reasons.push("Traveller composition complete");
  }
  if (input.destinationSelected) {
    score += 20;
    reasons.push("Destination selected");
  }
  if (input.itineraryViewed) {
    score += 10;
    reasons.push("Itinerary reviewed");
  }
  if (brief.budgetBand) {
    score += 10;
    reasons.push("Budget band known");
  }
  if (input.contactChannelKnown) {
    score += 5;
    reasons.push("Preferred contact channel known");
  }
  const travellers = brief.adults + brief.childrenAges.length + brief.seniorTravellers;
  if (travellers >= 4) {
    score += 5;
    reasons.push("Larger travelling party");
  }
  if (input.conversationMessages >= 4) {
    score += 10;
    reasons.push("Engaged conversation");
  } else if (input.conversationMessages >= 2) {
    score += 5;
  }

  score = Math.min(100, score);

  const priority: LeadPriority =
    score >= 85 ? "urgent" : score >= 65 ? "high" : score >= 40 ? "medium" : "low";

  return { score, priority, reasons };
}
