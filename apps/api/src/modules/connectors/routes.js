// apps/api/src/modules/connectors/routes.js
// Module 10 — Connected Apps (Integration Hub)
const express = require('express');
const router = express.Router();
const { listConnectors, connectProvider, disconnectProvider } = require('./service');

require('./events');
const { requireRole } = require('../../core/permissions');

router.get('/connectors', async (req, res) => {
  const connectors = await listConnectors(req.user.storeId);
  res.json(connectors);
});

router.post('/connectors/:provider/connect', requireRole('owner'), async (req, res) => {
  try {
    const result = await connectProvider(req.user.storeId, req.params.provider, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/connectors/:provider/disconnect', requireRole('owner'), async (req, res) => {
  const result = await disconnectProvider(req.user.storeId, req.params.provider);
  res.json(result);
});

module.exports = router;
