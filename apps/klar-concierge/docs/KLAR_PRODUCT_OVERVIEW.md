# Klar Concierge — Product Overview (Phase 1)

## What it is

A premium AI holiday planner backed by real Klar travel experts. It converts an open
conversation into a structured trip brief, recommends three differentiated destination
directions from Klar's own knowledge base, drafts a practical itinerary and captures a
qualified lead for the Klar team.

## What Phase 1 is not

No live availability, supplier inventory, live pricing, instant quotation, booking,
payments, reservations, ticketing or refunds. The product ends with:

```
AI planning → Qualified lead → Durable PostgreSQL storage → Consultant handover
```

## Customer journey

1. **Conversation** — one useful follow-up question at a time; chips guide input.
2. **Trip brief** — clean, editable summary (never raw JSON).
3. **Three directions** — Best Match, Best for Your Taste, Something Special; each with
   reasons, seasonal fit, suitability, ideal duration and one honest trade-off.
4. **Itinerary** — day-by-day draft labelled "A starting plan for your Klar expert to refine."
5. **Lead capture** — name, mobile, email, contact channel/time, notes, mandatory consent.
6. **Success** — Klar lead reference (KLAR-YYYY-XXXXXX) and clear next steps.

## Internal operations

- **Consultant workspace** (`/consultant`) — dashboard, full lead detail (brief,
  recommendations, itinerary, transcript, CRM state), stage management, assignment,
  notes, follow-ups, converted/lost outcomes.
- **Admin** (`/admin`) — KTIE knowledge review & verification, anonymous funnel
  analytics, CRM integration status, Phase 1 readiness checks, audit log.

## Lead scoring

Deterministic 0–100 score (timing, duration, party, destination selected, itinerary
viewed, budget known, contact channel, engagement) drives priority
(low / medium / high / urgent) for the consultant queue.

## Launch threshold

At least 10 KTIE destinations **verified** by Klar (seed data ships as *reviewed*),
durable lead storage proven, internal routes protected, consent recorded, mobile flow
clean — tracked live at `/admin/readiness`.
