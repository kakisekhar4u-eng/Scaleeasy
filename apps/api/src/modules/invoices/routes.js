// apps/api/src/modules/invoices/routes.js
const express = require('express');
const router = express.Router();
const { requireRole } = require('../../core/permissions');
const invoiceService = require('./service');

router.post('/invoices/:saleId/generate-gst', requireRole('associate'), async (req, res) => {
  try {
    const result = await invoiceService.generateGSTInvoice(req.params.saleId, req.user.storeId, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/invoices/:saleId', async (req, res) => {
  const data = await invoiceService.getInvoiceData(req.params.saleId, req.user.storeId);
  if (!data) return res.status(404).json({ error: 'Invoice not found' });
  res.json(data);
});

router.post('/invoices/:saleId/share', requireRole('associate'), async (req, res) => {
  const { via } = req.body;
  await invoiceService.markShared(req.params.saleId, via);
  res.json({ shared: true, via });
});

router.post('/invoices/qr-payment', async (req, res) => {
  const { upiId, amount, storeName } = req.body;
  if (!upiId || !amount) return res.status(400).json({ error: 'upiId and amount required' });
  res.json(invoiceService.buildQRPaymentData(upiId, amount, storeName || 'Store'));
});

module.exports = router;
