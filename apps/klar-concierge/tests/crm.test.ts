import { describe, expect, it } from "vitest";
import { createCRMProvider, nextRetryAt, CRM_RETRY_SCHEDULE_MINUTES } from "@/services/crm/factory";
import { PlaceholderCRMProvider } from "@/services/crm/placeholderProvider";

const baseConfig = {
  crmEnabled: false,
  crmProvider: "placeholder",
  crmWebhookUrl: "",
  crmWebhookToken: "",
  crmTimeoutMs: 8000,
};

const storedLead = {
  id: "lead_1",
  reference: "KLAR-2026-ABCDEF",
  idempotencyKey: "idem-123",
  customerName: "Test Customer",
  customerPhone: "+911234567890",
  customerEmail: "test@example.com",
  destinationSlug: "bali",
  leadScore: 80,
  createdAt: new Date().toISOString(),
};

describe("CRM provider factory", () => {
  it("returns the placeholder provider when CRM is disabled", () => {
    const provider = createCRMProvider(baseConfig);
    expect(provider.id).toBe("placeholder");
  });

  it("throws (no silent placeholder fallback) when CRM is enabled but misconfigured", () => {
    expect(() =>
      createCRMProvider({ ...baseConfig, crmEnabled: true, crmProvider: "webhook" }),
    ).toThrow();
    expect(() =>
      createCRMProvider({ ...baseConfig, crmEnabled: true, crmProvider: "unknown-vendor" }),
    ).toThrow();
  });

  it("creates a webhook provider with valid HTTPS config", () => {
    const provider = createCRMProvider({
      ...baseConfig,
      crmEnabled: true,
      crmProvider: "webhook",
      crmWebhookUrl: "https://crm.example.com/leads",
      crmWebhookToken: "secret",
    });
    expect(provider.id).toBe("webhook");
  });
});

describe("placeholder provider", () => {
  it("returns disabled status and never an external CRM reference", async () => {
    const provider = new PlaceholderCRMProvider();
    const result = await provider.submitLead(storedLead, { idempotencyKey: "idem-123" });
    expect(result.success).toBe(true);
    expect(result.status).toBe("disabled");
    expect(result.crmReferenceId).toBeUndefined();
  });

  it("fails when the lead has not been persisted first", async () => {
    const provider = new PlaceholderCRMProvider();
    const result = await provider.submitLead(
      { ...storedLead, id: "", reference: "" },
      { idempotencyKey: "idem-123" },
    );
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("LEAD_NOT_PERSISTED");
  });
});

describe("retry schedule", () => {
  it("follows the documented backoff schedule", () => {
    expect(CRM_RETRY_SCHEDULE_MINUTES).toEqual([0, 5, 30, 120, 720]);
    const from = new Date("2026-01-01T00:00:00Z");
    expect(nextRetryAt(1, from)!.getTime() - from.getTime()).toBe(5 * 60_000);
    expect(nextRetryAt(4, from)!.getTime() - from.getTime()).toBe(720 * 60_000);
  });

  it("escalates to manual intervention after the final attempt", () => {
    expect(nextRetryAt(5)).toBeNull();
  });
});
