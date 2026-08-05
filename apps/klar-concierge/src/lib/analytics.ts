import { getDb } from "@/lib/db";
import { config } from "@/lib/config";

export const ALLOWED_EVENTS = [
  "concierge_page_view",
  "planner_started",
  "planner_message_sent",
  "trip_brief_completed",
  "recommendations_viewed",
  "recommendation_selected",
  "itinerary_viewed",
  "lead_form_started",
  "lead_submitted",
  "lead_submission_failed",
  "crm_delivery_pending",
  "consultant_handover_completed",
] as const;

export type AnalyticsEventName = (typeof ALLOWED_EVENTS)[number];

/** Property keys that must never be sent — personal or sensitive data. */
const FORBIDDEN_PROP_KEYS = [
  "name", "phone", "email", "message", "transcript", "notes",
  "accessibility", "food", "budgetValue", "address",
];

export function sanitiseProps(
  props: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!props) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_PROP_KEYS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) continue;
    if (typeof value === "string" && value.length > 120) continue;
    clean[key] = value;
  }
  return clean;
}

export async function track(
  name: AnalyticsEventName,
  props?: Record<string, unknown>,
): Promise<void> {
  if (!config.featureAnalytics) return;
  if (!ALLOWED_EVENTS.includes(name)) return;
  try {
    await getDb().analyticsEvent.create({
      data: { name, props: sanitiseProps(props) as object | undefined },
    });
  } catch {
    // Analytics must never break the customer flow.
  }
}
