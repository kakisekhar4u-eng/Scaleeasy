import { NextResponse } from "next/server";
import { z } from "zod";
import { processChatTurn } from "@/services/conversation/engine";
import { clientKey, rateLimit } from "@/lib/rateLimit";
import { config } from "@/lib/config";

export const runtime = "nodejs";

const briefSchema = z.object({
  originalPrompt: z.string().max(4000),
  originCity: z.string().max(120).optional(),
  departureAirport: z.string().max(10).optional(),
  travelMonth: z.number().int().min(1).max(12).optional(),
  startDate: z.string().max(30).optional(),
  endDate: z.string().max(30).optional(),
  flexibilityDays: z.number().int().min(0).max(60).optional(),
  durationNights: z.number().int().min(1).max(30).optional(),
  travellerType: z
    .enum(["family", "couple", "honeymoon", "solo", "friends", "senior", "corporate"])
    .optional(),
  adults: z.number().int().min(1).max(20),
  childrenAges: z.array(z.number().int().min(0).max(17)).max(10),
  seniorTravellers: z.number().int().min(0).max(20),
  pace: z.enum(["relaxed", "balanced", "active"]).optional(),
  interests: z.array(z.string().max(40)).max(20),
  occasion: z.string().max(120).optional(),
  accessibilityNeeds: z.array(z.string().max(120)).max(10),
  foodPreferences: z.array(z.string().max(60)).max(10),
  budgetBand: z.enum(["value", "comfort", "premium", "luxury"]).optional(),
});

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  brief: briefSchema.optional(),
  turnIndex: z.number().int().min(0).max(100).default(0),
});

export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, "chat"), config.rateLimitChatPerMinute);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await processChatTurn(parsed.message, parsed.brief, parsed.turnIndex);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "We couldn't process that just now. Please try again." },
      { status: 500 },
    );
  }
}
