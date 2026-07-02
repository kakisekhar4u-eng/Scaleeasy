// apps/api/src/modules/customers/routes.js
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const {
  getCustomerSnapshot, findOrCreateCustomer
} = require('./service');

require('./events'); // side-effect: registers listeners (Ch.4)
const { requireRole } = require('../../core/permissions');

// SECURITY: this backend's DB connection uses DATABASE_URL (the direct
// Postgres connection), which BYPASSES Row Level Security entirely —
// that's necessary for a backend that manages every store's data, but
// it means RLS provides zero protection here. Every route below that
// touches a specific customer_id must verify that customer actually
// belongs to req.user.storeId itself — there is no automatic backstop.
// FIXED (this pass): four routes below were missing this check
// entirely, letting any authenticated user read/write another store's
// customer data just by knowing or guessing a UUID.
async function requireCustomerInStore(customerId, storeId) {
  const customer = await db('customers').where({ id: customerId, store_id: storeId }).first();
  return customer || null;
}

// GET /customers?search=&section=
router.get('/customers', async (req, res) => {
  const { search, section } = req.query;
  let query = db('customers').where({ store_id: req.user.storeId });
  if (search) {
    query = query.where(function () {
      this.where('full_name', 'ilike', `%${search}%`).orWhere('phone', 'ilike', `%${search}%`);
    });
  }
  if (section === 'needs_attention') query = query.where('health_score', '<', 40);
  const customers = await query.orderBy('updated_at', 'desc').limit(50);
  res.json(customers);
});

// GET /customers/:id — Full Snapshot
router.get('/customers/:id', async (req, res) => {
  const customer = await getCustomerSnapshot(req.params.id, req.user.storeId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// POST /customers — Create
router.post('/customers', requireRole('associate'), async (req, res) => {
  const { fullName, phone } = req.body;
  if (!fullName) return res.status(400).json({ error: 'full_name is required' });
  if (!phone || !/^\+?[\d\s-]{7,15}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone number' });

  const customer = await findOrCreateCustomer(phone, req.user.storeId);
  if (customer.full_name === 'Unknown') {
    await db('customers').where({ id: customer.id }).update({ full_name: fullName });
    customer.full_name = fullName;
  }
  res.status(201).json(customer);
});

// PATCH /customers/:id — Update
router.patch('/customers/:id', requireRole('associate'), async (req, res) => {
  const allowed = ['full_name', 'phone', 'whatsapp_id', 'preferred_associate_id'];
  const updates = {};
  for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
  updates.updated_at = new Date();

  const [customer] = await db('customers')
    .where({ id: req.params.id, store_id: req.user.storeId })
    .update(updates)
    .returning('*');
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  res.json(customer);
});

// POST /customers/:id/memory — Add memory note
router.post('/customers/:id/memory', requireRole('associate'), async (req, res) => {
  if (!(await requireCustomerInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const { noteText } = req.body;
  if (!noteText || noteText.length > 500) {
    return res.status(400).json({ error: 'note_text is required, max 500 chars' });
  }
  const [note] = await db('customer_memory').insert({
    customer_id: req.params.id,
    associate_id: req.user.id,
    note_text: noteText
  }).returning('*');

  const { emit } = require('../../core/eventBus');
  await emit('CustomerMemoryAdded', { customerId: req.params.id, noteText }, 'crm');

  res.status(201).json(note);
});

// GET /customers/:id/timeline?cursor= — Paginated timeline
router.get('/customers/:id/timeline', async (req, res) => {
  if (!(await requireCustomerInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const { cursor } = req.query;
  let query = db('customer_timeline').where({ customer_id: req.params.id }).orderBy('created_at', 'desc').limit(20);
  if (cursor) query = query.where('created_at', '<', cursor);
  const timeline = await query;
  res.json(timeline);
});

// POST/DELETE /customers/:id/tags — Add/remove tag
router.post('/customers/:id/tags', requireRole('associate'), async (req, res) => {
  if (!(await requireCustomerInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  const { tag, source } = req.body;
  const [row] = await db('customer_tags').insert({ customer_id: req.params.id, tag, source }).returning('*');
  const { emit } = require('../../core/eventBus');
  await emit('CustomerTagged', { customerId: req.params.id, tag }, 'crm');
  res.status(201).json(row);
});

router.delete('/customers/:id/tags/:tagId', requireRole('manager'), async (req, res) => {
  if (!(await requireCustomerInStore(req.params.id, req.user.storeId))) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  await db('customer_tags').where({ id: req.params.tagId, customer_id: req.params.id }).del();
  res.status(204).send();
});

module.exports = router;
