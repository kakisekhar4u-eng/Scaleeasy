// apps/api/src/core/providers/stripeIndiaProvider.js
const crypto = require('crypto');

function createClient(credentials) {
  const { secretKey, webhookSecret } = credentials;
  const baseUrl = 'https://api.stripe.com/v1';

  async function apiCall(method, path, params) {
    const headers = {
      'Authorization': `Bearer ${secretKey}`,
    };
    let body;
    if (params) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(flattenParams(params)).toString();
    }
    const res = await fetch(`${baseUrl}${path}`, { method, headers, body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Stripe API error: ${res.status}`);
    return data;
  }

  function flattenParams(obj, prefix = '') {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        Object.assign(result, flattenParams(val, fullKey));
      } else {
        result[fullKey] = String(val);
      }
    }
    return result;
  }

  return {
    async createPaymentIntent({ amount, currency = 'inr', metadata }) {
      return apiCall('POST', '/payment_intents', {
        amount: Math.round(amount * 100),
        currency,
        metadata: metadata || {},
      });
    },

    async confirmPaymentIntent(intentId) {
      return apiCall('POST', `/payment_intents/${intentId}/confirm`);
    },

    async capturePaymentIntent(intentId) {
      return apiCall('POST', `/payment_intents/${intentId}/capture`);
    },

    async createRefund({ paymentIntentId, amount, reason }) {
      const params = { payment_intent: paymentIntentId };
      if (amount) params.amount = Math.round(amount * 100);
      if (reason) params.reason = reason;
      return apiCall('POST', '/refunds', params);
    },

    getWebhookSecret() {
      return webhookSecret;
    },
  };
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const parts = signatureHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;
  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

module.exports = { createClient, verifyWebhookSignature };
