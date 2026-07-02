// apps/api/src/modules/whatsapp/routes.js
const express = require('express');
const router = express.Router();
const { requireRole } = require('../../core/permissions');
const whatsappService = require('./service');

require('./events');

router.post('/whatsapp/send', requireRole('associate'), async (req, res) => {
  try {
    const result = await whatsappService.sendMessage(req.body, req.user.storeId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/whatsapp/send-order-confirmation/:orderId', requireRole('associate'), async (req, res) => {
  try {
    const result = await whatsappService.sendOrderConfirmation(req.params.orderId, req.user.storeId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/whatsapp/send-invoice/:saleId', requireRole('associate'), async (req, res) => {
  try {
    const result = await whatsappService.sendInvoice(req.params.saleId, req.user.storeId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/whatsapp/send-payment-receipt/:paymentId', requireRole('associate'), async (req, res) => {
  try {
    const result = await whatsappService.sendPaymentReceipt(req.params.paymentId, req.user.storeId, req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/whatsapp/templates', async (req, res) => {
  const templates = await whatsappService.listTemplates(req.user.storeId);
  res.json(templates);
});

router.put('/whatsapp/templates', requireRole('manager'), async (req, res) => {
  const template = await whatsappService.upsertTemplate(req.user.storeId, req.body);
  res.json(template);
});

router.get('/whatsapp/messages', async (req, res) => {
  const messages = await whatsappService.getMessages(req.user.storeId, {
    customerId: req.query.customerId,
    status: req.query.status,
    limit: Number(req.query.limit) || 50,
    offset: Number(req.query.offset) || 0,
  });
  res.json(messages);
});

router.get('/whatsapp/opt-status/:customerId', async (req, res) => {
  const status = await whatsappService.getOptStatus(req.user.storeId, req.params.customerId);
  res.json(status || { opted_in: false });
});

router.put('/whatsapp/opt-status/:customerId', requireRole('associate'), async (req, res) => {
  const { phone, optedIn, source } = req.body;
  const result = await whatsappService.updateOptStatus(
    req.user.storeId, req.params.customerId, phone, optedIn, source
  );
  res.json(result);
});

router.get('/whatsapp/template-keys', async (req, res) => {
  res.json(whatsappService.TEMPLATE_KEYS);
});

module.exports = router;
