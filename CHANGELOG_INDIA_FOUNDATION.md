# India Commerce Foundation — Changelog (RC1)

## Migration
- `013_india_commerce_foundation.sql` — all new tables, RLS policies, GST slab seeds, common HSN codes for retail/boutique, invoice table extensions, store/user localization columns.

## 1. Payments Foundation
- **New module**: `modules/payments/` (service, routes, events, webhookRoutes)
- Provider-based payment layer supporting Cash, Card, UPI, Bank Transfer, Store Credit.
- Razorpay provider (`core/providers/razorpayProvider.js`) — order creation, capture, refund, webhook verification (HMAC-SHA256 with timing-safe comparison).
- Stripe India provider (`core/providers/stripeIndiaProvider.js`) — PaymentIntent flow, refund, webhook verification (Stripe v1 signature scheme).
- Split payments (multiple methods per sale), partial payments, advance payments.
- Refund processing with optional credit-to-wallet flow.
- Payment status tracking: pending → authorized → captured → refunded/partially_refunded.
- Reconciliation: mark payments reconciled, reconciliation report by method/provider.
- Webhook endpoints: `/webhooks/payments/razorpay`, `/webhooks/payments/stripe` — signature-verified, persisted to `payment_webhooks` table before processing.
- Full audit log (`payment_audit_log`) for every payment action.
- All tables store-scoped with RLS policies.

## 2. WhatsApp Business Integration
- **New module**: `modules/whatsapp/` (service, routes, events, webhookRoutes)
- Connector-based: Meta Cloud API, MSG91, Exotel — all registered as connector providers.
- Three WhatsApp provider adapters (`core/providers/whatsapp{Meta,Msg91,Exotel}Provider.js`) with unified interface: `sendTemplate`, `sendText`, `sendDocument`, `sendImage`.
- Template management: CRUD for templates by key (`order_confirmation`, `invoice`, `payment_receipt`, `advance_receipt`, `delivery_ready`, `delivery_reminder`, `order_update`, `shipment_tracking`, `promotion`, `customer_support`).
- Convenience methods: `sendOrderConfirmation(orderId)`, `sendInvoice(saleId)`, `sendPaymentReceipt(paymentId)` — auto-resolve customer, build template params, attach PDF if available.
- PDF invoice sharing via document message type.
- Retry handling: failed messages re-queued up to `max_retries` (default 3).
- Delivery status tracking via Meta webhook (`/webhooks/whatsapp/meta`), with verification token validation.
- Opt-in/opt-out compliance: `whatsapp_opt_status` table, checked before every outbound message.
- Event listeners: auto-send on `OrderCreated`, `PaymentCaptured` (graceful skip if not configured).
- Audit log for every send attempt, success, and failure.
- Integrated with CRM (customer lookup), Orders (order confirmation), Checkout/Invoices (invoice sharing), Payments (receipt).

## 3. GST & HSN Foundation
- **New module**: `modules/gst/` (service, routes, events)
- HSN master table seeded with 26 common retail/boutique codes (apparel chapters 61-62, jewellery, footwear, bags, tailoring services).
- GST slabs table: 0%, 0.25%, 3%, 5%, 12%, 18%, 28%.
- Per-product GST mapping (store-scoped): HSN code, GST rate, cess rate, tax-inclusive flag.
- Store GST configuration: GSTIN (validated), legal name, trade name, state code, address, default tax behavior.
- Tax calculation engine: CGST/SGST (intra-state) vs IGST (inter-state), cess, tax-inclusive and tax-exclusive pricing.
- Reverse tax calculation from total.
- Line-item GST calculation for multi-product sales.
- HSN search API.
- GSTIN validation (format, state code, checksum structure).
- Reusable by checkout, boutique billing, invoice generation, and future retail engine.

