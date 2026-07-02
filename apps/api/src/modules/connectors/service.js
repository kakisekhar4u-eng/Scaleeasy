// apps/api/src/modules/connectors/service.js
// Module 10 — Connected Apps (Integration Hub)
// This module doesn't own the encryption or the getConnector() logic —
// that's core/connectorLayer.js, used by every module that needs a
// provider. This module is just the associate-facing management layer
// on top of the `connectors` table (Ch.5/7).
const db = require('../../db/client');
const { encryptCredentials, providers } = require('../../core/connectorLayer');

async function listConnectors(storeId) {
  const connected = await db('connectors').where({ store_id: storeId });
  const connectedByProvider = Object.fromEntries(connected.map(c => [c.provider, c]));

  // Shows every REGISTERED provider (even ones this store hasn't
  // connected yet), not just rows that already exist — an associate
  // should see "tryon2buy: Not Connected" as an option, not nothing.
  return Object.keys(providers).map(providerName => {
    const record = connectedByProvider[providerName];
    return {
      provider: providerName,
      status: record?.status || 'not_connected',
      lastError: record?.last_error || null,
      connectedAt: record?.connected_at || null,
      expiresAt: record?.expires_at || null
    };
  });
}

async function connectProvider(storeId, providerName, credentials) {
  if (!providers[providerName]) throw new Error(`Unknown provider: ${providerName}`);

  const encrypted = encryptCredentials(credentials);
  const [record] = await db('connectors')
    .insert({
      store_id: storeId, provider: providerName, status: 'connected',
      encrypted_credentials: encrypted, connected_at: new Date(), last_error: null
    })
    .onConflict(['store_id', 'provider'])
    .merge({ status: 'connected', encrypted_credentials: encrypted, connected_at: new Date(), last_error: null, updated_at: new Date() })
    .returning('*');

  return { provider: record.provider, status: record.status };
}

async function disconnectProvider(storeId, providerName) {
  await db('connectors').where({ store_id: storeId, provider: providerName }).update({
    status: 'not_connected', encrypted_credentials: null, updated_at: new Date()
  });
  return { provider: providerName, status: 'not_connected' };
}

module.exports = { listConnectors, connectProvider, disconnectProvider };
