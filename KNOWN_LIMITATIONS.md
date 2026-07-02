# Known Limitations — India Commerce Foundation RC1

## External Setup Required

### Payment Providers
- **Razorpay**: Requires Razorpay account, API key/secret configured via Connected Apps UI, and `RAZORPAY_WEBHOOK_SECRET` env var for webhook verification. Test mode keys work for development.
- **Stripe India**: Requires Stripe India account (INR settlement), secret key configured via Connected Apps UI, and `STRIPE_WEBHOOK_SECRET` env var. Stripe India has specific compliance requirements for Indian merchants.

### WhatsApp Business
- **Meta Cloud API**: Requires Meta Business account, WhatsApp Business API access, phone number registration, and template approval from Meta. Set `WHATSAPP_META_APP_SECRET` and `WHATSAPP_VERIFY_TOKEN` env vars. Templates must be approved by Meta before use.
- **MSG91**: Requires MSG91 account with WhatsApp addon. Configure auth key via Connected Apps UI.
- **Exotel**: Requires Exotel account with WhatsApp channel. Configure API credentials via Connected Apps UI.
- **Template Approval**: All WhatsApp templates must be submitted to and approved by the respective provider before they can be sent. The `status` field tracks this (`draft` → `pending_approval` → `approved`).

### GST
- **HSN Master**: Seeded with 26 common retail/boutique codes. Additional HSN codes should be added to the `hsn_master` table as needed for the store's product categories.
- **GSTIN Validation**: Format and state-code validation only. Does not verify against GSTN portal (would require GSTN API integration).

### Invoice / PDF
- **PDF Generation**: Invoice data is fully structured with GST breakdown, but actual PDF rendering is not included. Integrate a PDF library (e.g., PDFKit, Puppeteer) or external service to generate PDFs from the invoice data endpoint.
- **Thermal Receipt Rendering**: The `format: 'thermal'` flag is stored but actual ESC/POS or thermal printer formatting is not built — this is adapter-ready for when printer hardware integration is needed.

### Encryption
- **CONNECTOR_ENCRYPTION_KEY**: Must be set in environment. All payment and WhatsApp provider credentials are encrypted at rest using AES-256-GCM via the existing Connector Layer.

## Architectural Notes
- **Event Bus**: Remains in-process (same limitation as base platform). Payment and WhatsApp events use the same `eventBus.on/emit` pattern — needs BullMQ + Redis for multi-instance deployments.
- **Store Credit Expiry**: The `expires_at` column exists on transactions but no background job purges expired credits yet. Can be added as a scheduled task.
- **WhatsApp Retry**: Failed messages are re-queued (up to 3 retries) but retries are attempted on the next explicit send, not via background polling.
- **Reconciliation**: Manual marking flow. Automated bank statement matching would require bank-specific integrations.
