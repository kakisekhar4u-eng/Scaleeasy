// apps/api/src/modules/payments/service.js
// Payments Foundation — provider-based payment processing
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { getConnector, ConnectorNotAvailableError } = require('../../core/connectorLayer');
const logger = require('../../shared/utils/logger');

async function createPayment({ saleId, orderId, customerId, amount, paymentMethod, provider, paymentType, splitGroupId, metadata }, storeId, actorId) {
  if (!amount || amount <= 0) throw new Error('Payment amount must be positive');
  if (!paymentMethod) throw new Error('Payment method is required');

  const [txn] = await db('payment_transactions').insert({
    store_id: storeId,
    sale_id: saleId || null,
    order_id: orderId || null,
    customer_id: customerId || null,
    amount,
    payment_method: paymentMethod,
    provider: provider || 'manual',
    payment_type: paymentType || 'full',
    split_group_id: splitGroupId || null,
    status: paymentMethod === 'cash' ? 'captured' : 'pending',
    metadata: metadata || {},
  }).returning('*');

  await auditLog(storeId, txn.id, 'payment_created', actorId, { amount, paymentMethod, provider });

  if (txn.status === 'captured') {
    await emit('PaymentCaptured', { paymentId: txn.id, saleId, orderId, amount, paymentMethod }, 'payments');
  }

  return txn;
}

async function initiateProviderPayment({ saleId, orderId, customerId, amount, paymentMethod, provider }, storeId, actorId) {
  const splitGroupId = null;
  const txn = await createPayment({
    saleId, orderId, customerId, amount, paymentMethod, provider, splitGroupId,
  }, storeId, actorId);

  if (provider === 'manual' || paymentMethod === 'cash') return txn;

  try {
    const client = await getConnector(storeId, provider);
    let providerResponse;

    if (provider === 'razorpay') {
      providerResponse = await client.createOrder({
        amount,
        receipt: `${saleId || orderId || txn.id}`,
        notes: { store_id: storeId, payment_id: txn.id },
      });
      await db('payment_transactions').where({ id: txn.id }).update({
        provider_order_id: providerResponse.id,
        updated_at: new Date(),
      });
      txn.provider_order_id = providerResponse.id;
      txn.providerData = providerResponse;
    } else if (provider === 'stripe') {
      providerResponse = await client.createPaymentIntent({
        amount,
        metadata: { store_id: storeId, payment_id: txn.id },
      });
      await db('payment_transactions').where({ id: txn.id }).update({
        provider_order_id: providerResponse.id,
        updated_at: new Date(),
      });
      txn.provider_order_id = providerResponse.id;
      txn.providerData = { clientSecret: providerResponse.client_secret };
    }

    return txn;
  } catch (err) {
    if (err instanceof ConnectorNotAvailableError) {
      await db('payment_transactions').where({ id: txn.id }).update({
        status: 'failed', failure_reason: err.message, updated_at: new Date(),
      });
      throw new Error(`Payment provider ${provider} is not connected. Configure it in Connected Apps.`);
    }
    throw err;
  }
}

async function confirmPayment(paymentId, { providerTransactionId, status }, storeId, actorId) {
  const txn = await db('payment_transactions')
    .where({ id: paymentId, store_id: storeId })
    .first();
  if (!txn) throw new Error('Payment not found');

  const newStatus = status === 'success' ? 'captured' : 'failed';
  await db('payment_transactions').where({ id: paymentId }).update({
    provider_transaction_id: providerTransactionId,
    status: newStatus,
    failure_reason: status === 'failed' ? 'Payment declined or failed' : null,
    updated_at: new Date(),
  });

  await auditLog(storeId, paymentId, `payment_${newStatus}`, actorId, { providerTransactionId });

  if (newStatus === 'captured') {
    await emit('PaymentCaptured', {
      paymentId, saleId: txn.sale_id, orderId: txn.order_id,
      amount: txn.amount, paymentMethod: txn.payment_method,
    }, 'payments');
  }

  return { ...txn, status: newStatus, provider_transaction_id: providerTransactionId };
}

