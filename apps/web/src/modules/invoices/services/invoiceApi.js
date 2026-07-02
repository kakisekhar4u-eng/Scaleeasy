import apiFetch from '../../../shared/utils/apiClient';

export async function generateGSTInvoice(saleId, data = {}) {
  const res = await apiFetch(`/api/invoices/${saleId}/generate-gst`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getInvoice(saleId) {
  const res = await apiFetch(`/api/invoices/${saleId}`);
  return res.json();
}

export async function shareInvoice(saleId, via) {
  const res = await apiFetch(`/api/invoices/${saleId}/share`, {
    method: 'POST',
    body: JSON.stringify({ via }),
  });
  return res.json();
}

export async function getQRPaymentData(upiId, amount, storeName) {
  const res = await apiFetch('/api/invoices/qr-payment', {
    method: 'POST',
    body: JSON.stringify({ upiId, amount, storeName }),
  });
  return res.json();
}
