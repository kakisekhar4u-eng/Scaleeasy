# Klar Concierge — Environment Setup

Copy `.env.example` to `.env` and fill in:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Vercel-compatible, e.g. Neon/Supabase/RDS) |
| `AUTH_SECRET` | Random ≥32 chars (`openssl rand -hex 32`). Required for readiness |
| `AUTH_COOKIE_NAME` / `AUTH_SESSION_HOURS` | Defaults: `klar_session`, 12 |
| `ENABLE_AUTH_BYPASS` | Must stay `false` in production |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Consumed once by `npm run db:seed` — no hard-coded credentials exist |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Optional. Without a key the deterministic extractor runs the conversation |
| `ENABLE_AI_PERSONALISATION` | `true` by default |
| `CRM_ENABLED` | **`false` for Phase 1.** The placeholder provider is used |
| `CRM_PROVIDER` | `placeholder` (Phase 1) or `webhook` when a real endpoint exists |
| `CRM_WEBHOOK_URL` / `CRM_WEBHOOK_TOKEN` / `CRM_TIMEOUT_MS` | Only used when CRM is enabled |
| `CRM_RETRY_SECRET` | Header secret for `/api/internal/crm-retry` (cron) |
| `RATE_LIMIT_*_PER_MINUTE` | Chat 20, leads 5, login 5 by default |
| `FEATURE_*` flags | Analytics, consultant workspace, lead retry, KTIE admin |

## Local development

```bash
npm install                     # repo root
cd apps/klar-concierge
npm run db:generate && npx prisma migrate deploy && npm run db:seed
npm run dev                     # http://localhost:3002
```

Sign in at `/login` with the seeded admin. Create consultant users by inserting
`User` rows (role `consultant`) — password hashes via `src/lib/auth/password.ts`.

## Verification

```bash
npm run typecheck && npm run test && npm run build
```

Then open `/admin/readiness` for the live Phase 1 checklist.
