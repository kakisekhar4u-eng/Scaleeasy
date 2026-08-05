export type RecommendationDirection =
  | "best-match"
  | "best-for-taste"
  | "something-special";

export type RecommendationScore = {
  season: number;
  traveller: number;
  children: number;
  seniors: number;
  taste: number;
  duration: number;
  pace: number;
  budget: number;
  flightFatigue: number;
  accessibility: number;
  confidence: number;
  overall: number;
};

export type Recommendation = {
  conceptId: string;
  destinationSlug: string;
  destinationName: string;
  country: string;
  positioningLine: string;
  direction: RecommendationDirection;
  directionLabel: string;
  seasonalFit: string;
  travellerSuitability: string;
  idealNights: number;
  reasons: string[];
  tradeOff: string;
  whoMayNotEnjoy: string;
  consultantNotes: string[];
  score: RecommendationScore;
};

export type ItineraryActivity = {
  title: string;
  description: string;
  optional?: boolean;
};

export type ItineraryDay = {
  day: number;
  title: string;
  pace: "light" | "balanced" | "active";
  activities: ItineraryActivity[];
  notes: string[];
};
