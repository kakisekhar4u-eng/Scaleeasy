// apps/api/src/modules/catalog/service.js
// Module 4 — AI Digital Catalog
const crypto = require('crypto');
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { generate, registerTask } = require('../../core/aiEngine');
const { getConnector, ConnectorNotAvailableError } = require('../../core/connectorLayer');

async function createCatalogLink({ customerId, expiresInDays = 14 }, storeId, userId) {
  const token = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + expiresInDays * 86400000);

  const [link] = await db('catalog_links').insert({
    store_id: storeId, customer_id: customerId, token, expires_at: expiresAt, created_by: userId
  }).returning('*');

  return link;
}

// Every public endpoint calls this first. Ch.7A: valid token, not
// revoked, not expired — no exceptions.
async function validateToken(token) {
  const link = await db('catalog_links').where({ token }).first();
  if (!link) return null;
  if (link.revoked_at) return null;
  if (new Date(link.expires_at) <= new Date()) return null;
  return link;
}

async function browseCatalog(storeId) {
  return db('products')
    .join('product_variants', 'product_variants.product_id', 'products.id')
    .where({ 'products.store_id': storeId, 'products.status': 'active' })
    .select('products.id', 'products.name', 'products.category', 'products.description', 'products.primary_image_url')
    .groupBy('products.id', 'products.name', 'products.category', 'products.description', 'products.primary_image_url')
    .limit(100);
}

async function recordView(catalogLinkId, productId) {
  await db('catalog_views').insert({ catalog_link_id: catalogLinkId, product_id: productId });
  await emit('ProductViewed', { productId }, 'catalog');
}

async function addToWishlist(customerId, productId) {
  const [item] = await db('wishlist_items')
    .insert({ customer_id: customerId, product_id: productId })
    .onConflict(['customer_id', 'product_id'])
    .merge({ created_at: new Date() })
    .returning('*');
  return item;
}

async function submitEnquiry(customerId, productId, storeId) {
  await emit('CustomerEnquired', { customerId, productId, storeId, source: 'catalog' }, 'catalog');
  return { status: 'submitted' };
}

registerTask('product_description', {
  buildPrompt: (product) => `Write a short, appealing product description (under 60 words) for an
Indian boutique's online catalog. Product name: "${product.name}". Category: "${product.category || 'apparel'}".
No emojis, no exclamation marks, no generic filler like "perfect for any occasion".`,

  // Zero-cost default: a simple template filled in with the product's
  // own name/category. Not as evocative as a real description, but
  // accurate and never blank.
  ruleBased: (product) => {
    const category = product.category || 'piece';
    return `${product.name} — a thoughtfully made ${category.toLowerCase()} from our collection. Crafted with attention to detail and finished for everyday wear.`;
  }
});

// Auto-writes a product description an associate can edit, instead of
// leaving it blank.
// SECURITY FIX (this pass): previously took no storeId at all — any
// authenticated user could trigger (and overwrite) another store's
// product description just by knowing its id.
async function generateProductDescription(productId, storeId) {
  const product = await db('products').where({ id: productId, store_id: storeId }).first();
  if (!product) throw new Error('Product not found');

  const result = await generate('product_description', product, `product_description:${productId}`, 10080); // 7 days

  await db('products').where({ id: productId }).update({ description: result.text, updated_at: new Date() });
  return { text: result.text, provider: result.provider };
}

// tryon2buy renders a clean on-model catalog photo from whatever raw
// image was uploaded — runs on ProductCreated (see events.js), not
// called directly from a request handler, since generation isn't instant.
async function generateCatalogImage(productId, storeId) {
  const product = await db('products').where({ id: productId }).first();
  if (!product.raw_image_url) return; // nothing uploaded — nothing to render

  let tryon2buy;
  try {
    tryon2buy = await getConnector(storeId, 'tryon2buy');
  } catch (err) {
    if (err instanceof ConnectorNotAvailableError) {
      // Honest fallback (Commandment 10): keep the raw photo visible
      // rather than leave the catalog entry with no image at all.
      await db('products').where({ id: productId }).update({ image_generation_status: 'failed' });
      return;
    }
    throw err;
  }

  await db('products').where({ id: productId }).update({ image_generation_status: 'processing' });
  const { jobId } = await tryon2buy.generateCatalogPhoto({ garmentImageUrl: product.raw_image_url });
  await db('products').where({ id: productId }).update({ catalog_render_job_id: jobId });
  // Actual completion is picked up by a polling job — see
  // pollCatalogImageJob() below, intended to run on a short interval
  // (e.g. every 10s) rather than block the upload request.
}

async function pollCatalogImageJob(productId, storeId) {
  const product = await db('products').where({ id: productId }).first();
  if (!product?.catalog_render_job_id || product.image_generation_status !== 'processing') return;

  const tryon2buy = await getConnector(storeId, 'tryon2buy');
  const result = await tryon2buy.getJobResult(product.catalog_render_job_id);

  if (result.status === 'completed') {
    await db('products').where({ id: productId }).update({
      primary_image_url: result.imageUrl,
      image_generation_status: 'ready',
      updated_at: new Date()
    });
  } else if (result.status === 'failed') {
    await db('products').where({ id: productId }).update({ image_generation_status: 'failed' });
  }
  // else still processing — leave as is, next poll checks again
}

module.exports = {
  createCatalogLink, validateToken, browseCatalog, recordView,
  addToWishlist, submitEnquiry, generateProductDescription,
  generateCatalogImage, pollCatalogImageJob
};
