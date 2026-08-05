import { NextResponse } from "next/server";
import { z } from "zod";
import { KTIE_DESTINATIONS, getDestinationBySlug } from "@/services/ktie/data";
import { recommendThreeDirections } from "@/services/recommendations/scoring";
import { composeItinerary } from "@/services/itinerary/composer";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { config } from "@/lib/config";
import type { TravelBrief } from "@/types/brief";

export const runtime = "nodejs";

const briefSchema = z
  .object({
    originalPrompt: z.string().max(4000).default(""),
    originCity: z.string().max(120).optional(),
    travelMonth: z.number().int().min(1).max(12).optional(),
    durationNights: z.number().int().min(1).max(30).optional(),
    travellerType: z
      .enum(["family", "couple", "honeymoon", "solo", "friends", "senior", "corporate"])
      .optional(),
    adults: z.number().int().min(1).max(20).default(2),
    childrenAges: z.array(z.number().int().min(0).max(17)).max(10).default([]),
    seniorTravellers: z.number().int().min(0).max(20).default(0),
    pace: z.enum(["relaxed", "balanced", "active"]).optional(),
    interests: z.array(z.string().max(40)).max(20).default([]),
    occasion: z.string().max(120).optional(),
    accessibilityNeeds: z.array(z.string().max(120)).max(10).default([]),
    foodPreferences: z.array(z.string().max(60)).max(10).default([]),
    budgetBand: z.enum(["value", "comfort", "premium", "luxury"]).optional(),
  })
  .passthrough();

const bodySchema = z.object({
  brief: briefSchema,
  destinationSlug: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "plan"), config.rateLimitChatPerMinute);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const brief = parsed.brief as TravelBrief;

  try {
    if (parsed.destinationSlug) {
      const destination = getDestinationBySlug(parsed.destinationSlug);
      if (!destination) {
        return NextResponse.json({ error: "Unknown destination." }, { status: 404 });
      }
      const itinerary = composeItinerary(destination, brief);
      return NextResponse.json({ itinerary });
    }

    const recommendations = recommendThreeDirections(KTIE_DESTINATIONS, brief);
    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json(
      { error: "We couldn't prepare your plan just now. Please try again." },
      { status: 500 },
    );
  }
}
