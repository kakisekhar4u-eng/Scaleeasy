import apiFetch from '../../../shared/utils/apiClient';

export async function getWallet(customerId) {
  const res = await apiFetch(`/api/store-credit/${customerId}`);
  return res.json();
}

export async function getTransactions(customerId, params = {}) {
  const query = new URLSearchParams(params);
  const res = await apiFetch(`/api/store-credit/${customerId}/transactions?${query}`);
  return res.json();
}

export async function addCredit(customerId, data) {
  const res = await apiFetch(`/api/store-credit/${customerId}/credit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function debitCredit(customerId, data) {
  const res = await apiFetch(`/api/store-credit/${customerId}/debit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}
