# Klar Concierge — Database

PostgreSQL via Prisma. Schema: `prisma/schema.prisma`; initial migration:
`prisma/migrations/0001_init/migration.sql`; seed: `prisma/seed.ts`.

## Models

| Model | Purpose |
| --- | --- |
| `User` | Internal team members; roles: admin, knowledge_editor, consultant, operations, viewer |
| `Session` | Server-side sessions (SHA-256 token hash, expiry) |
| `Destination` | KTIE record: profile JSON + review status/versioning |
| `DestinationMonth` | 12 rows per destination: season score/label, rainfall, humidity, crowds, highlights, warnings |
| `DestinationSource` | Provenance for knowledge content |
| `ConversationSession` / `ConversationMessage` | Optional server-side transcript storage |
| `Lead` | The durable lead: customer, consent + timestamp, brief JSON, transcript, selection, itinerary, score, CRM state, owner, follow-up |
| `LeadRecommendation` | The three directions shown, with score breakdown, reasons, trade-off |
| `LeadItineraryDay` | Normalised itinerary days (also stored as JSON on Lead for export) |
| `LeadNote` / `LeadAssignment` | Consultant notes and assignment history |
| `CRMDeliveryAttempt` | Every CRM attempt with status and error codes |
| `AnalyticsEvent` | Allow-listed anonymous funnel events |
| `AuditRecord` | Internal action log (PII masked before storage) |

## Integrity

- Unique: `Lead.reference`, `Lead.idempotencyKey`, `User.email`, `Session.tokenHash`,
  `Destination.slug`, `(destinationId, month)`, `(leadId, day)`.
- Indexed: lead stage/CRM status/creation/owner, analytics name+date, audit action+date.
- Foreign keys cascade from leads to child rows.
- Timestamps (`createdAt`/`updatedAt`) on every operational model. Leads are never
  hard-deleted by the application (retention handled operationally).

## Commands

```bash
npm run db:generate         # prisma generate (client output: src/generated/prisma)
npx prisma migrate deploy   # apply migrations
npm run db:seed             # 20 KTIE destinations + admin (SEED_ADMIN_EMAIL/PASSWORD)
```
