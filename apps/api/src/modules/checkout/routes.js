// apps/api/src/modules/checkout/routes.js
// Module 5 — Billing & Invoicing (Checkout Engine)
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { completeSale } = require('./service');

require('./events');
const { requireRole } = require('../../core/permissions');

// POST /sales — the core Checkout action
router.post('/sales', requireRole('associate'), async (req, res) => {
  try {
    const result = await completeSale(req.body, req.user.storeId);
    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'INSUFFICIENT_STOCK') {
      return res.status(409).json({ error: 'One or more items are sold out. Please refresh and try again.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// GET /sales/:id — receipt lookup
router.get('/sales/:id', async (req, res) => {
  const sale = await db('sales').where({ id: req.params.id, store_id: req.user.storeId }).first();
  if (!sale) return res.status(404).json({ error: 'Sale not found' });

  sale.items = await db('sale_items').where({ sale_id: sale.id });
  sale.invoice = await db('invoices').where({ sale_id: sale.id }).first();
  res.json(sale);
});

module.exports = router;
