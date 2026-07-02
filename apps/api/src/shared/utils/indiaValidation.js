// apps/api/src/shared/utils/indiaValidation.js
const { INDIAN_STATES } = require('../constants/indianStates');

function validateGSTIN(gstin) {
  if (!gstin || typeof gstin !== 'string') return { valid: false, error: 'GSTIN is required' };
  const cleaned = gstin.trim().toUpperCase();
  if (cleaned.length !== 15) return { valid: false, error: 'GSTIN must be 15 characters' };

  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!pattern.test(cleaned)) return { valid: false, error: 'Invalid GSTIN format' };

  const stateCode = cleaned.substring(0, 2);
  if (!INDIAN_STATES[stateCode]) return { valid: false, error: 'Invalid state code in GSTIN' };

  return { valid: true, gstin: cleaned, stateCode };
}

function validatePAN(pan) {
  if (!pan || typeof pan !== 'string') return { valid: false, error: 'PAN is required' };
  const cleaned = pan.trim().toUpperCase();
  const pattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!pattern.test(cleaned)) return { valid: false, error: 'Invalid PAN format' };
  return { valid: true, pan: cleaned };
}

function validateIndianPhone(phone) {
  if (!phone || typeof phone !== 'string') return { valid: false, error: 'Phone number is required' };
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const withoutCountry = cleaned.replace(/^\+91/, '').replace(/^91(?=\d{10}$)/, '');
  if (!/^\d{10}$/.test(withoutCountry)) return { valid: false, error: 'Indian phone must be 10 digits' };
  if (!/^[6-9]/.test(withoutCountry)) return { valid: false, error: 'Indian mobile must start with 6-9' };
  return { valid: true, phone: withoutCountry, formatted: `+91${withoutCountry}` };
}

function validatePincode(pincode) {
  if (!pincode || typeof pincode !== 'string') return { valid: false, error: 'Pincode is required' };
  const cleaned = pincode.trim();
  if (!/^\d{6}$/.test(cleaned)) return { valid: false, error: 'Pincode must be 6 digits' };
  if (cleaned[0] === '0') return { valid: false, error: 'Pincode cannot start with 0' };
  return { valid: true, pincode: cleaned };
}

function formatINR(amount) {
  const num = Number(amount);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatIndianNumber(num) {
  const n = Number(num);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-IN');
}

module.exports = {
  validateGSTIN,
  validatePAN,
  validateIndianPhone,
  validatePincode,
  formatINR,
  formatIndianNumber,
};
