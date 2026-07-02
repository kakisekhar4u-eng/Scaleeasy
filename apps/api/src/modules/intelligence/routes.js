// apps/api/src/modules/intelligence/routes.js
// Module 9 — AI Business Intelligence
const express = require('express');
const router = express.Router();
const { gatherCrossModuleSignals, generateBusinessBrief } = require('./service');

require('./events');
const { requireRole } = require('../../core/permissions');

router.get('/signals', requireRole('manager'), async (req, res) => {
  const signals = await gatherCrossModuleSignals(req.user.storeId);
  res.json(signals);
});

router.post('/business-brief', requireRole('manager'), async (req, res) => {
  const brief = await generateBusinessBrief(req.user.storeId);
  res.status(201).json(brief);
});

module.exports = router;
