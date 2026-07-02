// apps/web/src/modules/catalog/services/publicCatalogApi.js
// Calls /public/* — no auth headers needed, the token in the URL IS the auth.
async function browseCatalog(token) {
  const res = await fetch(`/public/catalog/${token}`);
  if (!res.ok) throw new Error('This catalog link is invalid or has expired.');
  return res.json();
}

async function viewProduct(token, productId) {
  const res = await fetch(`/public/catalog/${token}/products/${productId}`);
  if (!res.ok) throw new Error('Product not found.');
  return res.json();
}

async function addToWishlist(token, productId) {
  const res = await fetch(`/public/catalog/${token}/wishlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  });
  if (!res.ok) throw new Error('Failed to add to wishlist.');
  return res.json();
}

async function submitEnquiry(token, productId) {
  const res = await fetch(`/public/catalog/${token}/enquire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  });
  if (!res.ok) throw new Error('Failed to submit enquiry.');
  return res.json();
}

export { browseCatalog, viewProduct, addToWishlist, submitEnquiry };
