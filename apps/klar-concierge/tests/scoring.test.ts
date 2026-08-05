import { describe, expect, it } from "vitest";
import { KTIE_DESTINATIONS } from "@/services/ktie/data";
import { recommendThreeDirections, scoreDestination } from "@/services/recommendations/scoring";
import { emptyBrief, type TravelBrief } from "@/types/brief";

function familyBrief(): TravelBrief {
  return {
    ...emptyBrief("family trip"),
    travelMonth: 12,
    durationNights: 7,
    travellerType: "family",
    adults: 2,
    childrenAges: [6, 10],
    pace: "relaxed",
    interests: ["food", "themeparks"],
  };
}

describe("recommendation scoring", () => {
  it("produces a full score breakdown", () => {
    const singapore = KTIE_DESTINATIONS.find((d) => d.slug === "singapore")!;
    const score = scoreDestination(singapore, familyBrief());
    for (const key of [
      "season", "traveller", "children", "seniors", "taste", "duration",
      "pace", "budget", "flightFatigue", "accessibility", "confidence", "overall",
    ] as const) {
      expect(score[key]).toBeGreaterThanOrEqual(0);
      expect(score[key]).toBeLessThanOrEqual(100);
    }
  });

  it("returns exactly three differentiated directions with unique destinations", () => {
    const recs = recommendThreeDirections(KTIE_DESTINATIONS, familyBrief());
    expect(recs).toHaveLength(3);
    expect(recs.map((r) => r.direction)).toEqual([
      "best-match",
      "best-for-taste",
      "something-special",
    ]);
    const slugs = recs.map((r) => r.destinationSlug);
    expect(new Set(slugs).size).toBe(3);
  });

  it("penalises out-of-season months", () => {
    const dubai = KTIE_DESTINATIONS.find((d) => d.slug === "dubai")!;
    const december = scoreDestination(dubai, { ...familyBrief(), travelMonth: 12 });
    const july = scoreDestination(dubai, { ...familyBrief(), travelMonth: 7 });
    expect(december.season).toBeGreaterThan(july.season);
  });

  it("penalises long flights more when young children travel", () => {
    const australia = KTIE_DESTINATIONS.find((d) => d.slug === "australia")!;
    const withToddler = scoreDestination(australia, { ...familyBrief(), childrenAges: [2] });
    const adultsOnly = scoreDestination(australia, {
      ...familyBrief(),
      childrenAges: [],
      travellerType: "couple",
    });
    expect(withToddler.flightFatigue).toBeLessThan(adultsOnly.flightFatigue);
  });

  it("gives every recommendation reasons and one trade-off", () => {
    const recs = recommendThreeDirections(KTIE_DESTINATIONS, familyBrief());
    for (const rec of recs) {
      expect(rec.reasons.length).toBeGreaterThanOrEqual(1);
      expect(rec.reasons.length).toBeLessThanOrEqual(3);
      expect(rec.tradeOff.length).toBeGreaterThan(0);
    }
  });

  it("respects duration fit — a 3-night brief should not favour Australia", () => {
    const brief: TravelBrief = { ...familyBrief(), durationNights: 3 };
    const recs = recommendThreeDirections(KTIE_DESTINATIONS, brief);
    expect(recs.map((r) => r.destinationSlug)).not.toContain("australia");
  });
});
