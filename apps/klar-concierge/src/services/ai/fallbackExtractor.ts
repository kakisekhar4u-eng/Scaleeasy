import type { TravelBrief, TravellerType, Pace, BudgetBand } from "@/types/brief";
import type { AIProvider, BriefExtractionInput, BriefExtractionOutput, FollowUpInput } from "./types";

const MONTHS: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const ORIGIN_CITIES = [
  "hyderabad", "mumbai", "delhi", "bengaluru", "bangalore", "chennai", "kolkata",
  "pune", "ahmedabad", "kochi", "cochin", "jaipur", "lucknow", "goa", "chandigarh",
  "visakhapatnam", "vizag", "nagpur", "indore", "coimbatore", "trivandrum", "surat",
];

const CITY_DISPLAY: Record<string, string> = {
  bangalore: "Bengaluru",
  cochin: "Kochi",
  vizag: "Visakhapatnam",
};

const INTEREST_KEYWORDS: Record<string, string[]> = {
  beach: ["beach", "beaches", "island", "sea", "seaside", "lagoon"],
  food: ["food", "foodie", "cuisine", "eating", "restaurants", "street food"],
  culture: ["culture", "cultural", "temples", "local life", "traditions", "art"],
  history: ["history", "historic", "heritage", "ruins", "museums", "monuments"],
  city: ["city", "cities", "skyline", "urban", "city break"],
  shopping: ["shopping", "shop", "malls", "markets", "bazaar"],
  adventure: ["adventure", "trek", "trekking", "hiking", "diving", "rafting", "adventurous"],
  nature: ["nature", "mountains", "waterfalls", "scenery", "landscape", "lakes", "countryside"],
  relaxation: ["relax", "relaxed", "relaxing", "chill", "unwind", "spa", "wellness", "peaceful"],
  nightlife: ["nightlife", "party", "clubs", "bars"],
  themeparks: ["theme park", "theme parks", "universal", "disneyland", "amusement", "fun activities"],
  romance: ["romantic", "romance", "honeymoon", "anniversary"],
  wildlife: ["wildlife", "safari", "animals", "leopard", "elephants"],
  snow: ["snow", "skiing", "alps", "winter wonderland"],
};

function extractMonth(text: string): number | undefined {
  const lower = text.toLowerCase();
  for (const [name, num] of Object.entries(MONTHS)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return num;
  }
  if (/\bthis month\b/.test(lower)) return new Date().getMonth() + 1;
  if (/\bnext month\b/.test(lower)) return ((new Date().getMonth() + 1) % 12) + 1;
  return undefined;
}

function extractDuration(text: string): number | undefined {
  const lower = text.toLowerCase();
  const nightMatch = lower.match(/(\d+)[\s-]*night/);
  if (nightMatch) return parseInt(nightMatch[1], 10);
  const wordNumbers: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
    eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fourteen: 14, fifteen: 15,
  };
  const wordNight = lower.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|fifteen)[\s-]*night/,
  );
  if (wordNight) return wordNumbers[wordNight[1]];
  const dayMatch = lower.match(/(\d+)[\s-]*day/);
  if (dayMatch) return Math.max(1, parseInt(dayMatch[1], 10) - 1);
  const wordDay = lower.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fourteen|fifteen)[\s-]*day/,
  );
  if (wordDay) return Math.max(1, wordDay[1] ? wordNumbers[wordDay[1]] - 1 : 0);
  const weekMatch = lower.match(/(\d+|a|one|two)[\s-]*week/);
  if (weekMatch) {
    const n = weekMatch[1] === "a" || weekMatch[1] === "one" ? 1 : weekMatch[1] === "two" ? 2 : parseInt(weekMatch[1], 10);
    if (!Number.isNaN(n)) return n * 7;
  }
  return undefined;
}

