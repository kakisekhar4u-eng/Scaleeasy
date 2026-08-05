# KTIE — Klar Travel Intelligence Engine

KTIE is Klar's proprietary destination knowledge layer. **Every recommendation is
grounded in KTIE** — the AI extracts customer intent but never chooses destinations
outside this dataset and never invents facts, visa rules, prices or availability.

## Dataset

20 seeded destinations (Singapore, Dubai, Bali, Thailand, Vietnam, Malaysia, Japan,
South Korea, Sri Lanka, Maldives, Mauritius, Seychelles, Turkey, Georgia, Azerbaijan,
Switzerland, France, Italy, Greece, Australia), each with:

- profile: summary, positioning line, min/ideal/max nights, suitable paces
- interests map (beach, food, culture, … → 0–100)
- suitability (family, toddlers, 5–10, teens, seniors, honeymoon, solo, first trip)
- food (vegetarian, Indian food availability, halal, cuisine/street/fine dining)
- practicality (flight hours from India, walking intensity, transport, accessibility,
  medical access, visa complexity — `verify` where rules change often)
- 12 months of intelligence (season score/label, rainfall, humidity, crowds,
  highlights, warnings)
- signature experiences, hidden gems, honest trade-offs, who-should-avoid
- versioning (reviewer, reviewed/next-review dates) and sources

Source of truth in code: `src/services/ktie/data.ts` (compact month builder in
`builders.ts`). Seeded into PostgreSQL by `prisma/seed.ts` for admin review workflows.

## Review lifecycle

```
draft → reviewed (all seed data ships here) → verified (Klar sign-off)
```

Unstable operational facts (visas, alerts) are marked **"Consultant verification
required"** and surface as consultant notes on recommendations. Phase 1 launch
requires **≥10 verified** destinations (`/admin/readiness` tracks this).

## Verification (admin)

`/admin/knowledge/destinations/:slug` shows the full record with a checklist:
confirm seasonal guidance, suitability scores, bookable experiences and honest
trade-offs, record the reviewer, then **Mark verified** (next review auto-set +90 days).
Edits and verifications are audit-logged. No automatic external crawling exists.

## Scoring (deterministic)

Weighted blend: season 20%, traveller fit 16%, taste 16%, children 10%, duration 8%,
budget 8%, seniors 6%, pace 6%, flight fatigue 5%, accessibility 5% — plus a data
confidence signal. Full breakdown is stored with every recommendation for
explainability. Directions: **Best Match** (top overall), **Best for Your Taste**
(top taste alignment), **Something Special** (strong but less obvious), never the
same destination twice.
