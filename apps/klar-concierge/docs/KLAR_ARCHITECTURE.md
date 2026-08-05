# Klar Concierge — Architecture

```
Public pages (Next.js App Router, server components)
      ↓
Planner (client component state machine)
      ↓  /api/chat            → conversation engine (AI provider + deterministic fallback)
      ↓  /api/plan            → KTIE scoring → three directions / itinerary composer
      ↓  /api/leads           → durable lead store (PostgreSQL) → CRM provider (placeholder)
      ↓
Consultant workspace + Admin (access controlled by the klartravels portal)
```

## Layers

- `src/types/` — domain types (TravelBrief, DestinationKnowledge, Recommendation, Lead).
- `src/services/ai/` — `AIProvider` interface, OpenAI implementation, deterministic
  fallback extractor. Any AI failure silently falls back; the planner never depends on AI.
- `src/services/ktie/` — the 20-destination knowledge dataset + discovery collections.
  Recommendations are grounded **only** in this data.
- `src/services/recommendations/` — deterministic scoring (season, traveller, children,
  seniors, taste, duration, pace, budget, flight fatigue, accessibility, confidence)
  returning a full breakdown; three-direction selection with uniqueness guarantees.
- `src/services/itinerary/` — deterministic composer honouring duration limits, pace,
  child/senior/accessibility adjustments; never claims reservations.
- `src/services/crm/` — vendor-neutral `CRMProvider` interface, `PlaceholderCRMProvider`
  (explicit no-integration), `WebhookCRMProvider` (future), factory that refuses to
  silently fall back when CRM is enabled, retry schedule (0/5/30/120/720 min).
- `src/services/leads/` — reference generation (unambiguous alphabet), lead scoring.
- `src/services/readiness/` — Phase 1 readiness checks (env, DB, KTIE thresholds, CRM mode).
- `src/lib/` — config, Prisma client, rate limiting, audit (masked PII), analytics
  (allow-listed events).

## Durable lead sequence

```
Validate request → Validate consent → Require Idempotency-Key → Check duplicate
→ Save lead to PostgreSQL → Mark CRM status (disabled|pending) → Attempt CRM delivery
→ Record attempt → Return Klar lead reference
```

CRM failure never blocks the customer; the lead stays stored, status becomes `failed`,
a retry is scheduled, and the consultant workspace shows the state.

## Security

Zod validation everywhere, fixed-window rate limits on chat/plan/leads, CSP and
frame-deny headers, masked audit logs, ORM-only SQL access, no secrets in the browser.
There is **no app-level login by design**: the app sits inside the klartravels portal,
which must restrict `/consultant`, `/admin` and their APIs to Klar staff. The internal
CRM retry/backfill endpoints require the `CRM_RETRY_SECRET` header once CRM is enabled.
The in-memory rate limiter is per-instance — swap for a shared store (e.g. Upstash)
before horizontal scaling.
