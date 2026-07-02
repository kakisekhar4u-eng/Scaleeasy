// apps/api/src/modules/customers/service.js
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { generate, registerTask } = require('../../core/aiEngine');

function normalizePhone(phone) {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.slice(-10); // keeps last 10 digits, drops country code / leading 0
}

async function getCustomerSnapshot(customerId, storeId) {
  const customer = await db('customers').where({ id: customerId, store_id: storeId }).first();
  if (!customer) return null;
  customer.fashionDna = await db('customer_fashion_dna').where({ customer_id: customerId }).first();
  customer.tags = await db('customer_tags').where({ customer_id: customerId });
  customer.thingsToRemember = await getThingsToRemember(customerId);
  customer.nextBestAction = await getNextBestAction(customerId);
  return customer;
}

async function findOrCreateCustomer(phone, storeId) {
  const normalized = normalizePhone(phone);
  let customer = await db('customers').where({ phone: normalized, store_id: storeId }).first();
  if (!customer) {
    [customer] = await db('customers').insert({
      store_id: storeId,
      phone: normalized,
      full_name: 'Unknown',
      health_score: 50,
      relationship_strength: 'new'
    }).returning('*');
    await emit('CustomerCreated', { customerId: customer.id }, 'crm');
  }
  return customer;
}

async function updateTimeline(customerId, eventType, payload) {
  await db('customer_timeline').insert({ customer_id: customerId, event_type: eventType, payload });
  await db('customers').where({ id: customerId }).update({ last_visit_at: new Date(), updated_at: new Date() });
}

async function recalculateHealthScore(customerId) {
  const customer = await db('customers').where({ id: customerId }).first();
  const daysSinceVisit = customer.last_visit_at
    ? Math.floor((Date.now() - new Date(customer.last_visit_at)) / 86400000)
    : 999;
  const purchaseCount = await db('sales').where({ customer_id: customerId }).count().then(r => Number(r[0].count));

  let score = 50, reason;
  if (daysSinceVisit <= 30 && purchaseCount >= 3) { score = 85; reason = 'Recent visit + repeat purchases'; }
  else if (daysSinceVisit <= 30) { score = 65; reason = 'Recent visit'; }
  else if (daysSinceVisit > 60) { score = 25; reason = `No visit in ${daysSinceVisit} days`; }
  else { score = 50; reason = 'Steady — no recent change'; }

  const relationshipStrength = purchaseCount === 0 ? 'new' : purchaseCount < 3 ? 'returning' : 'loyal';

  await db('customers').where({ id: customerId }).update({
    health_score: score,
    health_score_reason: reason,
    relationship_strength: relationshipStrength,
    updated_at: new Date()
  });
}

async function promoteFashionDna(customerId, noteText) {
  const existing = await db('customer_fashion_dna').where({ customer_id: customerId }).first();
  const budgetMatch = noteText.match(/budget[:\s]+(low|mid|premium)/i);
  if (!budgetMatch) return; // not enough signal — leave DNA untouched (Ch.9 honesty rule)

  if (existing) {
    await db('customer_fashion_dna').where({ customer_id: customerId }).update({
      budget_band: budgetMatch[1].toLowerCase(), updated_at: new Date()
    });
  } else {
    await db('customer_fashion_dna').insert({ customer_id: customerId, budget_band: budgetMatch[1].toLowerCase() });
  }
}

async function getNextBestAction(customerId) {
  const customer = await db('customers').where({ id: customerId }).first();
  if (!customer.last_visit_at) return { action: 'Log this first visit', reason: 'No visit recorded yet' };
  const daysSinceVisit = Math.floor((Date.now() - new Date(customer.last_visit_at)) / 86400000);
  if (daysSinceVisit > 60) return { action: 'Send a win-back message', reason: `No visit in ${daysSinceVisit} days` };
  return { action: 'No action needed', reason: 'Customer is active' };
}

registerTask('things_to_remember', {
  buildPrompt: (notes) => `You're helping a boutique associate remember a customer.
Summarize these notes into 2-3 short, specific, useful bullet points a
salesperson could glance at before greeting them. No fluff, no repeating
the notes verbatim.

Notes:
${notes.map(n => `- ${n.note_text}`).join('\n')}`,

  // Zero-cost default: no LLM needed to be genuinely useful here — just
  // surface the most recent notes, most-recent-first, lightly trimmed.
  // Not as fluent as a real summary, but not fake either.
  ruleBased: (notes) => notes
    .slice(0, 3)
    .map(n => n.note_text.length > 80 ? n.note_text.slice(0, 77) + '...' : n.note_text)
    .join(' • ')
});

async function getThingsToRemember(customerId) {
  const notes = await db('customer_memory').where({ customer_id: customerId }).orderBy('created_at', 'desc').limit(10);
  if (notes.length === 0) return 'Not enough data yet';

  const result = await generate('things_to_remember', notes, `things_to_remember:${customerId}`, 60);
  return result.text;
}

// FIXED (this pass): signal shape now matches what Module 6 actually
// emits (favoriteCategory, from a real product lookup) instead of the
// old favoriteColors placeholder that had no real source feeding it.
async function enrichFashionDna(customerId, signal) {
  const existing = await db('customer_fashion_dna').where({ customer_id: customerId }).first();
  const preferredCategories = existing?.preferred_categories || [];
  if (signal.favoriteCategory && !preferredCategories.includes(signal.favoriteCategory)) {
    preferredCategories.push(signal.favoriteCategory);
  }
  const updates = { preferred_categories: preferredCategories, updated_at: new Date() };
  if (existing) await db('customer_fashion_dna').where({ customer_id: customerId }).update(updates);
  else await db('customer_fashion_dna').insert({ customer_id: customerId, ...updates });
}

module.exports = {
  normalizePhone, getCustomerSnapshot, findOrCreateCustomer,
  updateTimeline, recalculateHealthScore, promoteFashionDna,
  getNextBestAction, getThingsToRemember, enrichFashionDna
};
