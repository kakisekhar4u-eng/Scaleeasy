# Klar Concierge — Consultant Guide

No app-level sign-in: access to this area is controlled by the klartravels portal.

## Dashboard (`/consultant`)
Counters (new, high priority, CRM failures, follow-ups due, converted, lost) and the
lead queue with reference, customer, destination, stage, priority, score, CRM state
and last update. Click a reference to open the lead.

## Lead detail (`/consultant/leads/:id`)
Everything the customer built, in one place:

- Contact details, preferred channel and time, consent timestamp, customer notes
- Full travel brief + the customer's original prompt
- The three recommendations shown (reasons, trade-offs, which one they selected)
- The draft itinerary day by day
- The complete conversation transcript
- CRM state and attempt history

## Actions
- **Update stage** — new-enquiry → consultant-assigned → contact-attempted →
  requirement-confirmed → quote-in-preparation → quote-sent → follow-up →
  converted / lost
- **Assign** a consultant by name, **set follow-up date**, **add notes**
- **Mark converted / lost**
- **Retry CRM delivery** (only shown for failed deliveries; hidden in Phase 1
  disabled mode)
- **Copy lead summary** — one click for pasting into email/WhatsApp

## CRM disabled note
While CRM is disabled you'll see: *"CRM/RMS integration is not configured. This lead
is stored safely in Klar's database and can be handled by the team."* Nothing is lost
and nothing needs fixing — manage the lead here as normal.

## Expectations
Recommendations include consultant notes such as **"Visa requirements: consultant
verification required."** Always verify visas, seasonal alerts and operational details
before quoting — the itinerary is explicitly a starting plan for you to refine.
