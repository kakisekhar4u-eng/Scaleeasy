import { runReadinessChecks } from "@/services/readiness/checks";

export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const { ready, checks } = await runReadinessChecks();

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand">Phase 1 readiness</h1>
      <p
        className={`mt-4 rounded-2xl px-5 py-4 text-sm font-medium ${
          ready ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
        }`}
      >
        {ready
          ? "All required checks pass — Klar Concierge is ready for controlled Phase 1 launch."
          : "Some required checks are failing. Resolve them before public launch."}
      </p>

      <ul className="mt-6 space-y-3">
        {checks.map((check) => (
          <li key={check.key} className="card flex items-start gap-3">
            <span
              aria-hidden
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                check.ok ? "bg-success-soft text-success" : "bg-accent-soft text-accent-strong"
              }`}
            >
              {check.ok ? "✓" : "✕"}
            </span>
            <div>
              <p className="text-sm font-semibold text-brand">
                {check.label}
                {!check.required ? (
                  <span className="ml-2 text-xs font-normal text-foreground/50">optional</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-sm text-foreground/65">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