async function createSplitPayment(parts, storeId, actorId) {
  if (!Array.isArray(parts) || parts.length < 2) throw new Error('Split payment requires at least 2 parts');
  const splitGroupId = require('crypto').randomUUID();
  const results = [];
  for (const part of parts) {
    const txn = await createPayment({ ...part, paymentType: 'split_part', splitGroupId }, storeId, actorId);
    results.push(txn);
  }
  return { splitGroupId, payments: results };
}

async function processRefund(paymentId, { amount, reason, creditToWallet }, storeId, actorId) {
  const txn = await db('payment_transactions')
    .where({ id: paymentId, store_id: storeId, status: 'captured' })
    .first();
  if (!txn) throw new Error('Captured payment not found');

  const refundAmount = amount || Number(txn.amount);
  const alreadyRefunded = Number(txn.refund_amount || 0);
  if (refundAmount + alreadyRefunded > Number(txn.amount)) {
    throw new Error('Refund amount exceeds payment amount');
  }

  const [refund] = await db('payment_refunds').insert({
    store_id: storeId,
    payment_id: paymentId,
    amount: refundAmount,
    reason,
    status: 'processed',
    credit_to_wallet: creditToWallet || false,
    created_by: actorId,
  }).returning('*');

  const newRefundTotal = alreadyRefunded + refundAmount;
  const newStatus = newRefundTotal >= Number(txn.amount) ? 'refunded' : 'partially_refunded';
  await db('payment_transactions').where({ id: paymentId }).update({
    refund_amount: newRefundTotal,
    status: newStatus,
    updated_at: new Date(),
  });

  await auditLog(storeId, paymentId, 'refund_processed', actorId, { refundId: refund.id, amount: refundAmount, reason, creditToWallet });
  await emit('RefundProcessed', { paymentId, refundId: refund.id, amount: refundAmount, customerId: txn.customer_id, creditToWallet }, 'payments');

  return refund;
}

async function getPaymentsByReference(storeId, { saleId, orderId }) {
  const query = db('payment_transactions').where({ store_id: storeId });
  if (saleId) query.where({ sale_id: saleId });
  if (orderId) query.where({ order_id: orderId });
  return query.orderBy('created_at', 'desc');
}

async function getPaymentStatus(paymentId, storeId) {
  return db('payment_transactions')
    .where({ id: paymentId, store_id: storeId })
    .first();
}

async function markReconciled(paymentIds, storeId, actorId) {
  const now = new Date();
  await db('payment_transactions')
    .where({ store_id: storeId })
    .whereIn('id', paymentIds)
    .where({ status: 'captured' })
    .update({ reconciled_at: now, updated_at: now });

  for (const id of paymentIds) {
    await auditLog(storeId, id, 'reconciled', actorId, {});
  }
  return { reconciledCount: paymentIds.length, reconciledAt: now };
}

async function getReconciliationReport(storeId, { from, to }) {
  const query = db('payment_transactions')
    .where({ store_id: storeId, status: 'captured' })
    .select(
      db.raw('payment_method'),
      db.raw('provider'),
      db.raw('count(*) as count'),
      db.raw('sum(amount) as total'),
      db.raw('count(case when reconciled_at is not null then 1 end) as reconciled_count'),
      db.raw('sum(case when reconciled_at is not null then amount else 0 end) as reconciled_total'),
    )
    .groupBy('payment_method', 'provider');

  if (from) query.where('created_at', '>=', from);
  if (to) query.where('created_at', '<=', to);

  return query;
}

async function auditLog(storeId, paymentId, action, actorId, details) {
  await db('payment_audit_log').insert({
    store_id: storeId,
    payment_id: paymentId,
    action,
    actor_id: actorId,
    details,
  });
}

module.exports = {
  createPayment,
  initiateProviderPayment,
  confirmPayment,
  createSplitPayment,
  processRefund,
  getPaymentsByReference,
  getPaymentStatus,
  markReconciled,
  getReconciliationReport,
};