function extractChildrenAges(text: string): number[] {
  const lower = text.toLowerCase();
  const ages: number[] = [];
  // "children are 6 and 10", "kids aged 4, 7 and 9", "child of 5"
  const grouped = lower.match(
    /(?:child(?:ren)?|kids?|son|daughter)[^.]*?\b(?:are|aged|age|of|is)\b([^.]*)/,
  );
  if (grouped) {
    const nums = grouped[1].match(/\b(\d{1,2})\b/g);
    if (nums) {
      for (const n of nums) {
        const v = parseInt(n, 10);
        if (v >= 0 && v <= 17) ages.push(v);
      }
    }
  }
  // "6-year-old", "10 year old"
  const yearOld = lower.matchAll(/\b(\d{1,2})[\s-]*year[\s-]*old/g);
  for (const m of yearOld) {
    const v = parseInt(m[1], 10);
    if (v >= 0 && v <= 17 && !ages.includes(v)) ages.push(v);
  }
  return ages;
}

function extractAdults(text: string): number | undefined {
  const lower = text.toLowerCase();
  const explicit = lower.match(/(\d+)\s*adult/);
  if (explicit) return parseInt(explicit[1], 10);
  if (/family of four/.test(lower)) return 2;
  if (/family of five/.test(lower)) return 2;
  if (/family of three/.test(lower)) return 2;
  if (/\b(couple|honeymoon|my wife|my husband|my partner|two of us)\b/.test(lower)) return 2;
  if (/\b(solo|by myself|on my own|travelling alone|traveling alone)\b/.test(lower)) return 1;
  return undefined;
}

function extractSeniors(text: string): number | undefined {
  const lower = text.toLowerCase();
  const explicit = lower.match(/(\d+)\s*senior/);
  if (explicit) return parseInt(explicit[1], 10);
  if (/\b(my parents|our parents)\b/.test(lower)) return 2;
  if (/\b(my mother|my father|my mom|my dad)\b/.test(lower)) return 1;
  if (/\b(senior|elderly|retired)\b/.test(lower)) return 1;
  return undefined;
}

function extractTravellerType(text: string): TravellerType | undefined {
  const lower = text.toLowerCase();
  if (/\bhoneymoon\b/.test(lower)) return "honeymoon";
  if (/\bfamily\b|children|kids|son|daughter/.test(lower)) return "family";
  if (/\b(senior|elderly|retired|parents)\b/.test(lower)) return "senior";
  if (/\b(couple|my wife|my husband|my partner|anniversary)\b/.test(lower)) return "couple";
  if (/\b(friends|group of|bachelor|bachelorette)\b/.test(lower)) return "friends";
  if (/\b(solo|by myself|on my own|alone)\b/.test(lower)) return "solo";
  if (/\b(corporate|offsite|team outing|incentive)\b/.test(lower)) return "corporate";
  return undefined;
}

function extractPace(text: string): Pace | undefined {
  const lower = text.toLowerCase();
  if (/\b(relaxed|relaxing|slow|easy|laid[\s-]?back|unhurried|chill)\b/.test(lower)) return "relaxed";
  if (/\b(active|packed|adventurous|action|busy itinerary|see everything)\b/.test(lower)) return "active";
  if (/\b(balanced|mix of|bit of both|moderate)\b/.test(lower)) return "balanced";
  return undefined;
}

function extractBudgetBand(text: string): BudgetBand | undefined {
  const lower = text.toLowerCase();
  if (/\b(luxury|luxurious|5[\s-]?star|five[\s-]?star|no budget)\b/.test(lower)) return "luxury";
  if (/\b(premium|upscale|4[\s-]?star|four[\s-]?star)\b/.test(lower)) return "premium";
  if (/\b(budget|cheap|affordable|value|economical|pocket[\s-]?friendly)\b/.test(lower)) return "value";
  if (/\b(comfortable|mid[\s-]?range|3[\s-]?star|three[\s-]?star|reasonable)\b/.test(lower)) return "comfort";
  return undefined;
}

function extractInterests(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) found.push(interest);
  }
  return found;
}

function extractOriginCity(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const city of ORIGIN_CITIES) {
    if (new RegExp(`\\b${city}\\b`).test(lower)) {
      const display = CITY_DISPLAY[city] ?? city.charAt(0).toUpperCase() + city.slice(1);
      return display;
    }
  }
  return undefined;
}

