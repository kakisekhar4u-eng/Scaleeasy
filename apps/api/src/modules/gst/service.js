// apps/api/src/modules/gst/service.js
// Reusable GST calculation service — used by checkout, boutique billing,
// invoicing, and future retail commerce engine.
const db = require('../../db/client');
const { validateGSTIN } = require('../../shared/utils/indiaValidation');

async function getStoreGSTConfig(storeId) {
  return db('store_gst_config').where({ store_id: storeId }).first();
}

async function upsertStoreGSTConfig(storeId, config) {
  const data = {
    store_id: storeId,
    gstin: config.gstin || null,
    legal_name: config.legalName || null,
    trade_name: config.tradeName || null,
    state_code: config.stateCode || '36',
    address_line1: config.addressLine1 || null,
    address_line2: config.addressLine2 || null,
    city: config.city || null,
    state: config.state || null,
    pincode: config.pincode || null,
    default_tax_inclusive: config.defaultTaxInclusive !== false,
    hsn_mandatory: config.hsnMandatory === true,
    updated_at: new Date(),
  };

  if (data.gstin) {
    const result = validateGSTIN(data.gstin);
    if (!result.valid) throw new Error(result.error);
    data.gstin = result.gstin;
  }

  const [row] = await db('store_gst_config')
    .insert(data)
    .onConflict('store_id')
    .merge(data)
    .returning('*');
  return row;
}

async function getProductGSTMapping(storeId, productId) {
  return db('product_gst_mapping')
    .where({ store_id: storeId, product_id: productId })
    .first();
}

async function setProductGSTMapping(storeId, productId, { hsnCode, gstRate, cessRate, taxInclusive }) {
  if (hsnCode) {
    const hsn = await db('hsn_master').where({ hsn_code: hsnCode, is_active: true }).first();
    if (!hsn) throw new Error(`Invalid or inactive HSN code: ${hsnCode}`);
  }

  const data = {
    store_id: storeId,
    product_id: productId,
    hsn_code: hsnCode || null,
    gst_rate: Number(gstRate),
    cess_rate: Number(cessRate || 0),
    tax_inclusive: taxInclusive !== false,
    updated_at: new Date(),
  };

  const [row] = await db('product_gst_mapping')
    .insert(data)
    .onConflict(['store_id', 'product_id'])
    .merge(data)
    .returning('*');
  return row;
}

function calculateGST(amount, gstRate, cessRate = 0, { taxInclusive = true, isInterState = false } = {}) {
  const rate = Number(gstRate);
  const cess = Number(cessRate);
  const totalRate = rate + cess;
  let taxableAmount, gstAmount, cessAmount;

  if (taxInclusive) {
    taxableAmount = Number((amount * 100 / (100 + totalRate)).toFixed(2));
    gstAmount = Number((taxableAmount * rate / 100).toFixed(2));
    cessAmount = Number((taxableAmount * cess / 100).toFixed(2));
  } else {
    taxableAmount = Number(amount);
    gstAmount = Number((taxableAmount * rate / 100).toFixed(2));
    cessAmount = Number((taxableAmount * cess / 100).toFixed(2));
  }

  const result = {
    taxableAmount,
    cessAmount,
    totalTax: gstAmount + cessAmount,
    grandTotal: taxInclusive ? Number(amount) : taxableAmount + gstAmount + cessAmount,
  };

  if (isInterState) {
    result.igst = gstAmount;
    result.cgst = 0;
    result.sgst = 0;
  } else {
    result.igst = 0;
    result.cgst = Number((gstAmount / 2).toFixed(2));
    result.sgst = Number((gstAmount - result.cgst).toFixed(2));
  }

  return result;
}

function reverseCalculateFromTotal(grandTotal, gstRate, cessRate = 0) {
  const totalRate = Number(gstRate) + Number(cessRate);
  const taxableAmount = Number((grandTotal * 100 / (100 + totalRate)).toFixed(2));
  return calculateGST(grandTotal, gstRate, cessRate, { taxInclusive: true });
}

async function calculateLineItemGST(storeId, items, customerStateCode) {
  const storeConfig = await getStoreGSTConfig(storeId);
  const sellerState = storeConfig?.state_code || '36';
  const isInterState = customerStateCode ? customerStateCode !== sellerState : false;

  const results = [];
  let totalCGST = 0, totalSGST = 0, totalIGST = 0, totalCess = 0, totalTax = 0;

  for (const item of items) {
    const mapping = await getProductGSTMapping(storeId, item.productId);
    const gstRate = mapping?.gst_rate || 0;
    const cessRate = mapping?.cess_rate || 0;
    const taxInclusive = mapping?.tax_inclusive ?? storeConfig?.default_tax_inclusive ?? true;
    const lineTotal = item.price * item.quantity;

    const gst = calculateGST(lineTotal, gstRate, cessRate, { taxInclusive, isInterState });
    totalCGST += gst.cgst;
    totalSGST += gst.sgst;
    totalIGST += gst.igst;
    totalCess += gst.cessAmount;
    totalTax += gst.totalTax;

    results.push({
      ...item,
      hsnCode: mapping?.hsn_code || null,
      gstRate,
      cessRate,
      taxInclusive,
      ...gst,
    });
  }

  return {
    lineItems: results,
    summary: {
      cgst: Number(totalCGST.toFixed(2)),
      sgst: Number(totalSGST.toFixed(2)),
      igst: Number(totalIGST.toFixed(2)),
      cess: Number(totalCess.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      isInterState,
    },
  };
}

async function searchHSN(query, limit = 20) {
  return db('hsn_master')
    .where('is_active', true)
    .where(function () {
      this.where('hsn_code', 'ilike', `${query}%`)
        .orWhere('description', 'ilike', `%${query}%`);
    })
    .orderBy('hsn_code')
    .limit(limit);
}

async function getGSTSlabs() {
  return db('gst_slabs').where({ is_active: true }).orderBy('rate');
}

module.exports = {
  getStoreGSTConfig,
  upsertStoreGSTConfig,
  getProductGSTMapping,
  setProductGSTMapping,
  calculateGST,
  reverseCalculateFromTotal,
  calculateLineItemGST,
  searchHSN,
  getGSTSlabs,
};
