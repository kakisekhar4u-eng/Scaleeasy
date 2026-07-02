// apps/api/src/modules/payments/events.js
const { on } = require('../../core/eventBus');
const db = require('../../db/client');

on('RefundProcessed', async (payload) => {
  if (payload.creditToWallet) {
    const storeCreditService = require('../storeCredit/service');
    await storeCreditService.creditFromRefund(
      payload.customerId,
      payload.amount,
      payload.paymentId,
      null
    );
  }
});
