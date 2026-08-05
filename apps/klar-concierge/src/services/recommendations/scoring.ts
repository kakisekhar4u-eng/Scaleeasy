import type { TravelBrief } from "@/types/brief";
import type { DestinationKnowledge } from "@/types/destination";
import type {
  Recommendation,
  RecommendationDirection,
  RecommendationScore,
} from "@/types/recommendation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function scoreDestination(
  destination: DestinationKnowledge,
  brief: TravelBrief,
): RecommendationScore {
  // Season fit
  const month = brief.travelMonth;
  const monthIntel = month
    ? destination.monthlyIntelligence.find((m) => m.month === month)
    : undefined;
  const season = monthIntel ? monthIntel.seasonScore : 60;

  // Traveller-type fit
  const s = destination.suitability;
  let traveller = 70;
  switch (brief.travellerType) {
    case "family":
      traveller = s.family;
      break;
    case "honeymoon":
      traveller = s.honeymoon;
      break;
    case "couple":
      traveller = Math.round(s.honeymoon * 0.7 + s.solo * 0.3);
      break;
    case "solo":
      traveller = s.solo;
      break;
    case "friends":
      traveller = Math.round((s.solo + s.teenagers) / 2);
      break;
    case "senior":
      traveller = s.seniors;
      break;
    case "corporate":
      traveller = Math.round((s.solo + (destination.interests.city ?? 50)) / 2);
      break;
  }

  // Child-age suitability
  let children = 100;
  if (brief.childrenAges.length > 0) {
    const perChild = brief.childrenAges.map((age) => {
      if (age <= 4) return s.toddlers;
      if (age <= 10) return s.children5To10;
      return s.teenagers;
    });
    children = Math.round(perChild.reduce((a, b) => a + b, 0) / perChild.length);
  }

  // Senior suitability
  const seniors = brief.seniorTravellers > 0 || brief.travellerType === "senior" ? s.seniors : 100;

  // Taste alignment against declared interests
  let taste = 65;
  if (brief.interests.length > 0) {
    const matched = brief.interests.map((i) => destination.interests[i] ?? 30);
    taste = Math.round(matched.reduce((a, b) => a + b, 0) / matched.length);
  }

  // Duration fit
  let duration = 80;
  if (brief.durationNights) {
    const n = brief.durationNights;
    if (n < destination.minimumNights) {
      duration = clamp(100 - (destination.minimumNights - n) * 25);
    } else if (n > destination.maximumNights) {
      duration = clamp(100 - (n - destination.maximumNights) * 10);
    } else {
      const distanceFromIdeal = Math.abs(n - destination.idealNights);
      duration = clamp(100 - distanceFromIdeal * 5);
    }
  }

  // Pace fit
  const pace = !brief.pace
    ? 80
    : destination.suitablePaces.includes(brief.pace)
      ? 100
      : 55;

  // Budget-band fit
  const budget = !brief.budgetBand
    ? 80
    : destination.budgetBands.includes(brief.budgetBand)
      ? 100
      : 45;

  // Flight fatigue — long flights weigh more for young children and seniors
  const hours = destination.travelPracticality.averageFlightHoursFromIndia;
  let flightFatigue = clamp(110 - hours * 6);
  const sensitiveTravellers =
    brief.childrenAges.some((a) => a <= 6) || brief.seniorTravellers > 0;
  if (sensitiveTravellers) {
    flightFatigue = clamp(flightFatigue - hours * 3);
  }

  // Accessibility
  let accessibility = 100;
  if (brief.accessibilityNeeds.length > 0) {
    accessibility = destination.travelPracticality.accessibilityScore;
    if (destination.travelPracticality.walkingIntensity === "high") {
      accessibility = clamp(accessibility - 15);
    }
  }

  // Data confidence — verified data scores higher; visa "verify" lowers confidence
  let confidence = destination.status === "verified" ? 95 : destination.status === "reviewed" ? 80 : 55;
  if (destination.travelPracticality.visaComplexity === "verify") {
    confidence = clamp(confidence - 15);
  }

  const overall = round(
    season * 0.2 +
      traveller * 0.16 +
      children * 0.1 +
      seniors * 0.06 +
      taste * 0.16 +
      duration * 0.08 +
      pace * 0.06 +
      budget * 0.08 +
      flightFatigue * 0.05 +
      accessibility * 0.05,
  );

  return {
    season: round(season),
    traveller: round(traveller),
    children: round(children),
    seniors: round(seniors),
    taste: round(taste),
    duration: round(duration),
    pace: round(pace),
    budget: round(budget),
    flightFatigue: round(flightFatigue),
    accessibility: round(accessibility),
    confidence: round(confidence),
    overall,
  };
}

