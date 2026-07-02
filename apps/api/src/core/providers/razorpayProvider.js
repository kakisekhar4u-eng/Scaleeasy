// apps/api/src/core/providers/razorpayProvider.js
const crypto = require('crypto');

function createClient(credentials) {
  const { keyId, keySecret, webhookSecret } = credentials;
  const baseUrl = 'https://api.razorpay.com/v1';
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  async function apiCall(method, path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.description || `Razorpay API error: ${res.status}`);
    return data;
  }

  return {
    async createOrder({ amount, currency = 'INR', receipt, notes }) {
      return apiCall('POST', '/orders', {
        amount: Math.round(amount * 100),
        currency,
        receipt,
        notes,
      });
    },

    async fetchPayment(paymentId) {
      return apiCall('GET', `/payments/${paymentId}`);
    },

    async capturePayment(paymentId, amount, currency = 'INR') {
      return apiCall('POST', `/payments/${paymentId}/capture`, {
        amount: Math.round(amount * 100),
        currency,
      });
    },

    async createRefund(paymentId, { amount, notes }) {
      return apiCall('POST', `/payments/${paymentId}/refund`, {
        amount: amount ? Math.round(amount * 100) : undefined,
        notes,
      });
    },

    async fetchRefund(paymentId, refundId) {
      return apiCall('GET', `/payments/${paymentId}/refunds/${refundId}`);
    },

    getWebhookSecret() {
      return webhookSecret;
    },
  };
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}

module.exports = { createClient, verifyWebhookSignature };
