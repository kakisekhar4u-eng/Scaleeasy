// apps/api/src/core/providers/bluedartProvider.js
// Example carrier provider — swap for whichever carrier(s) you actually
// use (Delhivery, Shiprocket, etc.). Same shape works for any of them:
// createClient for booking, verifyWebhookSignature for inbound tracking
// updates.
//
// TODO: confirm Bluedart's actual API — endpoint, auth, and signature
// scheme below are placeholders until you have real API docs.

function createClient(credentials) {
  const { apiKey, baseUrl = 'https://api.bluedart.com' } = credentials;

  return {
    async createShipment({ orderId, address, weight }) {
      const res = await fetch(`${baseUrl}/v1/shipments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, address, weight })
      });
      if (!res.ok) throw new Error(`Bluedart booking failed: ${res.status}`);
      const data = await res.json();
      return { trackingId: data.trackingId };
    }
  };
}

// Ch.7A "Inbound Webhook Security" — every carrier provider that
// receives webhooks must export this. Verifies the request actually
// came from Bluedart before anything in the webhook handler touches
// the database (see modules/logistics/webhookRoutes.js).
function verifyWebhookSignature(rawBody, signatureHeader) {
  const crypto = require('crypto');
  const secret = process.env.BLUEDART_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return signatureHeader === expected;
}

module.exports = { createClient, verifyWebhookSignature };
