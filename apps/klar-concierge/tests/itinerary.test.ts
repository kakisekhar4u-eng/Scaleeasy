import { describe, expect, it } from "vitest";
import { composeItinerary } from "@/services/itinerary/composer";
import { KTIE_DESTINATIONS } from "@/services/ktie/data";
import { emptyBrief, type TravelBrief } from "@/types/brief";

const bali = KTIE_DESTINATIONS.find((d) => d.slug === "bali")!;

function brief(overrides: Partial<TravelBrief> = {}): TravelBrief {
  return {
    ...emptyBrief("test"),
    travelMonth: 6,
    durationNights: 6,
    travellerType: "couple",
    pace: "balanced",
    ...overrides,
  };
}

describe("itinerary composer", () => {
  it("produces nights + 1 days for a requested duration within limits", () => {
    const days = composeItinerary(bali, brief({ durationNights: 6 }));
    expect(days).toHaveLength(7);
    expect(days[0].day).toBe(1);
    expect(days.at(-1)!.day).toBe(7);
  });

  it("clamps to destination minimum nights", () => {
    const days = composeItinerary(bali, brief({ durationNights: 1 }));
    expect(days.length).toBe(bali.minimumNights + 1);
  });

  it("clamps to destination maximum nights", () => {
    const days = composeItinerary(bali, brief({ durationNights: 25 }));
    expect(days.length).toBe(bali.maximumNights + 1);
  });

  it("starts with arrival and ends with departure", () => {
    const days = composeItinerary(bali, brief());
    expect(days[0].activities[0].title).toContain("Arrive");
    expect(days.at(-1)!.activities[0].title).toContain("Departure");
  });

  it("adds senior-friendly notes when seniors travel", () => {
    const days = composeItinerary(bali, brief({ seniorTravellers: 2 }));
    const allNotes = days.flatMap((d) => d.notes).join(" ");
    expect(allNotes).toContain("Transport between stops");
  });

  it("adds accessibility follow-up note when needs are recorded", () => {
    const days = composeItinerary(bali, brief({ accessibilityNeeds: ["wheelchair access"] }));
    const allNotes = days.flatMap((d) => d.notes).join(" ");
    expect(allNotes.toLowerCase()).toContain("accessibility");
  });

  it("never claims bookings or availability", () => {
    const days = composeItinerary(bali, brief());
    const text = JSON.stringify(days).toLowerCase();
    expect(text).not.toContain("booked");
    expect(text).not.toContain("reserved");
    expect(text).not.toContain("availability");
  });
});
