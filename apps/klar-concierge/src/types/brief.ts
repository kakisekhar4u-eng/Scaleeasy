export type TravellerType =
  | "family"
  | "couple"
  | "honeymoon"
  | "solo"
  | "friends"
  | "senior"
  | "corporate";

export type Pace = "relaxed" | "balanced" | "active";

export type BudgetBand = "value" | "comfort" | "premium" | "luxury";

export type TravelBrief = {
  originalPrompt: string;

  originCity?: string;
  departureAirport?: string;

  travelMonth?: number;
  startDate?: string;
  endDate?: string;
  flexibilityDays?: number;

  durationNights?: number;

  travellerType?: TravellerType;

  adults: number;
  childrenAges: number[];
  seniorTravellers: number;

  pace?: Pace;

  interests: string[];

  occasion?: string;

  accessibilityNeeds: string[];
  foodPreferences: string[];

  budgetBand?: BudgetBand;
};

export function emptyBrief(originalPrompt = ""): TravelBrief {
  return {
    originalPrompt,
    adults: 2,
    childrenAges: [],
    seniorTravellers: 0,
    interests: [],
    accessibilityNeeds: [],
    foodPreferences: [],
  };
}

/** Fields the conversation engine tries to fill before recommending. */
export type BriefField =
  | "originCity"
  | "travelMonth"
  | "durationNights"
  | "travellerType"
  | "adults"
  | "childrenAges"
  | "pace"
  | "interests"
  | "budgetBand";

export function missingBriefFields(brief: TravelBrief): BriefField[] {
  const missing: BriefField[] = [];
  if (!brief.originCity) missing.push("originCity");
  if (!brief.travelMonth) missing.push("travelMonth");
  if (!brief.durationNights) missing.push("durationNights");
  if (!brief.travellerType) missing.push("travellerType");
  if (!brief.pace) missing.push("pace");
  if (brief.interests.length === 0) missing.push("interests");
  if (!brief.budgetBand) missing.push("budgetBand");
  return missing;
}

/** The brief is complete enough to recommend once the core trip shape is known. */
export function briefReadyForRecommendations(brief: TravelBrief): boolean {
  return Boolean(brief.travelMonth && brief.durationNights && brief.travellerType);
}
