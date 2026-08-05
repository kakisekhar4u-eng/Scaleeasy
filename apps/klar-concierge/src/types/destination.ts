import type { BudgetBand, Pace } from "./brief";

export type KnowledgeStatus = "draft" | "reviewed" | "verified";

export type MonthIntelligence = {
  month: number; // 1-12
  seasonScore: number; // 0-100
  seasonLabel: string;
  rainfall: "low" | "medium" | "high";
  humidity: "low" | "medium" | "high";
  crowdLevel: "low" | "medium" | "high";
  highlights: string[];
  warnings: string[];
};

export type DestinationKnowledge = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;

  summary: string;
  positioningLine: string;

  status: KnowledgeStatus;

  minimumNights: number;
  idealNights: number;
  maximumNights: number;

  suitablePaces: Pace[];

  /** interest key → 0-100 strength */
  interests: Record<string, number>;

  suitability: {
    family: number;
    toddlers: number;
    children5To10: number;
    teenagers: number;
    seniors: number;
    honeymoon: number;
    solo: number;
    firstInternationalTrip: number;
  };

  food: {
    vegetarianFriendly: number;
    indianFoodAvailability: number;
    halalFriendly: number;
    localCuisineScore: number;
    streetFoodScore: number;
    fineDiningScore: number;
  };

  travelPracticality: {
    averageFlightHoursFromIndia: number;
    walkingIntensity: "low" | "medium" | "high";
    publicTransportEase: number;
    accessibilityScore: number;
    medicalAccessScore: number;
    visaComplexity: "low" | "medium" | "high" | "verify";
  };

  budgetBands: BudgetBand[];

  monthlyIntelligence: MonthIntelligence[];

  signatureExperiences: string[];
  hiddenGems: string[];

  tradeOffs: string[];
  whoShouldAvoid: string[];

  version: {
    version: string;
    reviewedBy: string;
    reviewedAt: string;
    nextReviewAt: string;
  };

  sources: Array<{
    sourceName: string;
    sourceType: string;
    sourceReference?: string;
    reliability: "high" | "medium" | "low";
    accessedAt: string;
  }>;
};
