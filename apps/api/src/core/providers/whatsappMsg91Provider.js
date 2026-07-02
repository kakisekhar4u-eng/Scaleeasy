// apps/api/src/core/providers/whatsappMsg91Provider.js

function createClient(credentials) {
  const { authKey, senderId } = credentials;
  const baseUrl = 'https://control.msg91.com/api/v5';

  async function apiCall(method, path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'authkey': authKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (data.type === 'error') throw new Error(data.message || 'MSG91 API error');
    return data;
  }

  return {
    async sendTemplate({ to, templateName, language = 'en', components }) {
      return apiCall('POST', '/whatsapp/whatsapp-outbound-message/bulk/', {
        integrated_number: senderId,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: templateName,
            language: { code: language, policy: 'deterministic' },
            namespace: credentials.namespace || '',
            to_and_components: [{
              to: [to],
              components: components || [],
            }],
          },
        },
      });
    },

    async sendText({ to, text }) {
      return apiCall('POST', '/whatsapp/whatsapp-outbound-message/bulk/', {
        integrated_number: senderId,
        content_type: 'text',
        payload: {
          messaging_product: 'whatsapp',
          type: 'text',
          to: [to],
          text: { body: text },
        },
      });
    },

    async sendDocument({ to, documentUrl, filename, caption }) {
      return apiCall('POST', '/whatsapp/whatsapp-outbound-message/bulk/', {
        integrated_number: senderId,
        content_type: 'document',
        payload: {
          to: [to],
          type: 'document',
          document: { link: documentUrl, filename, caption },
        },
      });
    },

    async sendImage({ to, imageUrl, caption }) {
      return apiCall('POST', '/whatsapp/whatsapp-outbound-message/bulk/', {
        integrated_number: senderId,
        content_type: 'image',
        payload: {
          to: [to],
          type: 'image',
          image: { link: imageUrl, caption },
        },
      });
    },
  };
}

function verifyWebhookSignature() {
  return true;
}

module.exports = { createClient, verifyWebhookSignature };
