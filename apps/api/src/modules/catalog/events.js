// apps/api/src/modules/catalog/events.js
// Module 4 — AI Digital Catalog
const { on } = require('../../core/eventBus');
const { generateProductDescription, generateCatalogImage } = require('./service');

// Fires no matter how the product was uploaded (Module 2's endpoint
// today, a bulk import later, etc.) — Catalog doesn't need to know or
// care which path created it, only that a product now exists.
on('ProductCreated', async (payload) => {
  await generateCatalogImage(payload.productId, payload.storeId);
  await generateProductDescription(payload.productId);
});
