// apps/api/src/core/providers/whatsappMetaProvider.js
const crypto = require('crypto');

function createClient(credentials) {
  const { accessToken, phoneNumberId, businessAccountId } = credentials;
  const baseUrl = 'https://graph.facebook.com/v18.0';

  async function apiCall(method, path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Meta API error');
    return data;
  }

  return {
    async sendTemplate({ to, templateName, language = 'en', components }) {
      return apiCall('POST', `/${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: components || [],
        },
      });
    },

    async sendText({ to, text }) {
      return apiCall('POST', `/${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      });
    },

    async sendDocument({ to, documentUrl, filename, caption }) {
      return apiCall('POST', `/${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: { link: documentUrl, filename, caption },
      });
    },

    async sendImage({ to, imageUrl, caption }) {
      return apiCall('POST', `/${phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link: imageUrl, caption },
      });
    },

    async getTemplates() {
      return apiCall('GET', `/${businessAccountId}/message_templates`);
    },
  };
}

function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.WHATSAPP_META_APP_SECRET;
  if (!secret || !signatureHeader) return false;
  const sig = signatureHeader.replace('sha256=', '');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

module.exports = { createClient, verifyWebhookSignature };
