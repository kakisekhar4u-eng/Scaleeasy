import type { MonthIntelligence } from "@/types/destination";

type MonthBuildSpec = {
  /** 12 season scores, January → December, 0-100 */
  scores: number[];
  /** months (1-12) with medium rainfall; everything else defaults to low */
  rainy?: number[];
  /** months with high rainfall (overrides rainy) */
  veryRainy?: number[];
  /** months with high humidity; everything else medium */
  humid?: number[];
  /** months with low humidity */
  dry?: number[];
  /** months with high crowds */
  crowded?: number[];
  /** months with low crowds */
  quiet?: number[];
  highlights?: Record<number, string[]>;
  warnings?: Record<number, string[]>;
};

function seasonLabel(score: number): string {
  if (score >= 80) return "Excellent time to visit";
  if (score >= 65) return "Good season";
  if (score >= 50) return "Shoulder season";
  return "Off season";
}

export function buildMonths(spec: MonthBuildSpec): MonthIntelligence[] {
  if (spec.scores.length !== 12) {
    throw new Error("Month spec requires exactly 12 season scores");
  }
  return spec.scores.map((score, i) => {
    const month = i + 1;
    const rainfall = spec.veryRainy?.includes(month)
      ? "high"
      : spec.rainy?.includes(month)
        ? "medium"
        : "low";
    const humidity = spec.humid?.includes(month)
      ? "high"
      : spec.dry?.includes(month)
        ? "low"
        : "medium";
    const crowdLevel = spec.crowded?.includes(month)
      ? "high"
      : spec.quiet?.includes(month)
        ? "low"
        : "medium";
    return {
      month,
      seasonScore: score,
      seasonLabel: seasonLabel(score),
      rainfall,
      humidity,
      crowdLevel,
      highlights: spec.highlights?.[month] ?? [],
      warnings: spec.warnings?.[month] ?? [],
    };
  });
}

/** Shared seed provenance — all seed content requires Klar review before launch. */
export const seedVersion = {
  version: "1.0.0-seed",
  reviewedBy: "Klar knowledge team (seed content — Klar review required before launch)",
  reviewedAt: "2026-08-01",
  nextReviewAt: "2026-11-01",
};

export const seedSources = [
  {
    sourceName: "Klar internal destination research pack",
    sourceType: "internal-research",
    reliability: "medium" as const,
    accessedAt: "2026-08-01",
  },
];
