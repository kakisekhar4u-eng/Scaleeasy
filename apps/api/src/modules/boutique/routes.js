// apps/api/src/modules/boutique/routes.js
// Module 6 — Boutique Experience Engine (+ 6A AI Style Studio)
// AUTHENTICATED routes only — the standalone try-on widget's public
// (no-login) routes live in publicRoutes.js, mounted separately in
// index.js, same pattern as Module 4's public catalog.
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const {
  createBlueprint, addBlueprintNote, recordMeasurements, finalizeDesign, deliverBlueprint,
  generateLook, saveLook
} = require('./service');

require('./events');
const { requireRole } = require('../../core/permissions');

// SECURITY: same note as customers/routes.js — this backend's DB
// connection bypasses RLS, so every route touching a specific
// blueprint_id or customer_id must verify it belongs to req.user.storeId
// itself. FIXED (this pass): four routes below were missing this.
async function requireBlueprintInStore(blueprintId, storeId) {
  return db('garment_blueprints').where({ id: blueprintId, store_id: storeId }).first();
}
async function requireCustomerInStore(customerId, storeId) {
  return db('customers').where({ id: customerId, store_id: storeId }).first();
}

// --- Garment Blueprints ---

router.post('/blueprints', requireRole('associate'), async (req, res) => {
  const blueprint = await createBlueprint(req.body, req.user.storeId);
  res.status(201).json(blueprint);
});

router.get('/blueprints/:id', async (req, res) => {
  const blueprint = await db('garment_blueprints').where({ id: req.params.id, store_id: req.user.storeId }).first();
  if (!blueprint) return res.status(404).json({ error: 'Blueprint not found' });
  blueprint.notes = await db('blueprint_notes').where({ blueprint_id: blueprint.id }).orderBy('created_at', 'desc');
  res.json(blueprint);
});

router.post('/blueprints/:id/notes', requireRole('associate'), async (req, res) => {
  if (!(await requireBlueprintInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Blueprint not found' });
  }
  const note = await addBlueprintNote(req.params.id, req.body.noteText, req.user.id);
  res.status(201).json(note);
});

router.post('/blueprints/:id/finalize', requireRole('associate'), async (req, res) => {
  if (!(await requireBlueprintInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Blueprint not found' });
  }
  const blueprint = await finalizeDesign(req.params.id);
  res.json(blueprint);
});

router.post('/blueprints/:id/deliver', requireRole('associate'), async (req, res) => {
  if (!(await requireBlueprintInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Blueprint not found' });
  }
  const blueprint = await deliverBlueprint(req.params.id);
  res.json(blueprint);
});

// --- Measurements (reusable across a customer's Blueprints) ---

router.post('/customers/:id/measurements', requireRole('associate'), async (req, res) => {
  if (!(await requireCustomerInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const measurement = await recordMeasurements(req.params.id, req.body.values, req.user.id);
  res.status(201).json(measurement);
});

// --- 6A AI Style Studio ---

router.post('/customers/:id/looks', requireRole('associate'), async (req, res) => {
  if (!(await requireCustomerInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const look = await generateLook(req.params.id, req.user.storeId, req.body);
  res.status(201).json(look);
});

router.get('/looks/:id', async (req, res) => {
  const look = await db('saved_looks').where({ id: req.params.id, store_id: req.user.storeId }).first();
  if (!look) return res.status(404).json({ error: 'Look not found' });
  res.json(look);
});

router.post('/looks/:id/save', requireRole('associate'), async (req, res) => {
  const result = await saveLook(req.params.id, req.body.customerId);
  res.json(result);
});

module.exports = router;
