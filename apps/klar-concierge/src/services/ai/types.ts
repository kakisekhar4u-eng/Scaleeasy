import type { TravelBrief } from "@/types/brief";

export type BriefExtractionInput = {
  message: string;
  currentBrief: TravelBrief;
};

export type BriefExtractionOutput = {
  briefPatch: Partial<TravelBrief>;
  detectedIntent: "plan-holiday" | "refine-preferences" | "answer-follow-up" | "unknown";
  confidence: number;
};

export type FollowUpInput = {
  brief: TravelBrief;
  missingField: string;
};

export interface AIProvider {
  readonly id: string;
  extractBrief(input: BriefExtractionInput): Promise<BriefExtractionOutput>;
  composeFollowUp(input: FollowUpInput): Promise<string>;
}
