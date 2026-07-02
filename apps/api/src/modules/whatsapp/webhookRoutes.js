// apps/api/src/modules/whatsapp/webhookRoutes.js
// Public webhook endpoints for WhatsApp status updates — no auth, signature-verified.
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const logger = require('../../shared/utils/logger');
const metaProvider = require('../../core/providers/whatsappMetaProvider');
const whatsappService = require('./service');

router.get('/whatsapp/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

router.post('/whatsapp/meta', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!metaProvider.verifyWebhookSignature(req.rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    const entries = req.body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const statuses = change.value?.statuses || [];
        for (const status of statuses) {
          await whatsappService.updateMessageStatus(status.id, status.status);
        }
      }
    }
  } catch (err) {
    logger.error('WhatsApp Meta webhook error', err);
  }

  res.status(200).send('OK');
});

module.exports = router;
