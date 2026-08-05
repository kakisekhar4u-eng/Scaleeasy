# Klar Concierge — Phase 1 QA Checklist

## Build health (verified in this build)
- [x] `npm run typecheck` clean
- [x] `npm run test` — 38/38 passing
- [x] `npm run build` — production build succeeds, all routes compiled
- [x] Landing, `/api/chat`, `/api/plan` smoke-tested against the production server

## Brand & UI
- [x] Exact official logo at `public/brand/klar-logo.png` (+ `.svg` wrapper embedding
      the supplied artwork) — never redrawn or restyled
- [x] Navy/red/white palette; green used only for success states
- [x] No glassmorphism, gradients-heavy panels, AI-glow effects or dashboard look
- [ ] Visual pass on real devices at 320 / 375 / 390 / 430 / 768 / 1024 / 1440 px

## Journey
- [x] Progressive stages: conversation → brief → directions → itinerary → lead → success
- [x] Chips populate the input; one follow-up question at a time
- [x] Trip brief fully editable, no raw JSON
- [x] Exactly three directions, unique destinations, reasons + one trade-off each
- [x] Itinerary labelled "A starting plan for your Klar expert to refine"
- [x] Consent mandatory; success shows the Klar reference
- [x] No prices, booking, payments, availability or supplier claims anywhere

## Data & safety
- [x] Lead stored durably before any CRM step; Idempotency-Key required
- [x] Duplicate submission returns the original reference (no duplicate lead)
- [x] CRM-disabled mode passes readiness; placeholder never fakes success
- [x] Analytics events exclude all personal data (allow-list + key filter)
- [x] Audit records mask email/phone
- [x] Rate limits on chat, plan, leads
- [ ] Portal/reverse-proxy restricts `/consultant`, `/admin` and internal APIs (no app login by design)

## Before public launch (operational)
- [ ] Klar team verifies ≥10 destinations in `/admin/knowledge`
- [ ] Portal access rules for internal routes confirmed in production
- [ ] Error monitoring (e.g. Sentry) wired into the Vercel project
- [ ] Privacy/terms copy reviewed by Klar
- [ ] Real-device mobile pass completed
