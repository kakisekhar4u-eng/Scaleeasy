import apiFetch from '../../../shared/utils/apiClient';

export async function sendMessage(data) {
  const res = await apiFetch('/api/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function sendOrderConfirmation(orderId) {
  const res = await apiFetch(`/api/whatsapp/send-order-confirmation/${orderId}`, { method: 'POST' });
  return res.json();
}

export async function sendInvoice(saleId) {
  const res = await apiFetch(`/api/whatsapp/send-invoice/${saleId}`, { method: 'POST' });
  return res.json();
}

export async function sendPaymentReceipt(paymentId) {
  const res = await apiFetch(`/api/whatsapp/send-payment-receipt/${paymentId}`, { method: 'POST' });
  return res.json();
}

export async function getTemplates() {
  const res = await apiFetch('/api/whatsapp/templates');
  return res.json();
}

export async function upsertTemplate(data) {
  const res = await apiFetch('/api/whatsapp/templates', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMessages(params = {}) {
  const query = new URLSearchParams(params);
  const res = await apiFetch(`/api/whatsapp/messages?${query}`);
  return res.json();
}

export async function getOptStatus(customerId) {
  const res = await apiFetch(`/api/whatsapp/opt-status/${customerId}`);
  return res.json();
}

export async function updateOptStatus(customerId, data) {
  const res = await apiFetch(`/api/whatsapp/opt-status/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getTemplateKeys() {
  const res = await apiFetch('/api/whatsapp/template-keys');
  return res.json();
}
