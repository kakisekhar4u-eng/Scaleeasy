// apps/web/src/modules/boutique/services/tryOnApi.js
// Calls /public/* — no auth needed, this page has no login at all.
async function getProduct(productId) {
  const res = await fetch(`/public/tryon/${productId}`);
  if (!res.ok) throw new Error('Product not found.');
  return res.json();
}

async function generateTryOn(productId, personImageUrl) {
  const res = await fetch(`/public/tryon/${productId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personImageUrl })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Try-on failed.');
  return res.json();
}

async function getTryOnStatus(lookId) {
  const res = await fetch(`/public/tryon/status/${lookId}`);
  if (!res.ok) throw new Error('Failed to check status.');
  return res.json();
}

export { getProduct, generateTryOn, getTryOnStatus };
