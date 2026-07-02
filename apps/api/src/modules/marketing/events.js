// apps/api/src/modules/marketing/events.js
// Module 3 — AI Marketing Studio
const db = require('../../db/client');
const { on } = require('../../core/eventBus');

// v2.2: "Listens: CustomerPurchased -> set purchased_at" was previously
// described in the handbook prose only, with no code.
on('CustomerPurchased', async (payload) => {
  await db('campaign_recipients')
    .join('campaigns', 'campaign_recipients.campaign_id', 'campaigns.id')
    .where({
      'campaign_recipients.customer_id': payload.customerId,
      'campaigns.status': 'live'
    })
    .whereNull('campaign_recipients.purchased_at')
    .update({ 'campaign_recipients.purchased_at': new Date() });
});
