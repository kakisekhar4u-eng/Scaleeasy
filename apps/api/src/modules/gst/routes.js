// apps/api/src/modules/gst/routes.js
const express = require('express');
const router = express.Router();
const { requireRole } = require('../../core/permissions');
const gstService = require('./service');

router.get('/gst/config', async (req, res) => {
  const config = await gstService.getStoreGSTConfig(req.user.storeId);
  res.json(config || {});
});

router.put('/gst/config', requireRole('owner'), async (req, res) => {
  const config = await gstService.upsertStoreGSTConfig(req.user.storeId, req.body);
  res.json(config);
});

router.get('/gst/slabs', async (req, res) => {
  const slabs = await gstService.getGSTSlabs();
  res.json(slabs);
});

router.get('/gst/hsn/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  const results = await gstService.searchHSN(q);
  res.json(results);
});

router.get('/gst/product/:productId', async (req, res) => {
  const mapping = await gstService.getProductGSTMapping(req.user.storeId, req.params.productId);
  res.json(mapping || {});
});

router.put('/gst/product/:productId', requireRole('manager'), async (req, res) => {
  const mapping = await gstService.setProductGSTMapping(req.user.storeId, req.params.productId, req.body);
  res.json(mapping);
});

router.post('/gst/calculate', async (req, res) => {
  const { items, customerStateCode } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }
  const result = await gstService.calculateLineItemGST(req.user.storeId, items, customerStateCode);
  res.json(result);
});

module.exports = router;
