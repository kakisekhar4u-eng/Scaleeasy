// apps/api/src/modules/storeCredit/routes.js
const express = require('express');
const router = express.Router();
const { requireRole } = require('../../core/permissions');
const storeCreditService = require('./service');

require('./events');

router.get('/store-credit/:customerId', async (req, res) => {
  const wallet = await storeCreditService.getWallet(req.user.storeId, req.params.customerId);
  res.json(wallet || { balance: 0 });
});

router.get('/store-credit/:customerId/transactions', async (req, res) => {
  const result = await storeCreditService.getTransactions(req.user.storeId, req.params.customerId, {
    limit: Number(req.query.limit) || 50,
    offset: Number(req.query.offset) || 0,
  });
  res.json(result);
});

router.post('/store-credit/:customerId/credit', requireRole('manager'), async (req, res) => {
  try {
    const { amount, type, note, expiresAt } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Positive amount required' });
    const result = await storeCreditService.addCredit(
      req.user.storeId, req.params.customerId, Number(amount),
      { type: type || 'manual_credit', note, expiresAt, createdBy: req.user.id }
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/store-credit/:customerId/debit', requireRole('associate'), async (req, res) => {
  try {
    const { amount, referenceType, referenceId, note } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Positive amount required' });
    const result = await storeCreditService.debitCredit(
      req.user.storeId, req.params.customerId, Number(amount),
      { referenceType, referenceId, note, createdBy: req.user.id }
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