const DIRECTION_LABELS: Record<RecommendationDirection, string> = {
  "best-match": "Best Match",
  "best-for-taste": "Best for Your Taste",
  "something-special": "Something Special",
};

function buildReasons(
  destination: DestinationKnowledge,
  brief: TravelBrief,
  score: RecommendationScore,
): string[] {
  const reasons: string[] = [];
  const month = brief.travelMonth;
  const monthIntel = month
    ? destination.monthlyIntelligence.find((m) => m.month === month)
    : undefined;

  if (monthIntel && monthIntel.seasonScore >= 75) {
    reasons.push(
      `${MONTH_NAMES[monthIntel.month - 1]} is ${monthIntel.seasonLabel.toLowerCase()} in ${destination.name}${monthIntel.highlights[0] ? ` — ${monthIntel.highlights[0].toLowerCase()}` : ""}.`,
    );
  }
  if (brief.travellerType === "family" && destination.suitability.family >= 80) {
    reasons.push(`Strong family fit, with attractions that work for mixed ages.`);
  }
  if (brief.travellerType === "honeymoon" && destination.suitability.honeymoon >= 85) {
    reasons.push(`A proven honeymoon favourite with romantic settings built in.`);
  }
  if ((brief.seniorTravellers > 0 || brief.travellerType === "senior") && destination.suitability.seniors >= 80) {
    reasons.push(`Comfortable for senior travellers — gentle pace options and good medical access.`);
  }
  if (score.taste >= 75 && brief.interests.length > 0) {
    const top = [...brief.interests]
      .sort((a, b) => (destination.interests[b] ?? 0) - (destination.interests[a] ?? 0))
      .slice(0, 2);
    reasons.push(`Matches your interest in ${top.join(" and ")}.`);
  }
  if (brief.foodPreferences.includes("vegetarian") && destination.food.vegetarianFriendly >= 80) {
    reasons.push(`Vegetarian-friendly dining is easy to find.`);
  }
  if (destination.travelPracticality.averageFlightHoursFromIndia <= 5) {
    reasons.push(
      `Short travel time — around ${destination.travelPracticality.averageFlightHoursFromIndia} flight hours from India.`,
    );
  }
  if (reasons.length < 2) {
    reasons.push(destination.summary.split(".")[0] + ".");
  }
  return reasons.slice(0, 3);
}

function toRecommendation(
  destination: DestinationKnowledge,
  brief: TravelBrief,
  score: RecommendationScore,
  direction: RecommendationDirection,
): Recommendation {
  const month = brief.travelMonth;
  const monthIntel = month
    ? destination.monthlyIntelligence.find((m) => m.month === month)
    : undefined;
  const consultantNotes: string[] = [];
  if (destination.travelPracticality.visaComplexity === "verify" || destination.travelPracticality.visaComplexity === "high") {
    consultantNotes.push("Visa requirements: consultant verification required.");
  }
  if (destination.status !== "verified") {
    consultantNotes.push("Destination data pending final Klar verification.");
  }
  if (monthIntel?.warnings.length) {
    consultantNotes.push(...monthIntel.warnings);
  }
  return {
    conceptId: `${destination.slug}-${direction}`,
    destinationSlug: destination.slug,
    destinationName: destination.name,
    country: destination.country,
    positioningLine: destination.positioningLine,
    direction,
    directionLabel: DIRECTION_LABELS[direction],
    seasonalFit: monthIntel
      ? `${MONTH_NAMES[monthIntel.month - 1]}: ${monthIntel.seasonLabel} (crowds ${monthIntel.crowdLevel}, rainfall ${monthIntel.rainfall})`
      : "Season fit depends on final travel dates.",
    travellerSuitability: describeSuitability(destination, brief),
    idealNights: destination.idealNights,
    reasons: buildReasons(destination, brief, score),
    tradeOff: destination.tradeOffs[0] ?? "Your Klar expert will confirm the practical details.",
    whoMayNotEnjoy: destination.whoShouldAvoid[0] ?? "",
    consultantNotes,
    score,
  };
}

