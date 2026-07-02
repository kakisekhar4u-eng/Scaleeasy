// apps/web/src/modules/checkout/services/checkoutApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function completeSale({ items, customerPhone, paymentMode, discount }) {
  const res = await apiFetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, customerPhone, paymentMode, discount })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Sale failed.');
  return data;
}

export { completeSale };
