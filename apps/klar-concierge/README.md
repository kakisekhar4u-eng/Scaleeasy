# Klar Concierge

AI-assisted holiday planning and lead qualification for **Klar Travels** (klartravels.com) — Phase 1.

Customers describe the holiday they want, build a structured trip brief through a guided
conversation, compare **three personalised destination directions**, review a draft
itinerary, and hand the complete plan to a Klar travel expert. Phase 1 ends at a qualified
lead — there is **no booking, pricing, availability or payment** anywhere in the product.

```
Conversation → Trip brief → Three directions → Itinerary → Lead capture → Klar expert handover
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma (the only system of record for leads)
- Zod validation on every API
- OpenAI (optional) behind a provider abstraction with a deterministic fallback —
  the planner works fully without an AI key
- KTIE (Klar Travel Intelligence Engine): 20 seeded destinations with monthly
  seasonal intelligence, suitability, food and practicality scores
- Vitest unit tests

## Quick start

```bash
# from the repo root
npm install

cd apps/klar-concierge
cp .env.example .env          # fill DATABASE_URL, AUTH_SECRET, SEED_ADMIN_*
npm run db:generate
npx prisma migrate deploy      # applies prisma/migrations to your PostgreSQL
npm run db:seed                # 20 KTIE destinations + admin user
npm run dev                    # http://localhost:3002
```

The public planner (`/`, `/concierge`, `/concierge/discover`) works without a database.
Lead submission, the consultant workspace and admin pages require PostgreSQL.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 3002 |
| `npm run build` | `prisma generate` + production build |
| `npm run test` | Vitest unit tests (38 tests) |
| `npm run typecheck` / `lint` | TypeScript strict check |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:seed` | Seed KTIE destinations + admin user |

## Key routes

Public: `/`, `/concierge`, `/concierge/discover`, `/concierge/how-it-works`, `/privacy`, `/terms`
Internal (role-protected): `/consultant`, `/consultant/leads/:id`, `/admin`, `/admin/knowledge/destinations`, `/admin/analytics`, `/admin/integrations/crm`, `/admin/readiness`, `/admin/audit`
Sign-in: `/login`

## Documentation

See [`docs/`](./docs) — product overview, architecture, database, environment setup,
CRM integration, KTIE guide, admin & consultant guides, test plan, QA checklist,
deployment and release notes.

## Phase 1 guarantees

- A customer never sees success unless the lead is stored durably in PostgreSQL.
- CRM/RMS is intentionally **disabled** (`CRM_ENABLED=false`, placeholder provider);
  the app launches and operates fully without any CRM vendor.
- The placeholder provider never fakes an external submission or reference.
- Recommendations come only from the verified KTIE dataset — the AI never invents
  destinations, visa rules, prices or availability.
- The official Klar logo (`public/brand/klar-logo.png` / `.svg`) is used exactly as supplied.
