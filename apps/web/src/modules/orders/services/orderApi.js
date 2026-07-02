// apps/web/src/modules/orders/services/orderApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function listOrders(status) {
  const params = status ? `?status=${status}` : '';
  const res = await apiFetch(`/api/orders${params}`);
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

export { listOrders };
