// apps/api/src/shared/utils/logger.js
// Deliberately minimal per Ch.9 "simplest working implementation" rule.
// Never logs plaintext credentials, tokens, or payment info (Ch.7A).
module.exports = {
  info: (...args) => console.log('[info]', ...args),
  warn: (...args) => console.warn('[warn]', ...args),
  error: (...args) => console.error('[error]', ...args)
};
