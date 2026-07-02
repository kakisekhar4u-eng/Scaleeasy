// apps/api/src/modules/whatsapp/events.js
const { on } = require('../../core/eventBus');
const db = require('../../db/client');
const logger = require('../../shared/utils/logger');

on('OrderCreated', async (payload) => {
  try {
    const whatsappService = require('./service');
    await whatsappService.sendOrderConfirmation(payload.orderId, payload.storeId, null);
  } catch (err) {
    logger.warn('WhatsApp order confirmation skipped', err.message);
  }
});

on('PaymentCaptured', async (payload) => {
  try {
    if (!payload.saleId) return;
    const sale = await db('sales').where({ id: payload.saleId }).first();
    if (!sale?.store_id) return;
    const whatsappService = require('./service');
    await whatsappService.sendPaymentReceipt(payload.paymentId, sale.store_id, null);
  } catch (err) {
    logger.warn('WhatsApp payment receipt skipped', err.message);
  }
});