function extractFoodPreferences(text: string): string[] {
  const lower = text.toLowerCase();
  const prefs: string[] = [];
  if (/\b(pure veg|vegetarian|veg only|veg food)\b/.test(lower)) prefs.push("vegetarian");
  if (/\bvegan\b/.test(lower)) prefs.push("vegan");
  if (/\bhalal\b/.test(lower)) prefs.push("halal");
  if (/\bjain\b/.test(lower)) prefs.push("jain");
  if (/\bindian food\b/.test(lower)) prefs.push("indian-food-nearby");
  return prefs;
}

function extractAccessibility(text: string): string[] {
  const lower = text.toLowerCase();
  const needs: string[] = [];
  if (/\bwheelchair\b/.test(lower)) needs.push("wheelchair access");
  if (/\b(limited mobility|mobility issues|knee problem|can'?t walk much|cannot walk much|walking difficulty)\b/.test(lower)) {
    needs.push("limited walking");
  }
  if (/\b(step[\s-]?free|no stairs)\b/.test(lower)) needs.push("step-free access");
  return needs;
}

/**
 * Deterministic extraction — keeps the planner fully usable when no AI
 * provider is configured or reachable. Never invents destination facts.
 */
export function extractBriefPatch(message: string): Partial<TravelBrief> {
  const patch: Partial<TravelBrief> = {};

  const month = extractMonth(message);
  if (month) patch.travelMonth = month;

  const duration = extractDuration(message);
  if (duration) patch.durationNights = duration;

  const childrenAges = extractChildrenAges(message);
  if (childrenAges.length) patch.childrenAges = childrenAges;

  const adults = extractAdults(message);
  if (adults) patch.adults = adults;

  const seniors = extractSeniors(message);
  if (seniors) patch.seniorTravellers = seniors;

  const travellerType = extractTravellerType(message);
  if (travellerType) patch.travellerType = travellerType;

  const pace = extractPace(message);
  if (pace) patch.pace = pace;

  const budgetBand = extractBudgetBand(message);
  if (budgetBand) patch.budgetBand = budgetBand;

  const interests = extractInterests(message);
  if (interests.length) patch.interests = interests;

  const originCity = extractOriginCity(message);
  if (originCity) patch.originCity = originCity;

  const foodPreferences = extractFoodPreferences(message);
  if (foodPreferences.length) patch.foodPreferences = foodPreferences;

  const accessibilityNeeds = extractAccessibility(message);
  if (accessibilityNeeds.length) patch.accessibilityNeeds = accessibilityNeeds;

  const occasion = /\bhoneymoon\b/i.test(message)
    ? "honeymoon"
    : /\banniversary\b/i.test(message)
      ? "anniversary"
      : /\bbirthday\b/i.test(message)
        ? "birthday"
        : undefined;
  if (occasion) patch.occasion = occasion;

  return patch;
}

const FOLLOW_UP_QUESTIONS: Record<string, string> = {
  originCity: "Which city will you be starting your journey from?",
  travelMonth: "When are you thinking of travelling — which month works best?",
  durationNights: "How many nights would you like the holiday to be?",
  travellerType: "Who's travelling — is this a family trip, a couple's getaway, or something else?",
  adults: "How many adults will be travelling?",
  childrenAges: "Are any children travelling? If so, how old are they?",
  pace: "Do you prefer a relaxed pace, a balanced mix, or a packed, active itinerary?",
  interests: "What do you enjoy most on holiday — beaches, food, culture, adventure, shopping?",
  budgetBand: "Roughly what comfort level suits you best — value, comfortable, premium or luxury?",
};

export class FallbackAIProvider implements AIProvider {
  readonly id = "deterministic-fallback";

  async extractBrief(input: BriefExtractionInput): Promise<BriefExtractionOutput> {
    const briefPatch = extractBriefPatch(input.message);
    const fieldsFound = Object.keys(briefPatch).length;
    return {
      briefPatch,
      detectedIntent: fieldsFound > 0 ? "plan-holiday" : "unknown",
      confidence: Math.min(0.9, 0.3 + fieldsFound * 0.1),
    };
  }

  async composeFollowUp(input: FollowUpInput): Promise<string> {
    return (
      FOLLOW_UP_QUESTIONS[input.missingField] ??
      "Is there anything else that matters for this holiday?"
    );
  }
}
