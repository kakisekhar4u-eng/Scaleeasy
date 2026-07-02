// apps/api/src/modules/inventory/routes.js
// Module 2 — Smart Inventory
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { getProductSnapshot, createProduct, addVariant, transferStock } = require('./service');

require('./events'); // side-effect: registers listeners (Ch.4)
const { requireRole } = require('../../core/permissions');

// GET /products?search=&lowStock=true
router.get('/products', async (req, res) => {
  const { search, lowStock } = req.query;
  let query = db('products').where({ store_id: req.user.storeId, status: 'active' });
  if (search) query = query.where('name', 'ilike', `%${search}%`);

  if (lowStock === 'true') {
    const lowStockIds = await db('products')
      .join('product_variants', 'product_variants.product_id', 'products.id')
      .join('inventory_stock', 'inventory_stock.variant_id', 'product_variants.id')
      .where('products.store_id', req.user.storeId)
      .groupBy('products.id')
      .havingRaw('sum(inventory_stock.quantity) < 10')
      .select('products.id');
    query = query.whereIn('id', lowStockIds.map(r => r.id));
  }

  const products = await query.orderBy('updated_at', 'desc').limit(50);
  res.json(products);
});

// GET /products/:id — Full Snapshot (variants + stock + DNA)
router.get('/products/:id', async (req, res) => {
  const product = await getProductSnapshot(req.params.id, req.user.storeId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /products — Create
router.post('/products', requireRole('manager'), async (req, res) => {
  const { name, category, description, primaryImageUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const product = await createProduct({ name, category, description, primaryImageUrl }, req.user.storeId);
  res.status(201).json(product);
});

// POST /products/:id/variants — Add a size/color variant
router.post('/products/:id/variants', requireRole('manager'), async (req, res) => {
  try {
    const variant = await addVariant(req.params.id, req.body, req.user.storeId);
    res.status(201).json(variant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /products/:id/transfer — Move stock between stores
// SECURITY FIX (this pass): fromStoreId previously came straight from
// req.body with no check against req.user.storeId — any authenticated
// user could transfer stock OUT of a store they don't belong to, just
// by naming it. The calling store can only ever be the source of a
// transfer it initiates; it can never move another store's stock.
router.post('/products/:id/transfer', requireRole('manager'), async (req, res) => {
  const { variantId, toStoreId, quantity } = req.body;
  try {
    await transferStock(req.params.id, { variantId, fromStoreId: req.user.storeId, toStoreId, quantity });
    res.json({ ok: true });
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

module.exports = router;
