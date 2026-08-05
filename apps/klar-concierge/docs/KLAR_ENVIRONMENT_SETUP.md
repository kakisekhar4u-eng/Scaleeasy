# Klar Concierge — Environment Setup

Copy `.env.example` to `.env` and fill in:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Vercel-compatible, e.g. Neon/Supabase/RDS) |
| `NEXT_PUBLIC_APP_URL` | The public URL the app is served from |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Optional. Without a key the deterministic extractor runs the conversation |
| `ENABLE_AI_PERSONALISATION` | `true` by default |
| `CRM_ENABLED` | **`false` for Phase 1.** The placeholder provider is used |
| `CRM_PROVIDER` | `placeholder` (Phase 1) or `webhook` when a real endpoint exists |
| `CRM_WEBHOOK_URL` / `CRM_WEBHOOK_TOKEN` / `CRM_TIMEOUT_MS` | Only used when CRM is enabled |
| `CRM_RETRY_SECRET` | Required header secret for the internal CRM retry/backfill endpoints once CRM is enabled |
| `RATE_LIMIT_*_PER_MINUTE` | Chat 20, leads 5 by default |
| `FEATURE_*` flags | Analytics, consultant workspace, lead retry, KTIE admin |

## Access control

Klar Concierge has **no login of its own** — it is designed to sit inside the
klartravels portal. The portal (or a reverse proxy / hosting rule) must restrict
`/consultant`, `/admin`, `/api/consultant/*`, `/api/admin/*`, `/api/audit` and
`/api/system/readiness` to Klar staff. The public planner routes stay open.

## Local development

```bash
npm install
cd apps/klar-concierge          # or the repo root if extracted standalone
npm run db:generate && npx prisma migrate deploy && npm run db:seed
npm run dev                     # http://localhost:3002
```

Open `/` for the customer planner, `/consultant` for the lead workspace and
`/admin` for knowledge/analytics/readiness — no sign-in required.

## Verification

```bash
npm run typecheck && npm run test && npm run build
```

Then open `/admin/readiness` for the live Phase 1 checklist.
