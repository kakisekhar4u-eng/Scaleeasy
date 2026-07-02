// apps/api/src/modules/boutique/publicRoutes.js
// Standalone / embeddable try-on — the second public (no-login) surface
// in the app, alongside Module 4's public catalog. A store can link
// customers straight to /public/tryon/:productId, or embed it as an
// <iframe> on their own external website (outside Scaleeasy entirely).
// No catalog_links token needed here — a product's try-on is meant to be
// freely shareable, unlike a customer-specific catalog link.
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { createRateLimiter } = require('../../shared/utils/rateLimit');
const { getConnector, ConnectorNotAvailableError } = require('../../core/connectorLayer');

router.use(createRateLimiter({ windowMs: 60000, maxRequests: 30 })); // stricter — this triggers paid AI generation

// GET /public/tryon/:productId — product + garment image, for the widget to render
router.get('/tryon/:productId', async (req, res) => {
  const product = await db('products')
    .where({ id: req.params.productId, status: 'active' })
    .select('id', 'name', 'primary_image_url', 'store_id')
    .first();
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /public/tryon/:productId/generate — visitor's photo + this garment
// v2.2/this-turn note: personImageUrl assumes the frontend already
// uploaded the visitor's photo somewhere (e.g. Supabase Storage) and is
// passing a URL — this route doesn't handle raw file upload itself.
router.post('/tryon/:productId/generate', async (req, res) => {
  const { personImageUrl } = req.body;
  if (!personImageUrl) return res.status(400).json({ error: 'personImageUrl is required' });

  const product = await db('products').where({ id: req.params.productId }).first();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  let tryon2buy;
  try {
    tryon2buy = await getConnector(product.store_id, 'tryon2buy');
  } catch (err) {
    if (err instanceof ConnectorNotAvailableError) {
      return res.status(503).json({ error: 'Try-on isn\'t available for this store right now.' });
    }
    throw err;
  }

  const { jobId } = await tryon2buy.generateTryOn({
    personImageUrl,
    garmentImageUrl: product.primary_image_url
  });

  // Anonymous — no customer_id, no Scaleeasy login involved at all.
  const [look] = await db('saved_looks').insert({
    product_id: product.id,
    store_id: product.store_id,
    status: 'processing',
    provider_job_id: jobId
  }).returning('*');

  res.status(201).json({ lookId: look.id });
});

// GET /public/tryon/status/:lookId — poll for the rendered result
router.get('/tryon/status/:lookId', async (req, res) => {
  const look = await db('saved_looks').where({ id: req.params.lookId }).first();
  if (!look) return res.status(404).json({ error: 'Not found' });
  res.json({ status: look.status, imageUrl: look.result_image_url });
});

module.exports = router;
