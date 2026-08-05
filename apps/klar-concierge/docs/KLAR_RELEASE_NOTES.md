# Klar Concierge — Release Notes

## 0.1.0 — Phase 1 initial build (2026-08-05)

New product: **Klar Concierge**, an AI-assisted holiday planner and lead qualification
experience for Klar Travels, built as `apps/klar-concierge` in the Scaleeasy monorepo.

### Customer experience
- Landing page with hero, KTIE-driven discovery collections, four-step "How Klar
  helps", human-handover section and Klar-branded design (official logo, navy/red
  palette, green reserved for success).
- Progressive planner: conversation (chips + one follow-up at a time) → editable trip
  brief → three differentiated destination directions with reasons, seasonal fit and
  an honest trade-off → day-by-day draft itinerary → consent-gated lead capture →
  success screen with Klar lead reference.
- Discover, How It Works, Privacy, Terms; sitemap, robots, Open Graph, structured data.
- Accessible: labels, error associations, aria-live chat updates, 44px targets,
  reduced-motion support, mobile-first layouts.

### Intelligence
- KTIE dataset: 20 destinations × 12 months of seasonal intelligence, suitability,
  food and practicality scores, signature experiences, trade-offs, provenance.
- Deterministic recommendation scoring with full explainable breakdowns.
- Deterministic itinerary composer (pace, child/senior/accessibility adjustments).
- AI provider abstraction: optional OpenAI extraction with a deterministic fallback —
  the planner works with no AI key configured.

### Operations
- Durable lead pipeline: Zod validation, mandatory consent, Idempotency-Key,
  duplicate-safe, PostgreSQL-first, CRM afterwards; Klar references (KLAR-YYYY-XXXXXX).
- CRM/RMS deferred by design: explicit placeholder provider, webhook provider +
  factory + retry schedule + backfill scaffolding ready for a future vendor.
- Consultant workspace: dashboard, full lead detail, stages, assignment (by name),
  notes, follow-ups, converted/lost, CRM retry, copy-summary.
- Admin: KTIE review/verification workflow, anonymous funnel analytics, CRM status
  page, live Phase 1 readiness checks, masked audit log.
- Security: Zod validation, rate limits, CSP/frame headers, masked logs, secret-header
  protection on internal CRM endpoints. **No app-level login by design** — the app sits
  inside the klartravels portal, which controls access to internal areas.

### Quality
- 38 Vitest unit tests passing; strict TypeScript; production build verified;
  API smoke test of the full planning flow.

### 0.1.1 — Portal mode (2026-08-05)

- Removed the built-in authentication layer (login page, sessions, roles, user
  accounts). Klar Concierge now assumes it sits inside the klartravels portal,
  which must restrict `/consultant`, `/admin` and their APIs to Klar staff.
- Consultant assignment and note authorship use plain names instead of accounts.
- Internal CRM retry/backfill endpoints authenticate with `CRM_RETRY_SECRET`.

### Known limitations
- Playwright e2e suite not yet added (manual QA checklist provided).
- In-memory rate limiting is per-instance on serverless.
- Seed knowledge ships as *reviewed*; Klar must verify ≥10 destinations before launch.
