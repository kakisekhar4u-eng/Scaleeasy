# Klar Concierge — Deployment (Vercel + PostgreSQL)

## One-time setup

1. **Database** — create a PostgreSQL instance (Neon, Supabase, RDS…). Note the URL.
2. **Vercel project** — import the GitHub repo; set **Root Directory** to
   `apps/klar-concierge` (monorepo). Framework: Next.js. Build command
   `npm run build` (runs `prisma generate` first — see `vercel.json`).
3. **Environment variables** (Production + Preview):
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL=https://<your-domain>`
   - `CRM_ENABLED=false`, `CRM_PROVIDER=placeholder`
   - optional: `OPENAI_API_KEY`, `OPENAI_MODEL`
4. **Migrate + seed** (from a machine that can reach the DB):
   ```bash
   cd apps/klar-concierge
   DATABASE_URL=… npx prisma migrate deploy
   DATABASE_URL=… npm run db:seed
   ```
5. **Protect internal routes.** There is no app login: restrict `/consultant`,
   `/admin`, `/api/consultant/*`, `/api/admin/*`, `/api/audit` and
   `/api/system/readiness` at the klartravels portal / reverse proxy
   (e.g. Vercel protection, portal session check, or IP allow-list).
6. Deploy and open `/admin/readiness`.

## Suggested domain layout

`concierge.klartravels.com` → this app, linked from the main klartravels.com site
("Plan My Holiday" CTA). Keep the main site untouched; the planner is self-contained.

## Cron (only when CRM is enabled later)

`vercel.json` carries a disabled example. To activate, move it to a real `crons` key:

```json
{ "crons": [{ "path": "/api/internal/crm-retry", "schedule": "*/15 * * * *" }] }
```

and set `CRM_RETRY_SECRET`; the endpoint returns a disabled response while
`CRM_ENABLED=false`, so enabling the cron early is harmless but pointless.

## Post-deploy smoke test

```bash
curl -s https://<domain>/ -o /dev/null -w '%{http_code}\n'                    # 200
curl -s -X POST https://<domain>/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"7 nights in December for a family from Mumbai","turnIndex":0}'
# → JSON with brief + follow-up question
```

Then run one full planner journey on a phone, confirm the lead appears in
`/consultant`, and check `/admin/readiness`.

## Notes

- The in-memory rate limiter is per-serverless-instance (soft limit). Move to a
  shared store (Upstash Redis) before heavy traffic.
- Prisma client output is `src/generated/prisma` (gitignored) — regenerated on every
  build, so deploys never depend on committed generated code.
