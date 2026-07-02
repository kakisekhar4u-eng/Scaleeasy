// apps/api/src/modules/catalog/routes.js
// Module 4 — AI Digital Catalog — AUTHENTICATED routes only
// (associate-facing: create/manage catalog links, AI description gen).
// The public, no-login browsing routes live in publicRoutes.js — see
// index.js for why they're mounted separately, before requireAuth.
const express = require('express');
const router = express.Router();
const { createCatalogLink, generateProductDescription } = require('./service');

require('./events');
const { requireRole } = require('../../core/permissions');

// POST /catalog-links — associate generates a shareable link for a customer
router.post('/catalog-links', requireRole('associate'), async (req, res) => {
  const link = await createCatalogLink(req.body, req.user.storeId, req.user.id);
  res.status(201).json({ ...link, shareUrl: `${process.env.CATALOG_BASE_URL || ''}/c/${link.token}` });
});

// POST /products/:id/generate-description — AI-drafted product copy
router.post('/products/:id/generate-description', requireRole('manager'), async (req, res) => {
  try {
    const result = await generateProductDescription(req.params.id, req.user.storeId);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
