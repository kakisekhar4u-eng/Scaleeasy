function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === "") return fallback;
  return value === "true" || value === "1";
}

function int(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? "", 10);
  return Number.isNaN(n) ? fallback : n;
}

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002",
  isProduction: process.env.NODE_ENV === "production",

  databaseUrl: process.env.DATABASE_URL ?? "",

  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-5-mini",
  enableAIPersonalisation: bool(process.env.ENABLE_AI_PERSONALISATION, true),

  crmEnabled: bool(process.env.CRM_ENABLED, false),
  crmProvider: process.env.CRM_PROVIDER ?? "placeholder",
  crmWebhookUrl: process.env.CRM_WEBHOOK_URL ?? "",
  crmWebhookToken: process.env.CRM_WEBHOOK_TOKEN ?? "",
  crmTimeoutMs: int(process.env.CRM_TIMEOUT_MS, 8000),
  crmRetrySecret: process.env.CRM_RETRY_SECRET ?? "",

  enableKtieAdmin: bool(process.env.ENABLE_KTIE_ADMIN, true),
  featureAnalytics: bool(process.env.FEATURE_ANALYTICS, true),
  featureConsultantWorkspace: bool(process.env.FEATURE_CONSULTANT_WORKSPACE, true),
  featureLeadRetry: bool(process.env.FEATURE_LEAD_RETRY, true),

  rateLimitChatPerMinute: int(process.env.RATE_LIMIT_CHAT_PER_MINUTE, 20),
  rateLimitLeadsPerMinute: int(process.env.RATE_LIMIT_LEADS_PER_MINUTE, 5),

  logLevel: process.env.LOG_LEVEL ?? "info",
};
