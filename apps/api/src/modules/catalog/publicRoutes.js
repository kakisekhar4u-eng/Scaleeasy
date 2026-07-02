// apps/api/src/modules/catalog/publicRoutes.js
// Module 4 — the ONLY routes in the whole app that skip requireAuth /
// requireStoreAccess (Ch.7A "Public Catalog Protection" — the one
// documented exception). Instead of a login session, every request here
// proves it's allowed via the catalog_links token.
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { validateToken, browseCatalog, recordView, addToWishlist, submitEnquiry } = require('./service');
const { createRateLimiter } = require('../../shared/utils/rateLimit');

router.use(createRateLimiter({ windowMs: 60000, maxRequests: 60 }));

// Every route below re-validates the token — never trust a token that
// passed once earlier in the session (Ch.7A: not revoked, not expired).
async function requireValidLink(req, res, next) {
  const link = await validateToken(req.params.token);
  if (!link) return res.status(403).json({ error: 'This link is invalid or has expired.' });
  req.catalogLink = link;
  next();
}

// GET /public/catalog/:token — browse products (no sensitive customer data returned)
router.get('/catalog/:token', requireValidLink, async (req, res) => {
  const products = await browseCatalog(req.catalogLink.store_id);
  res.json({ products });
});

// GET /public/catalog/:token/products/:productId — view one product, logs the view
router.get('/catalog/:token/products/:productId', requireValidLink, async (req, res) => {
  const product = await db('products')
    .where({ id: req.params.productId, store_id: req.catalogLink.store_id, status: 'active' })
    .first();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  product.variants = await db('product_variants').where({ product_id: product.id })
    .select('id', 'size', 'color', 'selling_price', 'mrp'); // no cost/margin fields exposed publicly

  await recordView(req.catalogLink.id, product.id);
  res.json(product);
});

// POST /public/catalog/:token/wishlist — requires the link to be customer-specific
router.post('/catalog/:token/wishlist', requireValidLink, async (req, res) => {
  if (!req.catalogLink.customer_id) {
    return res.status(400).json({ error: 'This link isn\'t tied to a specific customer.' });
  }
  const item = await addToWishlist(req.catalogLink.customer_id, req.body.productId);
  res.status(201).json(item);
});

// POST /public/catalog/:token/enquire — triggers Module 7's auto-create order
router.post('/catalog/:token/enquire', requireValidLink, async (req, res) => {
  if (!req.catalogLink.customer_id) {
    return res.status(400).json({ error: 'This link isn\'t tied to a specific customer.' });
  }
  const result = await submitEnquiry(req.catalogLink.customer_id, req.body.productId, req.catalogLink.store_id);
  res.json(result);
});

module.exports = router;
