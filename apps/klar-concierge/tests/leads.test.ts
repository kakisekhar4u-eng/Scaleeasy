import { describe, expect, it } from "vitest";
import { generateLeadReference, isValidLeadReference } from "@/services/leads/reference";
import { scoreLead } from "@/services/leads/scoring";
import { emptyBrief } from "@/types/brief";

describe("lead reference", () => {
  it("generates the KLAR-YYYY-XXXXXX format", () => {
    const ref = generateLeadReference(new Date("2026-08-05"));
    expect(ref).toMatch(/^KLAR-2026-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/);
    expect(isValidLeadReference(ref)).toBe(true);
  });

  it("generates unique references", () => {
    const refs = new Set(Array.from({ length: 200 }, () => generateLeadReference()));
    expect(refs.size).toBe(200);
  });

  it("rejects malformed references", () => {
    expect(isValidLeadReference("KLAR-2026-000000")).toBe(false); // ambiguous chars excluded
    expect(isValidLeadReference("NOPE-2026-ABCDEF")).toBe(false);
  });
});

describe("lead scoring", () => {
  it("scores a complete, engaged lead as high priority", () => {
    const result = scoreLead({
      brief: {
        ...emptyBrief("x"),
        travelMonth: 12,
        durationNights: 7,
        travellerType: "family",
        adults: 2,
        childrenAges: [6, 10],
        budgetBand: "premium",
      },
      destinationSelected: true,
      itineraryViewed: true,
      contactChannelKnown: true,
      conversationMessages: 5,
    });
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.priority).toBe("urgent");
    expect(result.reasons).toContain("Destination selected");
  });

  it("scores an empty brief as low priority", () => {
    const result = scoreLead({
      brief: emptyBrief(""),
      destinationSelected: false,
      itineraryViewed: false,
      contactChannelKnown: false,
      conversationMessages: 0,
    });
    expect(result.priority).toBe("low");
  });

  it("never exceeds 100", () => {
    const result = scoreLead({
      brief: {
        ...emptyBrief("x"),
        travelMonth: 1,
        durationNights: 10,
        travellerType: "family",
        adults: 4,
        childrenAges: [3, 5, 8],
        seniorTravellers: 2,
        budgetBand: "luxury",
      },
      destinationSelected: true,
      itineraryViewed: true,
      contactChannelKnown: true,
      conversationMessages: 20,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
