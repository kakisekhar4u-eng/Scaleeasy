import {
  briefReadyForRecommendations,
  emptyBrief,
  missingBriefFields,
  type TravelBrief,
} from "@/types/brief";
import { getAIProvider } from "@/services/ai";

export type ChatTurnResult = {
  brief: TravelBrief;
  assistantMessage: string;
  readyForRecommendations: boolean;
  missingFields: string[];
};

function mergeBrief(current: TravelBrief, patch: Partial<TravelBrief>): TravelBrief {
  return {
    ...current,
    ...patch,
    // Arrays: union rather than overwrite so earlier answers survive.
    interests: patch.interests
      ? Array.from(new Set([...current.interests, ...patch.interests]))
      : current.interests,
    childrenAges: patch.childrenAges ?? current.childrenAges,
    accessibilityNeeds: patch.accessibilityNeeds
      ? Array.from(new Set([...current.accessibilityNeeds, ...patch.accessibilityNeeds]))
      : current.accessibilityNeeds,
    foodPreferences: patch.foodPreferences
      ? Array.from(new Set([...current.foodPreferences, ...patch.foodPreferences]))
      : current.foodPreferences,
    originalPrompt: current.originalPrompt || patch.originalPrompt || "",
  };
}

const ACKNOWLEDGEMENTS = [
  "Lovely — noted.",
  "Great, that helps.",
  "Perfect, thank you.",
  "Got it.",
];

/**
 * Process one user message: extract preferences, merge into the brief and
 * decide the single most useful follow-up question.
 */
export async function processChatTurn(
  message: string,
  currentBrief: TravelBrief | undefined,
  turnIndex: number,
): Promise<ChatTurnResult> {
  const base = currentBrief ?? emptyBrief(message);
  const ai = getAIProvider();
  const extraction = await ai.extractBrief({ message, currentBrief: base });
  const brief = mergeBrief(
    base.originalPrompt ? base : { ...base, originalPrompt: message },
    extraction.briefPatch,
  );

  const missing = missingBriefFields(brief);
  const ready = briefReadyForRecommendations(brief);

  let assistantMessage: string;
  if (missing.length === 0 || (ready && turnIndex >= 3)) {
    assistantMessage =
      "Wonderful — I have a clear picture of your holiday. Review your trip brief below, adjust anything you like, then I'll suggest three directions for you.";
  } else {
    const ack = ACKNOWLEDGEMENTS[turnIndex % ACKNOWLEDGEMENTS.length];
    const question = await ai.composeFollowUp({ brief, missingField: missing[0] });
    assistantMessage = turnIndex === 0 ? question : `${ack} ${question}`;
  }

  return {
    brief,
    assistantMessage,
    readyForRecommendations: ready,
    missingFields: missing,
  };
}
