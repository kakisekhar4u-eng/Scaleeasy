import { describe, expect, it } from "vitest";
import { extractBriefPatch, FallbackAIProvider } from "@/services/ai/fallbackExtractor";
import { emptyBrief } from "@/types/brief";

const FAMILY_PROMPT =
  "We are a family of four from Hyderabad looking for a relaxed seven-night holiday in December. Our children are 6 and 10, and we enjoy food, easy sightseeing and fun activities.";

describe("deterministic brief extraction", () => {
  it("extracts month, duration, family, children and origin from the example prompt", () => {
    const patch = extractBriefPatch(FAMILY_PROMPT);
    expect(patch.travelMonth).toBe(12);
    expect(patch.durationNights).toBe(7);
    expect(patch.travellerType).toBe("family");
    expect(patch.childrenAges).toEqual([6, 10]);
    expect(patch.originCity).toBe("Hyderabad");
    expect(patch.pace).toBe("relaxed");
    expect(patch.interests).toContain("food");
  });

  it("extracts honeymoon intent and budget", () => {
    const patch = extractBriefPatch(
      "Planning a luxury honeymoon in May for 5 nights, we love beaches and romantic dinners",
    );
    expect(patch.travellerType).toBe("honeymoon");
    expect(patch.budgetBand).toBe("luxury");
    expect(patch.travelMonth).toBe(5);
    expect(patch.durationNights).toBe(5);
    expect(patch.interests).toContain("beach");
    expect(patch.occasion).toBe("honeymoon");
  });

  it("extracts senior travellers", () => {
    const patch = extractBriefPatch("Taking my parents on a 6 night trip in October, easy pace");
    expect(patch.seniorTravellers).toBe(2);
    expect(patch.travelMonth).toBe(10);
    expect(patch.durationNights).toBe(6);
  });

  it("parses year-old child phrasing", () => {
    const patch = extractBriefPatch("Travelling with our 3-year-old in March for a week");
    expect(patch.childrenAges).toEqual([3]);
    expect(patch.durationNights).toBe(7);
  });

  it("extracts accessibility needs and food preferences", () => {
    const patch = extractBriefPatch(
      "My mother uses a wheelchair and we need pure veg food in June",
    );
    expect(patch.accessibilityNeeds).toContain("wheelchair access");
    expect(patch.foodPreferences).toContain("vegetarian");
  });

  it("returns unknown intent for empty extraction", async () => {
    const provider = new FallbackAIProvider();
    const result = await provider.extractBrief({
      message: "hello there",
      currentBrief: emptyBrief(),
    });
    expect(result.detectedIntent).toBe("unknown");
  });

  it("asks a follow-up question for a missing field", async () => {
    const provider = new FallbackAIProvider();
    const question = await provider.composeFollowUp({
      brief: emptyBrief(),
      missingField: "travelMonth",
    });
    expect(question.toLowerCase()).toContain("month");
  });
});
