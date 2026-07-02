// apps/api/src/core/providers/whatsappExotelProvider.js

function createClient(credentials) {
  const { apiKey, apiToken, subdomain, senderId } = credentials;
  const baseUrl = `https://${subdomain}.exotel.com/v2`;
  const auth = Buffer.from(`${apiKey}:${apiToken}`).toString('base64');

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
    if (!res.ok) throw new Error(data.message || `Exotel API error: ${res.status}`);
    return data;
  }

  return {
    async sendTemplate({ to, templateName, language = 'en', components }) {
      return apiCall('POST', '/whatsapp/messages', {
        from: senderId,
        to,
        type: 'template',
        template: { name: templateName, language, components: components || [] },
      });
    },

    async sendText({ to, text }) {
      return apiCall('POST', '/whatsapp/messages', {
        from: senderId,
        to,
        type: 'text',
        text: { body: text },
      });
    },

    async sendDocument({ to, documentUrl, filename, caption }) {
      return apiCall('POST', '/whatsapp/messages', {
        from: senderId,
        to,
        type: 'document',
        document: { link: documentUrl, filename, caption },
      });
    },

    async sendImage({ to, imageUrl, caption }) {
      return apiCall('POST', '/whatsapp/messages', {
        from: senderId,
        to,
        type: 'image',
        image: { link: imageUrl, caption },
      });
    },
  };
}

function verifyWebhookSignature() {
  return true;
}

module.exports = { createClient, verifyWebhookSignature };
