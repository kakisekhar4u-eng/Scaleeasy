# Klar Concierge — CRM/RMS Integration

## Phase 1 decision

CRM/RMS is intentionally **deferred**. The app launches with:

```env
CRM_ENABLED=false
CRM_PROVIDER=placeholder
```

PostgreSQL is the only system of record. The consultant workspace is the operational
response system. Every lead is saved, referenced and manageable with no CRM at all.

## Placeholder provider

`PlaceholderCRMProvider` is an explicit no-integration provider — not a mock success:

- never calls an external vendor and never references a specific CRM product
- returns `status: "disabled"`; never invents an external CRM reference
- validates the lead was persisted first (`LEAD_NOT_PERSISTED` otherwise)
- preserves the application-generated Klar reference

## Delivery + failure semantics

```
Lead saved (durable) → CRM attempt → success: status=submitted, store crmReferenceId
                                   → failure: status=failed, schedule retry, keep lead
```

Retry backoff: immediately, +5 min, +30 min, +2 h, +12 h → then `manual-intervention`
(visible in the consultant workspace). The customer never resubmits and never sees a
fake CRM success. When CRM is enabled but misconfigured, the factory **throws** —
there is no silent fallback to the placeholder — the lead stays stored and the
CRM-specific readiness check fails without failing the product.

## Endpoints

- `POST /api/internal/crm-retry` — batch retry worker (requires the
  `x-crm-retry-secret` header). Returns a disabled response while `CRM_ENABLED=false`.
  Vercel Cron example (disabled by default) is in `vercel.json`.
- `POST /api/internal/crm-backfill` — secret-protected, dry-run by default; delivers
  historical `disabled` leads in idempotent batches once a real provider exists.
- `POST /api/consultant/leads/:id/retry-crm` — single-lead retry from the workspace.

## Adding a real provider later

1. Implement `CRMProvider` (see `src/services/crm/types.ts`).
2. Register it in `createCRMProvider` (`src/services/crm/factory.ts`).
3. Add credentials as server env vars.
4. Set `CRM_ENABLED=true`, `CRM_PROVIDER=<id>`.
5. Run the backfill for historical leads.

No UI, database or public API changes are required — the `WebhookCRMProvider`
(HTTPS + bearer token + idempotency header + timeout) is a ready reference.
