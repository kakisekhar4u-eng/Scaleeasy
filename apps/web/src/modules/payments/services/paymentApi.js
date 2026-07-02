import apiFetch from '../../../shared/utils/apiClient';

export async function createPayment(data) {
  const res = await apiFetch('/api/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function confirmPayment(paymentId, data) {
  const res = await apiFetch(`/api/payments/${paymentId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createSplitPayment(parts) {
  const res = await apiFetch('/api/payments/split', {
    method: 'POST',
    body: JSON.stringify({ parts }),
  });
  return res.json();
}

export async function processRefund(paymentId, data) {
  const res = await apiFetch(`/api/payments/${paymentId}/refund`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getPaymentStatus(paymentId) {
  const res = await apiFetch(`/api/payments/status/${paymentId}`);
  return res.json();
}

export async function getPaymentsBySale(saleId) {
  const res = await apiFetch(`/api/payments/by-sale/${saleId}`);
  return res.json();
}

export async function getPaymentsByOrder(orderId) {
  const res = await apiFetch(`/api/payments/by-order/${orderId}`);
  return res.json();
}

export async function reconcilePayments(paymentIds) {
  const res = await apiFetch('/api/payments/reconcile', {
    method: 'POST',
    body: JSON.stringify({ paymentIds }),
  });
  return res.json();
}

export async function getReconciliationReport(from, to) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await apiFetch(`/api/payments/reconciliation-report?${params}`);
  return res.json();
}
