// apps/api/src/modules/logistics/webhookRoutes.js
// Ch.7A "Inbound Webhook Security" — carriers aren't logged-in users, so
// this can't sit behind requireAuth. Security here comes from verifying
// the carrier's signature on every request, not a login session.
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { providers } = require('../../core/connectorLayer');
const { createRateLimiter } = require('../../shared/utils/rateLimit');

router.use(createRateLimiter({ windowMs: 60000, maxRequests: 120 })); // carriers can send bursts of updates

router.post('/carrier/:provider', async (req, res) => {
  const { provider } = req.params;
  const providerClient = providers[provider];
  if (!providerClient?.verifyWebhookSignature?.(req.rawBody, req.headers['x-signature'])) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const { trackingId, status, proofUrl } = req.body;
  const shipment = await db('shipments').where({ tracking_id: trackingId }).first();
  if (!shipment) return res.status(404).json({ error: 'Tracking ID not found' });

  // Idempotency guard — a webhook redelivering the same status (carriers
  // routinely retry) is a no-op, not a duplicate DeliveryCompleted.
  if (shipment.status === status) {
    return res.json({ ok: true, duplicate: true });
  }

  await db('shipments').where({ id: shipment.id }).update({
    status,
    delivery_proof_url: proofUrl || shipment.delivery_proof_url,
    delivered_at: status === 'delivered' ? new Date() : shipment.delivered_at,
    updated_at: new Date()
  });

  if (status === 'delivered') {
    // Doesn't touch order_cards directly — that table belongs to Module
    // 7, which already listens for this exact event (built last turn).
    await emit('DeliveryCompleted', { orderId: shipment.order_id }, 'logistics');
  }

  res.json({ ok: true });
});

module.exports = router;
