// apps/api/src/modules/customers/events.js
const { on } = require('../../core/eventBus');
const {
  updateTimeline, recalculateHealthScore, promoteFashionDna, enrichFashionDna
} = require('./service');

on('CustomerPurchased', async (payload) => {
  await updateTimeline(payload.customerId, 'purchase', payload);
  await recalculateHealthScore(payload.customerId);
});

on('CustomerRevisited', async (payload) => {
  await updateTimeline(payload.customerId, 'revisit', payload);
});

on('CustomerMemoryAdded', async (payload) => {
  await promoteFashionDna(payload.customerId, payload.noteText);
});

on('CampaignSent', async (payload) => {
  // Fixed: CampaignSent only carries {campaignId, destinations}, not a
  // single customerId — this bug only became visible once Module 3
  // was built and campaign_recipients actually existed to check against.
  const db = require('../../db/client');
  const recipients = await db('campaign_recipients').where({ campaign_id: payload.campaignId });
  for (const recipient of recipients) {
    await updateTimeline(recipient.customer_id, 'campaign_sent', { campaignId: payload.campaignId });
  }
});

on('DeliveryCompleted', async (payload) => {
  await updateTimeline(payload.orderId, 'delivery_completed', payload);
});

on('OrderStatusChanged', async (payload) => {
  await updateTimeline(payload.orderId, 'order_status_changed', payload);
});

on('LookTried', async (payload) => {
  // FIXED (this pass): previously referenced payload.blouseDesign and
  // payload.backgroundId, fields that don't exist in this schema's
  // saved_looks/products tables — a mismatch that was invisible until
  // Module 6 actually emitted the event and this listener ran for real.
  const db = require('../../db/client');
  const product = payload.productId ? await db('products').where({ id: payload.productId }).first() : null;
  await enrichFashionDna(payload.customerId, { favoriteCategory: product?.category });
  await updateTimeline(payload.customerId, 'look_tried', { productId: payload.productId });
});

on('LookSaved', async (payload) => {
  await updateTimeline(payload.customerId, 'look_saved', { lookId: payload.lookId, productId: payload.productId });
});
