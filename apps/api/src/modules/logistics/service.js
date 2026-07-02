// apps/api/src/modules/logistics/service.js
// Module 8 — Multi-Carrier Logistics
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { getConnector, ConnectorNotAvailableError } = require('../../core/connectorLayer');

// SECURITY FIX (this pass): previously attached a shipment to any
// orderId with no check that it belongs to the calling store — someone
// could book a real shipment (on their own carrier account) against
// another store's order, corrupting that order's lifecycle once it's
// later marked delivered via webhook.
async function bookShipment(orderId, provider, { address, weight }, storeId) {
  const order = await db('order_cards').where({ id: orderId, store_id: storeId }).first();
  if (!order) throw new Error('Order not found');

  let carrier;
  try {
    carrier = await getConnector(storeId, provider);
  } catch (err) {
    if (err instanceof ConnectorNotAvailableError) {
      throw new Error(`${provider} isn't connected for this store yet.`);
    }
    throw err;
  }

  const { trackingId } = await carrier.createShipment({ orderId, address, weight });

  const [shipment] = await db('shipments').insert({
    store_id: storeId, order_id: orderId, provider, tracking_id: trackingId, status: 'booked'
  }).returning('*');

  await emit('ShipmentBooked', { shipmentId: shipment.id, orderId }, 'logistics'); // producer-only, by design (Ch.9)
  return shipment;
}

module.exports = { bookShipment };
