# Klar Concierge — Test Plan

## Automated (Vitest — `npm run test`, 38 tests)

- **Brief extraction** (`tests/fallbackExtractor.test.ts`) — month, duration (digits,
  words, weeks), traveller type, child ages (lists and "3-year-old"), seniors, origin
  city, pace, budget band, interests, accessibility, food preferences, intent fallback,
  follow-up questions.
- **Missing-information detection** (`tests/ktie.test.ts`) — gaps on empty briefs,
  readiness once the core trip shape is known; dataset invariants (20 destinations,
  12 months each, review metadata, night ordering, trade-offs present); discovery
  collections.
- **Recommendation scoring** (`tests/scoring.test.ts`) — full breakdown bounds,
  exactly three differentiated directions with unique destinations, seasonal
  penalties, flight-fatigue sensitivity for young children, reasons + trade-off on
  every card, duration fit.
- **Itinerary** (`tests/itinerary.test.ts`) — duration respected and clamped to
  destination min/max, arrival/departure framing, senior and accessibility notes,
  never claims bookings/availability.
- **Leads** (`tests/leads.test.ts`) — reference format/uniqueness/validation,
  deterministic scoring and priority mapping, 100-point cap.
- **CRM** (`tests/crm.test.ts`) — placeholder when disabled, throw (no silent
  fallback) when enabled but misconfigured, webhook provider config validation,
  placeholder never claims external submission, persistence-first rule, retry
  schedule and manual-intervention escalation.

## Manual QA scenarios (see KLAR_QA_CHECKLIST.md)

Family with two children · honeymoon couple · senior travellers · undecided customer ·
December holiday · four-night short trip · accessibility requirement · food-led
holiday · CRM temporary failure (enabled mode) · duplicate lead submission (same
Idempotency-Key returns the original reference) · portal access rules for internal routes ·
mobile lead completion at 320–430 px.

## Not yet automated

- Playwright end-to-end browser suite (planned; the API-level flow is covered by the
  smoke script in KLAR_DEPLOYMENT.md).
- Database-backed integration tests (require a disposable PostgreSQL; the lead API's
  ordering — durable save before CRM — is enforced in code and covered by unit tests
  of the provider contract).
