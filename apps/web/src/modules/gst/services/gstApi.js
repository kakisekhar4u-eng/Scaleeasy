import apiFetch from '../../../shared/utils/apiClient';

export async function getGSTConfig() {
  const res = await apiFetch('/api/gst/config');
  return res.json();
}

export async function updateGSTConfig(data) {
  const res = await apiFetch('/api/gst/config', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getGSTSlabs() {
  const res = await apiFetch('/api/gst/slabs');
  return res.json();
}

export async function searchHSN(query) {
  const res = await apiFetch(`/api/gst/hsn/search?q=${encodeURIComponent(query)}`);
  return res.json();
}

export async function getProductGST(productId) {
  const res = await apiFetch(`/api/gst/product/${productId}`);
  return res.json();
}

export async function setProductGST(productId, data) {
  const res = await apiFetch(`/api/gst/product/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function calculateGST(items, customerStateCode) {
  const res = await apiFetch('/api/gst/calculate', {
    method: 'POST',
    body: JSON.stringify({ items, customerStateCode }),
  });
  return res.json();
}
