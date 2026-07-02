// apps/api/src/modules/boutique/service.js
// Module 6 — Boutique Experience Engine (+ 6A AI Style Studio)
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { getConnector, ConnectorNotAvailableError } = require('../../core/connectorLayer');

// --- Garment Blueprints ---

async function createBlueprint({ customerId, productId, fabric, styleNotes, targetDeliveryDate }, storeId) {
  const [blueprint] = await db('garment_blueprints').insert({
    store_id: storeId, customer_id: customerId, product_id: productId,
    fabric, style_notes: styleNotes, target_delivery_date: targetDeliveryDate, status: 'draft'
  }).returning('*');
  return blueprint;
}

async function addBlueprintNote(blueprintId, noteText, associateId) {
  const [note] = await db('blueprint_notes').insert({
    blueprint_id: blueprintId, associate_id: associateId, note_text: noteText
  }).returning('*');
  return note;
}

async function recordMeasurements(customerId, values, takenBy) {
  const [measurement] = await db('measurements').insert({ customer_id: customerId, values, taken_by: takenBy }).returning('*');
  return measurement;
}

// Automation: moving a blueprint to 'ready' announces itself — Orders
// (Module 7, once built) syncs the linked order's status from this,
// same pattern as every other cross-module handoff in this app. Nothing
// here needs to know Module 7 exists.
async function finalizeDesign(blueprintId) {
  const [blueprint] = await db('garment_blueprints').where({ id: blueprintId }).update({
    status: 'ready', updated_at: new Date()
  }).returning('*');
  await emit('BlueprintFinalized', { blueprintId, customerId: blueprint.customer_id }, 'boutique');
  return blueprint;
}

async function deliverBlueprint(blueprintId) {
  const [blueprint] = await db('garment_blueprints').where({ id: blueprintId }).update({
    status: 'delivered', updated_at: new Date()
  }).returning('*');
  await emit('BlueprintDelivered', { blueprintId, customerId: blueprint.customer_id }, 'boutique');
  return blueprint;
}

// --- 6A AI Style Studio (try-on) ---

async function generateLook(customerId, storeId, { productId, personImageUrl, garmentImageUrl }) {
  let tryon2buy;
  try {
    tryon2buy = await getConnector(storeId, 'tryon2buy');
  } catch (err) {
    if (err instanceof ConnectorNotAvailableError) {
      return { status: 'unavailable', message: 'Try-on isn\'t connected for this store yet.' };
    }
    throw err;
  }

  const { jobId } = await tryon2buy.generateTryOn({ personImageUrl, garmentImageUrl });

  const [look] = await db('saved_looks').insert({
    customer_id: customerId, product_id: productId, store_id: storeId,
    status: 'processing', provider_job_id: jobId
  }).returning('*');

  return look; // frontend polls GET /looks/:id until status is 'ready'
}

// FIXED (this pass): Module 1's events.js has listened for LookTried
// since it was first built, to feed Fashion DNA (Ch.9) — but nothing
// ever emitted it, so that listener has been dead code this whole time.
// Fires only for logged-in customers; anonymous widget visitors
// (no customer_id) have no Fashion DNA to enrich.
async function pollTryOnJob(lookId) {
  const look = await db('saved_looks').where({ id: lookId }).first();
  if (!look || look.status !== 'processing') return;

  const tryon2buy = await getConnector(look.store_id, 'tryon2buy');
  const result = await tryon2buy.getJobResult(look.provider_job_id);

  if (result.status === 'completed') {
    await db('saved_looks').where({ id: lookId }).update({
      status: 'ready', result_image_url: result.imageUrl, updated_at: new Date()
    });
    if (look.customer_id) {
      await emit('LookTried', { customerId: look.customer_id, productId: look.product_id }, 'boutique');
    }
  } else if (result.status === 'failed') {
    await db('saved_looks').where({ id: lookId }).update({ status: 'failed', updated_at: new Date() });
  }
}

// A customer explicitly favoriting a result — deliberately a manual
// action (a "save" button), not automated, since not every generated
// look should count as a preference signal.
async function saveLook(lookId, customerId) {
  const look = await db('saved_looks').where({ id: lookId, customer_id: customerId }).first();
  if (!look) throw new Error('Look not found');
  await emit('LookSaved', { customerId, lookId, productId: look.product_id }, 'boutique');
  return { status: 'saved' };
}

module.exports = {
  createBlueprint, addBlueprintNote, recordMeasurements, finalizeDesign, deliverBlueprint,
  generateLook, pollTryOnJob, saveLook
};
