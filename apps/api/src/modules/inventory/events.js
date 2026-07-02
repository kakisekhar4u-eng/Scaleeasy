// apps/api/src/modules/inventory/events.js
// Module 2 — Smart Inventory
//
// NOTE on stock decrements: the actual quantity decrement on a sale
// happens synchronously inside Checkout's own transaction (Module 5),
// not here (v2.2, documented exception — see handbook Appendix F #5).
// Money changing hands requires an atomic check-and-decrement to prevent
// overselling; an async listener firing after the sale is committed is
// too late to stop it. This module still owns everything else about
// stock: Product DNA, the Journey log, and Health Score.
const db = require('../../db/client');
const { on } = require('../../core/eventBus');
const { recalculateProductHealthScore } = require('./service');

on('ProductSold', async (payload) => {
  const variant = await db('product_variants').where({ id: payload.variantId }).first();
  if (!variant) return;

  await db('product_journey').insert({
    product_id: variant.product_id,
    event_type: 'sold',
    payload
  });
  await recalculateProductHealthScore(variant.product_id);
});

on('ProductViewed', async (payload) => {
  // Feeds Trending (Phase 2, reserved) — logged now so the data exists later.
  await db('product_journey').insert({
    product_id: payload.productId,
    event_type: 'viewed',
    payload
  });
});
