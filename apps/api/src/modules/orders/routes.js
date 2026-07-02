// apps/api/src/modules/orders/routes.js
// Module 7 — Orders
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { createOrder, updateOrderStatus } = require('./service');

require('./events'); // side-effect: registers listeners (Ch.4)
const { requireRole } = require('../../core/permissions');

// GET /orders?status=
router.get('/orders', async (req, res) => {
  let query = db('order_cards').where({ store_id: req.user.storeId });
  if (req.query.status) query = query.where('status', req.query.status);
  const orders = await query.orderBy('updated_at', 'desc').limit(50);
  res.json(orders);
});

router.get('/orders/:id', async (req, res) => {
  const order = await db('order_cards').where({ id: req.params.id, store_id: req.user.storeId }).first();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/orders', requireRole('associate'), async (req, res) => {
  try {
    const order = await createOrder(req.body, req.user.storeId);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// SECURITY FIX (this pass): previously updated any order by id with no
// store check — any authenticated user could change another store's
// order status (e.g. falsely marking it delivered/completed).
router.patch('/orders/:id/status', requireRole('associate'), async (req, res) => {
  const order = await db('order_cards').where({ id: req.params.id, store_id: req.user.storeId }).first();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  await updateOrderStatus(req.params.id, req.body.status);
  res.json({ ok: true });
});

module.exports = router;
