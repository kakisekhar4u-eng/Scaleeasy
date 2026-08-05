export type CRMSubmissionResult = {
  success: boolean;
  status: "disabled" | "pending" | "submitted" | "failed";
  crmReferenceId?: string;
  errorCode?: string;
  errorMessage?: string;
};

export type CRMProviderHealth = {
  healthy: boolean;
  provider: string;
  detail: string;
};

/** Minimal shape a provider needs — the durably-stored lead. */
export type CRMLeadPayload = {
  id: string;
  reference: string;
  idempotencyKey: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  destinationSlug?: string;
  leadScore: number;
  createdAt: string;
};

export interface CRMProvider {
  readonly id: string;
  readonly name: string;
  submitLead(
    lead: CRMLeadPayload,
    options: { idempotencyKey: string },
  ): Promise<CRMSubmissionResult>;
  health(): Promise<CRMProviderHealth>;
}
