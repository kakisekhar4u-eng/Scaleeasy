import { getDb } from "@/lib/db";
import { config } from "@/lib/config";
import { createCRMProvider } from "@/services/crm/factory";

export const dynamic = "force-dynamic";

export default async function CRMIntegrationPage() {
  const db = getDb();
  const statusCounts = await db.lead.groupBy({ by: ["crmStatus"], _count: { crmStatus: true } });

  let health = { healthy: false, provider: "unknown", detail: "Provider could not be created." };
  try {
    const provider = createCRMProvider(config);
    health = await provider.health();
  } catch (e) {
    health = {
      healthy: false,
      provider: config.crmProvider,
      detail: e instanceof Error ? e.message : "CRM configuration invalid.",
    };
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">CRM / RMS integration</h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="font-semibold text-brand">Current provider</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Provider</dt><dd className="font-medium">{config.crmEnabled ? config.crmProvider : "placeholder (no integration)"}</dd></div>
            <div className="flex justify-between"><dt>State</dt><dd className="font-medium">{config.crmEnabled ? "Enabled" : "Disabled (Phase 1 default)"}</dd></div>
            <div className="flex justify-between"><dt>Health</dt><dd className="font-medium">{health.healthy ? "OK" : "Attention needed"}</dd></div>
          </dl>
          <p className="mt-3 rounded-lg bg-surface-muted p-3 text-sm text-foreground/70">{health.detail}</p>
          <button
            type="button"
            className="btn-secondary mt-4 w-full opacity-60"
            disabled
            title={config.crmEnabled ? "" : "No external CRM is configured in Phase 1"}
          >
            Test connection {config.crmEnabled ? "" : "(unavailable — placeholder provider)"}
          </button>
        </section>

        <section className="card">
          <h2 className="font-semibold text-brand">Leads by CRM status</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {statusCounts.length === 0 ? (
              <p className="text-foreground/55">No leads yet.</p>
            ) : (
              statusCounts.map((s) => (
                <div key={s.crmStatus} className="flex justify-between">
                  <dt>{s.crmStatus.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{s._count.crmStatus}</dd>
                </div>
              ))
            )}
          </dl>
        </section>
      </div>

      <section className="card mt-4">
        <h2 className="font-semibold text-brand">Connecting a real CRM later</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-foreground/70">
          <li>Implement the provider against the <code>CRMProvider</code> interface (see <code>src/services/crm/</code>).</li>
          <li>Register it in <code>createCRMProvider</code>.</li>
          <li>Add credentials as environment variables (never in the browser).</li>
          <li>Set <code>CRM_ENABLED=true</code> and <code>CRM_PROVIDER=&lt;id&gt;</code>.</li>
          <li>Run the backfill (<code>POST /api/internal/crm-backfill</code>) for historical leads.</li>
        </ol>
        <p className="mt-3 text-xs text-foreground/55">
          Required environment variables: CRM_ENABLED, CRM_PROVIDER, CRM_WEBHOOK_URL,
          CRM_WEBHOOK_TOKEN, CRM_TIMEOUT_MS, CRM_RETRY_SECRET. Secrets are configured on the
          server only and never displayed here.
        </p>
      </section>
    </div>
  );
}
