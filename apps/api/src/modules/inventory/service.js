// apps/api/src/modules/inventory/service.js
// Module 2 — Smart Inventory
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');

async function getProductSnapshot(productId, storeId) {
  const product = await db('products').where({ id: productId, store_id: storeId }).first();
  if (!product) return null;

  product.variants = await db('product_variants').where({ product_id: productId });
  product.dna = await db('product_dna').where({ product_id: productId }).first();

  const variantIds = product.variants.map(v => v.id);
  product.stockByStore = variantIds.length
    ? await db('inventory_stock').whereIn('variant_id', variantIds)
    : [];

  return product;
}

async function createProduct({ name, category, description, primaryImageUrl }, storeId) {
  const [product] = await db('products').insert({
    store_id: storeId, name, category, description,
    primary_image_url: primaryImageUrl,
    raw_image_url: primaryImageUrl, // starts as the uploaded photo; Catalog may replace primary_image_url once rendered
    image_generation_status: primaryImageUrl ? 'pending' : 'ready' // nothing to render if no image was uploaded
  }).returning('*');

  // Decoupled on purpose: this fires regardless of how the product got
  // here (this endpoint, a future bulk import, etc.) — Catalog (Module 4)
  // reacts to the event, Inventory doesn't need to know Catalog exists.
  await emit('ProductCreated', { productId: product.id, storeId }, 'inventory');

  return product;
}

async function addVariant(productId, { size, color, sku, sellingPrice, mrp }, storeId) {
  const product = await db('products').where({ id: productId, store_id: storeId }).first();
  if (!product) throw new Error('Product not found');
  if (!sellingPrice || sellingPrice <= 0) throw new Error('sellingPrice must be a positive number');

  const [variant] = await db('product_variants').insert({
    product_id: productId, size, color, sku, selling_price: sellingPrice, mrp
  }).returning('*');
  return variant;
}

// v2.2: transactional, upserts destination row (was: could silently lose
// stock if the destination store had never stocked this variant before),
// and checks source availability before decrementing.
async function transferStock(productId, { variantId, fromStoreId, toStoreId, quantity }) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('quantity must be a positive integer');
  }

  await db.transaction(async (trx) => {
    const source = await trx('inventory_stock')
      .where({ variant_id: variantId, store_id: fromStoreId })
      .first();
    if (!source || source.quantity < quantity) {
      throw new Error('Not enough stock at source store to transfer');
    }

    await trx('inventory_stock')
      .where({ variant_id: variantId, store_id: fromStoreId })
      .decrement('quantity', quantity);

    await trx('inventory_stock')
      .insert({ variant_id: variantId, store_id: toStoreId, quantity })
      .onConflict(['variant_id', 'store_id'])
      .merge({ quantity: trx.raw('inventory_stock.quantity + ?', [quantity]), updated_at: new Date() });
  });

  await emit('StockTransferred', { productId, variantId, fromStoreId, toStoreId, quantity }, 'inventory');
}

// v2.2: Product Health Score was described in the handbook's AI table but
// never persisted anywhere (unlike customers.health_score). Rule-based,
// triggered on ProductSold.
async function recalculateProductHealthScore(productId) {
  const dna = await db('product_dna').where({ product_id: productId }).first();
  const velocity = dna?.velocity || 0;
  const returnRate = dna?.return_rate || 0;

  let score = 50, reason = 'Not enough data yet';
  if (velocity > 0) {
    if (velocity >= 5 && returnRate < 0.1) { score = 85; reason = 'Fast mover, low returns'; }
    else if (velocity < 1) { score = 25; reason = 'Slow mover — consider transfer or markdown'; }
    else { score = 55; reason = 'Steady seller'; }
  }

  const existing = await db('product_dna').where({ product_id: productId }).first();
  const updates = { health_score: score, health_score_reason: reason, updated_at: new Date() };
  if (existing) await db('product_dna').where({ product_id: productId }).update(updates);
  else await db('product_dna').insert({ product_id: productId, ...updates });
}

module.exports = {
  getProductSnapshot, createProduct, addVariant, transferStock, recalculateProductHealthScore
};
