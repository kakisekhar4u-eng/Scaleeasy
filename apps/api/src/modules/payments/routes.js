// apps/api/src/modules/payments/routes.js
const express = require('express');
const router = express.Router();
const { requireRole } = require('../../core/permissions');
const paymentService = require('./service');

require('./events');

router.post('/payments', requireRole('associate'), async (req, res) => {
  try {
    const txn = await paymentService.initiateProviderPayment(req.body, req.user.storeId, req.user.id);
    res.json(txn);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/payments/:id/confirm', requireRole('associate'), async (req, res) => {
  try {
    const result = await paymentService.confirmPayment(req.params.id, req.body, req.user.storeId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/payments/split', requireRole('associate'), async (req, res) => {
  try {
    const result = await paymentService.createSplitPayment(req.body.parts, req.user.storeId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/payments/:id/refund', requireRole('manager'), async (req, res) => {
  try {
    const refund = await paymentService.processRefund(req.params.id, req.body, req.user.storeId, req.user.id);
    res.json(refund);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/payments/status/:id', async (req, res) => {
  const payment = await paymentService.getPaymentStatus(req.params.id, req.user.storeId);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json(payment);
});

router.get('/payments/by-sale/:saleId', async (req, res) => {
  const payments = await paymentService.getPaymentsByReference(req.user.storeId, { saleId: req.params.saleId });
  res.json(payments);
});

router.get('/payments/by-order/:orderId', async (req, res) => {
  const payments = await paymentService.getPaymentsByReference(req.user.storeId, { orderId: req.params.orderId });
  res.json(payments);
});

router.post('/payments/reconcile', requireRole('owner'), async (req, res) => {
  const { paymentIds } = req.body;
  if (!Array.isArray(paymentIds)) return res.status(400).json({ error: 'paymentIds array required' });
  const result = await paymentService.markReconciled(paymentIds, req.user.storeId, req.user.id);
  res.json(result);
});

router.get('/payments/reconciliation-report', requireRole('manager'), async (req, res) => {
  const report = await paymentService.getReconciliationReport(req.user.storeId, {
    from: req.query.from,
    to: req.query.to,
  });
  res.json(report);
});

module.exports = router;
