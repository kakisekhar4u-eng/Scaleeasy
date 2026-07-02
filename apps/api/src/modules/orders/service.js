// apps/api/src/modules/orders/service.js
// Module 7 — Orders
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');

async function createOrder({ customerId, productId, blueprintId, advanceAmount, totalAmount, source }, storeId) {
  // Validates advance <= total — a gap the earlier audit caught (v2.2).
  const total = Math.max(0, Number(totalAmount || 0));
  const advance = Math.max(0, Number(advanceAmount || 0));
  if (advance > total) throw new Error('Advance amount cannot exceed total amount');

  const [order] = await db('order_cards').insert({
    store_id: storeId, customer_id: customerId, product_id: productId, blueprint_id: blueprintId,
    advance_amount: advance, total_amount: total, balance_amount: total - advance,
    source, status: 'enquired'
  }).returning('*');

  await emit('OrderCreated', { orderId: order.id, customerId }, 'orders');
  return order;
}

// Auto-creation on CustomerEnquired — approved MVP exception (Appendix F
// #1, Tech Lead + Product Owner). Deterministic workflow automation, not
// AI auto-execution — no judgment call is being made, just a status
// change someone still has to act on.
async function autoCreateOrderFromEnquiry({ customerId, productId, storeId }) {
  const order = await createOrder({ customerId, productId, source: 'catalog' }, storeId);
  await notifyAssociate(order);
  return order;
}

async function notifyAssociate(order) {
  const customer = await db('customers').where({ id: order.customer_id }).first();
  const associateId = customer?.preferred_associate_id;
  if (!associateId) return; // no assigned associate yet — nothing to notify

  await db('notifications').insert({
    user_id: associateId,
    type: 'order_enquiry',
    reference_id: order.id,
    message: 'New enquiry — follow up needed',
    created_at: new Date()
  });
}

async function updateOrderStatus(orderId, status) {
  await db('order_cards').where({ id: orderId }).update({ status, updated_at: new Date() });
  await emit('OrderStatusChanged', { orderId, status }, 'orders');
}

module.exports = { createOrder, autoCreateOrderFromEnquiry, notifyAssociate, updateOrderStatus };
