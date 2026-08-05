import type { TravelBrief } from "./brief";
import type { ItineraryDay, RecommendationDirection, RecommendationScore } from "./recommendation";

export type LeadStage =
  | "new-enquiry"
  | "consultant-assigned"
  | "contact-attempted"
  | "requirement-confirmed"
  | "quote-in-preparation"
  | "quote-sent"
  | "follow-up"
  | "converted"
  | "lost";

export type LeadPriority = "low" | "medium" | "high" | "urgent";

export type ContactChannel = "phone" | "email" | "whatsapp";

export type CRMDeliveryStatus =
  | "disabled"
  | "pending"
  | "submitted"
  | "failed"
  | "manual-intervention";

export type KlarConciergeLead = {
  id: string;
  reference: string;
  idempotencyKey: string;

  source: "klar-concierge";

  stage: LeadStage;
  priority: LeadPriority;

  customer: {
    name: string;
    phone: string;
    email: string;
    preferredContactChannel: ContactChannel;
    preferredContactTime?: string;
    additionalNotes?: string;
    consent: true;
    consentTimestamp: string;
  };

  tripBrief: TravelBrief;

  recommendations: Array<{
    conceptId: string;
    destinationSlug: string;
    direction: RecommendationDirection;
    score: RecommendationScore;
    reasons: string[];
    tradeOff: string;
  }>;

  selectedRecommendation?: {
    conceptId: string;
    destinationSlug: string;
    direction: RecommendationDirection;
  };

  itinerary: ItineraryDay[];

  conversationTranscript: Array<{
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;

  leadScore: number;

  crmDelivery: {
    status: CRMDeliveryStatus;
    provider: string;
    attempts: number;
    crmReferenceId?: string;
    lastAttemptAt?: string;
    nextRetryAt?: string;
    errorCode?: string;
    errorMessage?: string;
  };

  consultantOwnerId?: string;
  followUpDueAt?: string;

  createdAt: string;
  updatedAt: string;
};
