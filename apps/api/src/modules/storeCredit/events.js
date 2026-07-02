// apps/api/src/modules/storeCredit/events.js
// Store credit listens for refund events that should credit the wallet.
// The RefundProcessed → creditFromRefund flow is handled in payments/events.js
// to avoid circular dependency.
