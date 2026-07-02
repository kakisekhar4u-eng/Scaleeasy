// apps/api/src/modules/orders/events.js
// Module 7 — Orders
// This is where CustomerEnquired, BlueprintFinalized, BlueprintDelivered,
// and SalesOpportunityClosed — all correctly emitted since Modules 4, 5,
// and 6 were built — finally have somewhere to land. DeliveryCompleted
// is included too, but stays dormant until Module 8 (Logistics) actually
// emits it — that's expected, not a bug (same pattern as Modules 1–6
// waiting on this module).
const db = require('../../db/client');
const { on } = require('../../core/eventBus');
const { autoCreateOrderFromEnquiry, updateOrderStatus } = require('./service');

on('CustomerEnquired', async (payload) => {
  await autoCreateOrderFromEnquiry(payload);
});

on('BlueprintFinalized', async (payload) => {
  const order = await db('order_cards').where({ blueprint_id: payload.blueprintId }).first();
  if (order) await updateOrderStatus(order.id, 'confirmed');
});

on('BlueprintDelivered', async (payload) => {
  const order = await db('order_cards').where({ blueprint_id: payload.blueprintId }).first();
  if (order) await updateOrderStatus(order.id, 'completed');
});

on('DeliveryCompleted', async (payload) => {
  await updateOrderStatus(payload.orderId, 'delivered');
});

on('SalesOpportunityClosed', async (payload) => {
  if (payload.orderCardId) await updateOrderStatus(payload.orderCardId, 'completed');
});
