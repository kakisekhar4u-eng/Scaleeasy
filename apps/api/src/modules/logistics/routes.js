// apps/api/src/modules/logistics/routes.js
// Module 8 — Multi-Carrier Logistics — AUTHENTICATED routes only.
// The carrier webhook (no login — it's the carrier's server calling us,
// not a person) lives in webhookRoutes.js, mounted separately in
// index.js, same pattern as Module 4's public catalog.
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { bookShipment } = require('./service');

require('./events');
const { requireRole } = require('../../core/permissions');

router.post('/orders/:id/ship', requireRole('manager'), async (req, res) => {
  try {
    const shipment = await bookShipment(req.params.id, req.body.provider, req.body, req.user.storeId);
    res.status(201).json(shipment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/shipments/:id', async (req, res) => {
  const shipment = await db('shipments').where({ id: req.params.id, store_id: req.user.storeId }).first();
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
  res.json(shipment);
});

module.exports = router;
