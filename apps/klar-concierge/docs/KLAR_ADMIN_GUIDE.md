# Klar Concierge — Admin Guide

No app-level sign-in: access to this area is controlled by the klartravels portal.

## Overview (`/admin`)
Live counts: leads, verified/reviewed destinations, CRM failures, analytics volume.

## Knowledge (`/admin/knowledge/destinations`)
- List all KTIE destinations with status, reviewer and next-review date.
- Open a destination to inspect its full profile, monthly intelligence and sources.
- Use the verification checklist, record the reviewer, then mark **verified** /
  **reviewed** / **draft**. Launch needs ≥10 verified.

## Analytics (`/admin/analytics`)
Anonymous funnel: planner starts → briefs → recommendation views/selections →
itinerary views → lead submissions (+ failures), lead outcomes, CRM state counts,
conversion rate and top requested destinations. No personal data is ever collected.

## CRM (`/admin/integrations/crm`)
Current provider and state (Phase 1: placeholder/disabled), health detail, lead counts
by CRM status, and step-by-step instructions for connecting a real CRM later. Secrets
are never entered or shown in the browser. "Test connection" stays unavailable while
the placeholder provider is active.

## Readiness (`/admin/readiness`)
Live Phase 1 checklist: portal protection reminder, database reachable and
migrated, 20 destinations seeded, ≥10 verified, CRM mode valid, AI/fallback, analytics.
The product is launch-ready only when every required check passes. It never fails
because booking/payments are absent — those are out of scope by design.

## Audit (`/admin/audit`)
Recent internal actions (logins, lead assignment, stage changes, notes, CRM attempts,
knowledge edits/verifications, readiness checks). Emails/phones are masked at write time.

## Access
Klar Concierge ships without its own login — the klartravels portal must restrict
`/admin` and its APIs to Klar staff (reverse proxy, portal session or hosting rule).
