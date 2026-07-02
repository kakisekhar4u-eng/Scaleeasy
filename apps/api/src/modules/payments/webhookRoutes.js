// apps/api/src/modules/payments/webhookRoutes.js
// Public webhook endpoints for payment providers — no auth, signature-verified.
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const logger = require('../../shared/utils/logger');
const razorpayProvider = require('../../core/providers/razorpayProvider');
const stripeProvider = require('../../core/providers/stripeIndiaProvider');

router.post('/payments/razorpay', async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!razorpayProvider.verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const [webhook] = await db('payment_webhooks').insert({
    provider: 'razorpay',
    event_type: req.body.event,
    payload: req.body,
    signature,
    verified: true,
  }).returning('*');

  try {
    const event = req.body.event;
    const entity = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && entity) {
      const txn = await db('payment_transactions')
        .where({ provider_order_id: entity.order_id, provider: 'razorpay' })
        .first();
      if (txn) {
        await db('payment_transactions').where({ id: txn.id }).update({
          provider_transaction_id: entity.id,
          status: 'captured',
          updated_at: new Date(),
        });
        await db('payment_webhooks').where({ id: webhook.id }).update({ processed: true, store_id: txn.store_id });
        await emit('PaymentCaptured', { paymentId: txn.id, saleId: txn.sale_id, orderId: txn.order_id, amount: txn.amount }, 'payments-webhook');
      }
    } else if (event === 'payment.failed' && entity) {
      const txn = await db('payment_transactions')
        .where({ provider_order_id: entity.order_id, provider: 'razorpay' })
        .first();
      if (txn) {
        await db('payment_transactions').where({ id: txn.id }).update({
          status: 'failed',
          failure_reason: entity.error_description || 'Payment failed',
          updated_at: new Date(),
        });
        await db('payment_webhooks').where({ id: webhook.id }).update({ processed: true, store_id: txn.store_id });
      }
    } else if (event === 'refund.processed' && req.body.payload?.refund?.entity) {
      const refundEntity = req.body.payload.refund.entity;
      const refund = await db('payment_refunds')
        .where({ provider_refund_id: refundEntity.id })
        .first();
      if (refund) {
        await db('payment_refunds').where({ id: refund.id }).update({ status: 'processed' });
        await db('payment_webhooks').where({ id: webhook.id }).update({ processed: true, store_id: refund.store_id });
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    logger.error('Razorpay webhook processing error', err);
    await db('payment_webhooks').where({ id: webhook.id }).update({ error_message: err.message });
    res.json({ status: 'ok' });
  }
});

router.post('/payments/stripe', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!stripeProvider.verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  const [webhook] = await db('payment_webhooks').insert({
    provider: 'stripe',
    event_type: req.body.type,
    payload: req.body,
    signature,
    verified: true,
  }).returning('*');

  try {
    const event = req.body.type;
    const obj = req.body.data?.object;

    if (event === 'payment_intent.succeeded' && obj) {
      const txn = await db('payment_transactions')
        .where({ provider_order_id: obj.id, provider: 'stripe' })
        .first();
      if (txn) {
        await db('payment_transactions').where({ id: txn.id }).update({
          provider_transaction_id: obj.latest_charge,
          status: 'captured',
          updated_at: new Date(),
        });
        await db('payment_webhooks').where({ id: webhook.id }).update({ processed: true, store_id: txn.store_id });
        await emit('PaymentCaptured', { paymentId: txn.id, saleId: txn.sale_id, orderId: txn.order_id, amount: txn.amount }, 'payments-webhook');
      }
    } else if (event === 'payment_intent.payment_failed' && obj) {
      const txn = await db('payment_transactions')
        .where({ provider_order_id: obj.id, provider: 'stripe' })
        .first();
      if (txn) {
        await db('payment_transactions').where({ id: txn.id }).update({
          status: 'failed',
          failure_reason: obj.last_payment_error?.message || 'Payment failed',
          updated_at: new Date(),
        });
        await db('payment_webhooks').where({ id: webhook.id }).update({ processed: true, store_id: txn.store_id });
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook processing error', err);
    await db('payment_webhooks').where({ id: webhook.id }).update({ error_message: err.message });
    res.json({ received: true });
  }
});

module.exports = router;
