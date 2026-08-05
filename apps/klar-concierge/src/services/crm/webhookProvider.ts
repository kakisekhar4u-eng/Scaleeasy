import type { CRMLeadPayload, CRMProvider, CRMProviderHealth, CRMSubmissionResult } from "./types";

export type WebhookCRMConfig = {
  webhookUrl: string;
  webhookToken: string;
  timeoutMs: number;
};

/**
 * Generic HTTPS webhook delivery for a future CRM/RMS.
 * Bearer auth + idempotency header + timeout; retry-safe payload.
 */
export class WebhookCRMProvider implements CRMProvider {
  readonly id = "webhook";
  readonly name = "Webhook CRM delivery";

  constructor(private cfg: WebhookCRMConfig) {
    if (!cfg.webhookUrl || !cfg.webhookUrl.startsWith("https://")) {
      throw new Error("WebhookCRMProvider requires an HTTPS CRM_WEBHOOK_URL");
    }
    if (!cfg.webhookToken) {
      throw new Error("WebhookCRMProvider requires CRM_WEBHOOK_TOKEN");
    }
  }

  async submitLead(
    lead: CRMLeadPayload,
    options: { idempotencyKey: string },
  ): Promise<CRMSubmissionResult> {
    try {
      const response = await fetch(this.cfg.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.cfg.webhookToken}`,
          "Idempotency-Key": options.idempotencyKey,
        },
        body: JSON.stringify({ source: "klar-concierge", lead }),
        signal: AbortSignal.timeout(this.cfg.timeoutMs),
      });
      if (!response.ok) {
        return {
          success: false,
          status: "failed",
          errorCode: `HTTP_${response.status}`,
          errorMessage: "CRM endpoint rejected the delivery.",
        };
      }
      let crmReferenceId: string | undefined;
      try {
        const body = (await response.json()) as { referenceId?: string; id?: string };
        crmReferenceId = body.referenceId ?? body.id;
      } catch {
        // Response body is optional; delivery already succeeded.
      }
      return { success: true, status: "submitted", crmReferenceId };
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      return {
        success: false,
        status: "failed",
        errorCode: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
        errorMessage: "CRM delivery did not complete. The lead remains stored and will retry.",
      };
    }
  }

  async health(): Promise<CRMProviderHealth> {
    return {
      healthy: true,
      provider: this.id,
      detail: "Webhook provider configured. Delivery is attempted per lead.",
    };
  }
}
