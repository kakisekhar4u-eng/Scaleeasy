// apps/web/src/modules/inventory/services/productApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function getProduct(id) {
  const res = await apiFetch(`/api/products/${id}`);
  if (!res.ok) throw new Error('Failed to load product');
  return res.json();
}

async function searchProducts(query, lowStock) {
  const params = new URLSearchParams();
  if (query) params.set('search', query);
  if (lowStock) params.set('lowStock', 'true');
  const res = await apiFetch(`/api/products?${params}`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export { getProduct, searchProducts };
