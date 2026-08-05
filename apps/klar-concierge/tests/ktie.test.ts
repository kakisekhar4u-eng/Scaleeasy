import { describe, expect, it } from "vitest";
import { KTIE_DESTINATIONS } from "@/services/ktie/data";
import { buildDiscoverCollections } from "@/services/ktie/discover";
import { missingBriefFields, briefReadyForRecommendations, emptyBrief } from "@/types/brief";

describe("KTIE dataset", () => {
  it("ships the full 20-destination production pack", () => {
    expect(KTIE_DESTINATIONS).toHaveLength(20);
    const slugs = KTIE_DESTINATIONS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(20);
  });

  it("every destination has 12 months of intelligence and review metadata", () => {
    for (const d of KTIE_DESTINATIONS) {
      expect(d.monthlyIntelligence).toHaveLength(12);
      expect(d.status).toBe("reviewed"); // seed data awaits Klar verification
      expect(d.version.reviewedBy.length).toBeGreaterThan(0);
      expect(d.sources.length).toBeGreaterThan(0);
      expect(d.minimumNights).toBeLessThanOrEqual(d.idealNights);
      expect(d.idealNights).toBeLessThanOrEqual(d.maximumNights);
      expect(d.tradeOffs.length).toBeGreaterThan(0);
      expect(d.signatureExperiences.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("builds all eight discovery collections", () => {
    const collections = buildDiscoverCollections(12);
    expect(collections.map((c) => c.key)).toEqual([
      "this-month", "families", "children", "couples", "seniors", "food", "beach", "culture",
    ]);
    for (const c of collections) {
      expect(c.destinations.length).toBeGreaterThan(0);
    }
  });
});

describe("missing-information detection", () => {
  it("detects all core gaps on an empty brief", () => {
    const missing = missingBriefFields(emptyBrief(""));
    expect(missing).toContain("travelMonth");
    expect(missing).toContain("durationNights");
    expect(missing).toContain("travellerType");
    expect(briefReadyForRecommendations(emptyBrief(""))).toBe(false);
  });

  it("is ready once the core trip shape is known", () => {
    const brief = {
      ...emptyBrief("x"),
      travelMonth: 12,
      durationNights: 7,
      travellerType: "family" as const,
    };
    expect(briefReadyForRecommendations(brief)).toBe(true);
  });
});
