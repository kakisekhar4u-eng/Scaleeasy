// apps/api/src/core/connectorLayer.js
const crypto = require('crypto');
const db = require('../db/client');

class ConnectorNotAvailableError extends Error {
  constructor(providerName, reason = 'not_connected') {
    super(`${providerName} connector is not available: ${reason}`);
    this.name = 'ConnectorNotAvailableError';
    this.providerName = providerName;
    this.reason = reason;
  }
}

// Providers are added as you build them — start empty and require() each
// one here as it's implemented (whatsapp, tally, razorpay).
const providers = {
  tryon2buy: require('./providers/tryon2buyProvider'),
  bluedart: require('./providers/bluedartProvider'),
  razorpay: require('./providers/razorpayProvider'),
  stripe: require('./providers/stripeIndiaProvider'),
  whatsapp_meta: require('./providers/whatsappMetaProvider'),
  whatsapp_msg91: require('./providers/whatsappMsg91Provider'),
  whatsapp_exotel: require('./providers/whatsappExotelProvider'),
};

function getEncryptionKey() {
  if (!process.env.CONNECTOR_ENCRYPTION_KEY) {
    throw new Error('CONNECTOR_ENCRYPTION_KEY is required');
  }
  return crypto.createHash('sha256').update(process.env.CONNECTOR_ENCRYPTION_KEY).digest();
}

function encryptCredentials(credentials) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const plaintext = JSON.stringify(credentials);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptCredentials(encryptedCredentials) {
  const raw = Buffer.from(encryptedCredentials, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  return JSON.parse(plaintext);
}

async function getConnector(storeId, providerName) {
  const provider = providers[providerName];
  if (!provider) throw new ConnectorNotAvailableError(providerName, 'provider_not_registered');

  const record = await db('connectors').where({ store_id: storeId, provider: providerName }).first();
  if (!record) throw new ConnectorNotAvailableError(providerName, 'not_connected');
  if (record.status !== 'connected') throw new ConnectorNotAvailableError(providerName, record.status);
  if (record.expires_at && new Date(record.expires_at) <= new Date()) {
    await db('connectors').where({ id: record.id }).update({
      status: 'needs_attention',
      last_error: 'Token expired',
      updated_at: new Date()
    });
    throw new ConnectorNotAvailableError(providerName, 'token_expired');
  }

  const credentials = decryptCredentials(record.encrypted_credentials);
  return provider.createClient(credentials);
}

module.exports = {
  getConnector,
  encryptCredentials,
  decryptCredentials,
  ConnectorNotAvailableError,
  providers
};
