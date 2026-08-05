import type { CRMLeadPayload, CRMProvider, CRMProviderHealth, CRMSubmissionResult } from "./types";

/**
 * The explicit no-integration provider for Phase 1.
 *
 * This is NOT a mock external success. It never calls a vendor, never invents
 * an external CRM reference and never pretends a submission occurred.
 * PostgreSQL remains the system of record; the Klar lead reference generated
 * by the application is preserved untouched.
 */
export class PlaceholderCRMProvider implements CRMProvider {
  readonly id = "placeholder";
  readonly name = "No CRM integration (Phase 1)";

  async submitLead(
    lead: CRMLeadPayload,
    _options: { idempotencyKey: string },
  ): Promise<CRMSubmissionResult> {
    if (!lead.id || !lead.reference) {
      // The lead must already exist durably before any CRM step runs.
      return {
        success: false,
        status: "failed",
        errorCode: "LEAD_NOT_PERSISTED",
        errorMessage: "Lead must be stored in PostgreSQL before CRM delivery.",
      };
    }
    return { success: true, status: "disabled" };
  }

  async health(): Promise<CRMProviderHealth> {
    return {
      healthy: true,
      provider: this.id,
      detail:
        "CRM/RMS integration is not configured. Leads are stored safely in Klar's database and handled by the team.",
    };
  }
}
