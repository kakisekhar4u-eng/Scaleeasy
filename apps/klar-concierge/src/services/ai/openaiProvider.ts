import { z } from "zod";
import type { AIProvider, BriefExtractionInput, BriefExtractionOutput, FollowUpInput } from "./types";
import { FallbackAIProvider } from "./fallbackExtractor";

const patchSchema = z.object({
  briefPatch: z
    .object({
      originCity: z.string().optional(),
      departureAirport: z.string().optional(),
      travelMonth: z.number().int().min(1).max(12).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      flexibilityDays: z.number().int().min(0).max(60).optional(),
      durationNights: z.number().int().min(1).max(30).optional(),
      travellerType: z
        .enum(["family", "couple", "honeymoon", "solo", "friends", "senior", "corporate"])
        .optional(),
      adults: z.number().int().min(1).max(20).optional(),
      childrenAges: z.array(z.number().int().min(0).max(17)).optional(),
      seniorTravellers: z.number().int().min(0).max(20).optional(),
      pace: z.enum(["relaxed", "balanced", "active"]).optional(),
      interests: z.array(z.string()).optional(),
      occasion: z.string().optional(),
      accessibilityNeeds: z.array(z.string()).optional(),
      foodPreferences: z.array(z.string()).optional(),
      budgetBand: z.enum(["value", "comfort", "premium", "luxury"]).optional(),
    })
    .partial(),
  detectedIntent: z.enum(["plan-holiday", "refine-preferences", "answer-follow-up", "unknown"]),
  confidence: z.number().min(0).max(1),
});

const SYSTEM_PROMPT = `You extract structured holiday preferences from customer messages for Klar Travels.
Rules:
- Only extract what the customer actually said. Never invent preferences.
- Never mention or choose destinations, prices, visas, availability or bookings.
- interests must be from: beach, food, culture, history, city, shopping, adventure, nature, relaxation, nightlife, themeparks, romance, wildlife, snow.
- Respond with JSON only, matching the given schema.`;

/**
 * OpenAI-backed extraction. Any failure (network, key, parsing) falls back to
 * the deterministic extractor so the planner never depends on the AI provider.
 */
export class OpenAIProvider implements AIProvider {
  readonly id = "openai";
  private fallback = new FallbackAIProvider();

  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async extractBrief(input: BriefExtractionInput): Promise<BriefExtractionOutput> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: JSON.stringify({
                message: input.message,
                currentBrief: input.currentBrief,
                expectedShape: {
                  briefPatch: "partial TravelBrief",
                  detectedIntent: "plan-holiday | refine-preferences | answer-follow-up | unknown",
                  confidence: "0..1",
                },
              }),
            },
          ],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty AI response");
      const parsed = patchSchema.parse(JSON.parse(content));
      // Merge with deterministic extraction so obvious fields are never lost.
      const deterministic = await this.fallback.extractBrief(input);
      return {
        briefPatch: { ...deterministic.briefPatch, ...parsed.briefPatch },
        detectedIntent: parsed.detectedIntent,
        confidence: parsed.confidence,
      };
    } catch {
      return this.fallback.extractBrief(input);
    }
  }

  async composeFollowUp(input: FollowUpInput): Promise<string> {
    // Follow-up wording is deterministic — no AI needed for a single question.
    return this.fallback.composeFollowUp(input);
  }
}
