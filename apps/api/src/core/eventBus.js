// apps/api/src/core/eventBus.js
// In-process pub/sub. See Handbook Ch. 5.
// KNOWN LIMITATION (documented, not a bug): synchronous, in-process only —
// not a message queue. Failed handlers are recorded in `failed_events`
// but nothing auto-replays them yet (v2.2).

const db = require('../db/client');
const logger = require('../shared/utils/logger');

const listeners = {}; // {'CustomerPurchased': [fn1, fn2, ...]}

function on(eventType, handlerFn) {
  if (!listeners[eventType]) listeners[eventType] = [];
  listeners[eventType].push(handlerFn);
}

async function emit(eventType, payload, emittedBy) {
  // 1. Always persist the event first (source of truth)
  const [eventRow] = await db('events').insert({
    event_type: eventType,
    payload,
    emitted_by: emittedBy
  }).returning('*');

  // 2. Notify any listeners
  const handlers = listeners[eventType] || [];
  for (const handler of handlers) {
    try {
      await handler(payload);
    } catch (err) {
      logger.error(`Event handler failed for ${eventType}`, err);
      await db('failed_events').insert({
        event_id: eventRow.id,
        event_type: eventType,
        payload,
        error_message: String(err.message || err),
        retry_count: 0,
        created_at: new Date()
      });
    }
  }
}

module.exports = { on, emit };
