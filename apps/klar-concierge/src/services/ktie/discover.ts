import type { DestinationKnowledge } from "@/types/destination";
import { KTIE_DESTINATIONS } from "./data";

export type DiscoverCollection = {
  key: string;
  title: string;
  description: string;
  destinations: Array<{
    slug: string;
    name: string;
    country: string;
    positioningLine: string;
    seasonLabel?: string;
  }>;
};

function top(
  pool: DestinationKnowledge[],
  by: (d: DestinationKnowledge) => number,
  count = 4,
): DestinationKnowledge[] {
  return [...pool].sort((a, b) => by(b) - by(a)).slice(0, count);
}

/** KTIE-grounded discovery collections for the landing and discover pages. */
export function buildDiscoverCollections(month: number): DiscoverCollection[] {
  const pool = KTIE_DESTINATIONS.filter((d) => d.status !== "draft");
  const monthScore = (d: DestinationKnowledge) =>
    d.monthlyIntelligence.find((m) => m.month === month)?.seasonScore ?? 0;

  const withSeason = (list: DestinationKnowledge[]) =>
    list.map((d) => ({
      slug: d.slug,
      name: d.name,
      country: d.country,
      positioningLine: d.positioningLine,
      seasonLabel: d.monthlyIntelligence.find((m) => m.month === month)?.seasonLabel,
    }));

  return [
    {
      key: "this-month",
      title: "Best places to visit this month",
      description: "Destinations at their seasonal best right now.",
      destinations: withSeason(top(pool, monthScore)),
    },
    {
      key: "families",
      title: "Best for families",
      description: "Easy logistics and attractions the whole family enjoys.",
      destinations: withSeason(top(pool, (d) => d.suitability.family)),
    },
    {
      key: "children",
      title: "Best for children",
      description: "Theme parks, wildlife and wow moments for younger travellers.",
      destinations: withSeason(top(pool, (d) => d.suitability.children5To10)),
    },
    {
      key: "couples",
      title: "Best for couples",
      description: "Romantic settings, from lagoon villas to old-town evenings.",
      destinations: withSeason(top(pool, (d) => d.suitability.honeymoon)),
    },
    {
      key: "seniors",
      title: "Best for seniors",
      description: "Comfortable pacing, good access and gentle exploring.",
      destinations: withSeason(top(pool, (d) => d.suitability.seniors)),
    },
    {
      key: "food",
      title: "Best for food lovers",
      description: "Street food, markets and memorable meals.",
      destinations: withSeason(top(pool, (d) => d.food.localCuisineScore)),
    },
    {
      key: "beach",
      title: "Relaxed beach holidays",
      description: "Slow mornings, warm water and nowhere to be.",
      destinations: withSeason(
        top(pool, (d) => (d.interests.beach ?? 0) + (d.interests.relaxation ?? 0)),
      ),
    },
    {
      key: "culture",
      title: "Culture and city breaks",
      description: "Museums, old towns, skylines and civilisations.",
      destinations: withSeason(
        top(pool, (d) => (d.interests.culture ?? 0) + (d.interests.city ?? 0)),
      ),
    },
  ];
}