function describeSuitability(destination: DestinationKnowledge, brief: TravelBrief): string {
  const parts: string[] = [];
  const s = destination.suitability;
  if (brief.travellerType === "family" || brief.childrenAges.length > 0) {
    parts.push(s.family >= 80 ? "Great for families" : s.family >= 60 ? "Workable for families" : "Better without young children");
  }
  if (brief.travellerType === "honeymoon" || brief.travellerType === "couple") {
    parts.push(s.honeymoon >= 85 ? "Excellent for couples" : "Good for couples");
  }
  if (brief.seniorTravellers > 0 || brief.travellerType === "senior") {
    parts.push(s.seniors >= 80 ? "Senior-friendly" : "Moderate walking for seniors");
  }
  if (parts.length === 0) {
    parts.push(s.firstInternationalTrip >= 85 ? "Easy first international trip" : "Rewards curious travellers");
  }
  return parts.join(" · ");
}

const MINIMUM_FIT_THRESHOLD = 45;

export type ThreeDirections = {
  bestMatch: Recommendation;
  bestForTaste: Recommendation;
  somethingSpecial: Recommendation;
};

/**
 * Produce exactly three differentiated directions from the verified KTIE pool.
 * Never returns the same destination twice.
 */
export function recommendThreeDirections(
  destinations: DestinationKnowledge[],
  brief: TravelBrief,
): Recommendation[] {
  const pool = destinations.filter((d) => d.status === "reviewed" || d.status === "verified");
  if (pool.length < 3) {
    throw new Error("KTIE needs at least three reviewed destinations to recommend");
  }

  const scored = pool
    .map((destination) => ({ destination, score: scoreDestination(destination, brief) }))
    .filter(({ score }) => score.overall >= MINIMUM_FIT_THRESHOLD)
    .sort((a, b) => b.score.overall - a.score.overall);

  const working = scored.length >= 3 ? scored : pool
    .map((destination) => ({ destination, score: scoreDestination(destination, brief) }))
    .sort((a, b) => b.score.overall - a.score.overall);

  // 1. Best Match — highest balanced overall score.
  const bestMatch = working[0];

  // 2. Best for Your Taste — highest taste alignment among the rest.
  const tasteSorted = working
    .filter((c) => c.destination.slug !== bestMatch.destination.slug)
    .sort((a, b) => b.score.taste - a.score.taste || b.score.overall - a.score.overall);
  const bestForTaste = tasteSorted[0];

  // 3. Something Special — a strong but less obvious pick: outside the top-3 by
  // overall when possible, still above the fit threshold.
  const remaining = working.filter(
    (c) =>
      c.destination.slug !== bestMatch.destination.slug &&
      c.destination.slug !== bestForTaste.destination.slug,
  );
  const lessObvious = remaining.slice(Math.min(2, Math.max(0, remaining.length - 1)));
  const somethingSpecial = (lessObvious[0] ?? remaining[0]);

  return [
    toRecommendation(bestMatch.destination, brief, bestMatch.score, "best-match"),
    toRecommendation(bestForTaste.destination, brief, bestForTaste.score, "best-for-taste"),
    toRecommendation(somethingSpecial.destination, brief, somethingSpecial.score, "something-special"),
  ];
}
