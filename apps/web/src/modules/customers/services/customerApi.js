// apps/web/src/modules/customers/services/customerApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function getCustomer(id) {
  const res = await apiFetch(`/api/customers/${id}`);
  if (!res.ok) throw new Error('Failed to load customer');
  return res.json();
}

async function searchCustomers(query) {
  const res = await apiFetch(`/api/customers?search=${encodeURIComponent(query || '')}`);
  if (!res.ok) throw new Error('Failed to load customers');
  return res.json();
}

async function addMemoryNote(customerId, noteText) {
  const res = await apiFetch(`/api/customers/${customerId}/memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteText })
  });
  if (!res.ok) throw new Error('Failed to add note');
  return res.json();
}

export { getCustomer, searchCustomers, addMemoryNote };
