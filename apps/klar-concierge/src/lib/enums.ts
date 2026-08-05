import type { CRMDeliveryStatus, LeadStage } from "@/types/lead";

/** Domain stage ("new-enquiry") ↔ Prisma enum ("new_enquiry"). */
export function stageToDb(stage: LeadStage): string {
  return stage.replace(/-/g, "_");
}

export function stageFromDb(stage: string): LeadStage {
  return stage.replace(/_/g, "-") as LeadStage;
}

export function crmStatusToDb(status: CRMDeliveryStatus): string {
  return status.replace(/-/g, "_");
}

export function crmStatusFromDb(status: string): CRMDeliveryStatus {
  return status.replace(/_/g, "-") as CRMDeliveryStatus;
}

export const LEAD_STAGES: LeadStage[] = [
  "new-enquiry",
  "consultant-assigned",
  "contact-attempted",
  "requirement-confirmed",
  "quote-in-preparation",
  "quote-sent",
  "follow-up",
  "converted",
  "lost",
];