## 4. India Localization
- **Backend**: `shared/utils/indiaValidation.js` — GSTIN, PAN, Indian phone, PIN code validation; INR formatting; Indian number formatting.
- **Backend**: `shared/constants/indianStates.js` — all 38 Indian state/UT codes with names.
- **Frontend**: `shared/utils/indiaFormat.js` — INR formatting, Indian number format, DD/MM/YYYY dates, IST timezone, phone formatting, GSTIN/pincode/phone validation, state master.
- Store-level localization columns: country, currency, timezone, date_format, language, state_code, pincode.
- User-level language preference column.
- No hardcoded formatting — all formatting through utility functions.

## 5. i18n System
- **New**: `shared/i18n/I18nProvider.jsx` — React context provider with lazy-loaded language packs.
- Languages: English (en), Hindi (hi), Telugu (te), Tamil (ta), Kannada (kn), Malayalam (ml).
- Dynamic language switching via `useI18n()` hook.
- Lazy-loaded language packs (Vite code-split — only English bundled, others loaded on demand).
- English fallback for missing translations.
- User preference persisted to localStorage.
- Adding new languages: create `{code}.js` file, add loader to `langLoaders` map — no other code changes.
- Full English translation dictionary covering all new features (payments, WhatsApp, GST, store credit, invoices, customers, orders, inventory).

## 6. Indian Retail Readiness
- **New module**: `modules/invoices/` (service, routes, events)
- GST-aware invoice generation with CGST/SGST/IGST breakdown.
- Invoice types: tax_invoice, bill_of_supply, receipt, advance_receipt.
- Format support: A4, thermal receipt (format field — rendering is frontend/adapter responsibility).
- QR payment data generation (UPI deep link format: `upi://pay?pa=...`).
- WhatsApp invoice sharing (PDF attachment when available).
- Invoice sharing tracking (via, timestamp).
- Invoice table extended with GST fields, QR data, sharing metadata.

## 7. Store Credit / Loyalty Foundation
- **New module**: `modules/storeCredit/` (service, routes, events)
- Per-customer wallet (store-scoped): balance, lifetime_earned, lifetime_spent.
- Credit types: refund_credit, manual_credit, gift_card (future), payment_debit, expiry, adjustment.
- Credit from refund: automatic when refund has `creditToWallet: true` (via RefundProcessed event).
- Debit for payment: atomic balance check + deduction (row-level lock prevents race conditions).
- Transaction history with balance-after snapshots.
- Expiry-ready (expires_at column on transactions).
- Full audit log.
- Usable as payment method (payment_method: 'store_credit').

## Integration Points
- **Connector Layer**: 5 new providers registered (razorpay, stripe, whatsapp_meta, whatsapp_msg91, whatsapp_exotel) — all use existing encrypted credential storage.
- **Event Bus**: New events — `PaymentCaptured`, `RefundProcessed`, `StoreCreditAdded`, `StoreCreditDebited`, `WhatsAppSent`. Listeners on `OrderCreated`, `PaymentCaptured`.
- **Auth/RBAC**: All new routes use existing `requireAuth`, `requireStoreAccess`, `requireRole` middleware. Minimum roles: associate for sending/paying, manager for refunds/GST config, owner for reconciliation/store GST setup.
- **index.js**: All new routes mounted. Payment and WhatsApp webhooks mounted under `/webhooks/` (before auth middleware).

## Frontend API Services
- `modules/payments/services/paymentApi.js`
- `modules/whatsapp/services/whatsappApi.js`
- `modules/gst/services/gstApi.js`
- `modules/storeCredit/services/storeCreditApi.js`
- `modules/invoices/services/invoiceApi.js`

## Files Added (31 files)
### Backend (24 files)
- 1 migration
- 5 provider adapters
- 2 shared utility files
- 5 services, 5 route files, 3 webhook route files, 3 event files

### Frontend (9 files)
- 6 language packs
- 1 i18n provider
- 1 India formatting utility
- 5 API service files (inside module folders)

### Config (2 files updated)
- `.env.example` — new webhook secret vars
- `apps/api/src/core/connectorLayer.js` — 5 new providers registered
- `apps/api/src/index.js` — all new routes mounted
- `apps/web/src/main.jsx` — I18nProvider wrapped
