# Klar Concierge — Changed Files (0.1.0)

All changes are additive. New workspace: `apps/klar-concierge/`.

## Repo root
- `package.json` — added `apps/klar-concierge` implicitly via `apps/*` workspaces;
  hoisted `react`/`react-dom` 19 at the root (apps/web keeps its own nested React 18);
  added `dev:klar` script.

## App scaffolding
- `package.json`, `tsconfig.json`, `next.config.mjs` (security headers/CSP),
  `postcss.config.js`, `tailwind.config.ts`, `vitest.config.ts`, `.env.example`,
  `.gitignore`, `vercel.json`, `README.md`

## Brand
- `public/brand/klar-logo.png` — official logo exactly as supplied
- `public/brand/klar-logo.svg` — SVG wrapper embedding the exact PNG artwork

## Database
- `prisma/schema.prisma`, `prisma/migrations/0001_init/migration.sql`,
  `prisma/migrations/migration_lock.toml`, `prisma/seed.ts`

## Domain (src/types, src/services)
- `types/brief.ts`, `types/destination.ts`, `types/recommendation.ts`, `types/lead.ts`
- `services/ktie/{builders,data,discover}.ts`
- `services/ai/{types,fallbackExtractor,openaiProvider,index}.ts`
- `services/conversation/engine.ts`
- `services/recommendations/scoring.ts`
- `services/itinerary/composer.ts`
- `services/leads/{reference,scoring}.ts`
- `services/crm/{types,placeholderProvider,webhookProvider,factory}.ts`
- `services/readiness/checks.ts`

## Libraries (src/lib)
- `config.ts`, `db.ts`, `enums.ts`, `rateLimit.ts`, `audit.ts`, `analytics.ts`,
  `auth/{password,session}.ts`

## App Router (src/app)
- Public: `layout.tsx`, `globals.css`, `(public)/{layout,page}.tsx`,
  `(public)/concierge/{page,discover/page,how-it-works/page}.tsx`,
  `(public)/{privacy,terms}/page.tsx`, `login/page.tsx`, `not-found.tsx`,
  `robots.ts`, `sitemap.ts`
- Consultant: `consultant/{layout,page}.tsx`, `consultant/leads/[id]/page.tsx`
- Admin: `admin/{layout,page}.tsx`, `admin/knowledge/page.tsx`,
  `admin/knowledge/destinations/{page,[slug]/page}.tsx`,
  `admin/{analytics,readiness,audit}/page.tsx`, `admin/integrations/crm/page.tsx`
- APIs: `api/{chat,plan,discover,analytics,leads,audit}/route.ts`,
  `api/leads/reference/[reference]/route.ts`, `api/auth/{login,logout,session}/route.ts`,
  `api/consultant/leads/{route.ts,[id]/route.ts,[id]/notes/route.ts,[id]/retry-crm/route.ts}`,
  `api/admin/destinations/{route.ts,[slug]/route.ts}`,
  `api/internal/{crm-retry,crm-backfill}/route.ts`, `api/system/readiness/route.ts`

## Components (src/components)
- `brand/KlarLogo.tsx`, `layout/{Header,Footer}.tsx`
- `planner/{Planner,BriefReview,RecommendationCards,ItineraryView,LeadForm,SuccessView}.tsx`
- `internal/{LogoutButton,LeadActions,DestinationReview}.tsx`

## Tests
- `tests/{fallbackExtractor,scoring,itinerary,leads,crm,ktie}.test.ts` — 38 tests

## Docs
- `docs/KLAR_{PRODUCT_OVERVIEW,ARCHITECTURE,DATABASE,ENVIRONMENT_SETUP,
  CRM_INTEGRATION,KTIE_GUIDE,ADMIN_GUIDE,CONSULTANT_GUIDE,TEST_PLAN,QA_CHECKLIST,
  DEPLOYMENT,RELEASE_NOTES,CHANGED_FILES}.md`
