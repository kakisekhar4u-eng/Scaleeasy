import { PlaceholderCRMProvider } from "./placeholderProvider";
import { WebhookCRMProvider } from "./webhookProvider";
import type { CRMProvider } from "./types";

export type CRMFactoryConfig = {
  crmEnabled: boolean;
  crmProvider: string;
  crmWebhookUrl: string;
  crmWebhookToken: string;
  crmTimeoutMs: number;
};

/**
 * Provider factory. When CRM is disabled, the explicit placeholder provider is
 * used. When CRM is enabled, misconfiguration throws — the app must never
 * silently fall back to the placeholder with CRM_ENABLED=true.
 */
export function createCRMProvider(config: CRMFactoryConfig): CRMProvider {
  if (!config.crmEnabled) {
    return new PlaceholderCRMProvider();
  }

  switch (config.crmProvider) {
    case "webhook":
      return new WebhookCRMProvider({
        webhookUrl: config.crmWebhookUrl,
        webhookToken: config.crmWebhookToken,
        timeoutMs: config.crmTimeoutMs,
      });
    default:
      throw new Error(`Unsupported CRM provider: ${config.crmProvider}`);
  }
}

export const CRM_RETRY_SCHEDULE_MINUTES = [0, 5, 30, 120, 720];

export function nextRetryAt(attempts: number, from: Date = new Date()): Date | null {
  if (attempts >= CRM_RETRY_SCHEDULE_MINUTES.length) return null; // manual intervention
  const minutes = CRM_RETRY_SCHEDULE_MINUTES[attempts];
  return new Date(from.getTime() + minutes * 60_000);
}
