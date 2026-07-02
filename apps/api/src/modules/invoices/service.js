// apps/api/src/modules/invoices/service.js
// Invoice Foundation — GST-aware, format-ready (A4/thermal/PDF)
const db = require('../../db/client');
const gstService = require('../gst/service');
const { formatINR } = require('../../shared/utils/indiaValidation');

async function generateGSTInvoice(saleId, storeId, { customerGstin, format } = {}) {
  const sale = await db('sales').where({ id: saleId, store_id: storeId }).first();
  if (!sale) throw new Error('Sale not found');

  const saleItems = await db('sale_items')
    .join('product_variants', 'product_variants.id', 'sale_items.variant_id')
    .join('products', 'products.id', 'product_variants.product_id')
    .where({ 'sale_items.sale_id': saleId })
    .select(
      'sale_items.*',
      'products.id as product_id',
      'products.name as product_name',
      'product_variants.size',
      'product_variants.color',
      'product_variants.sku',
    );

  const storeConfig = await gstService.getStoreGSTConfig(storeId);
  const store = await db('stores').where({ id: storeId }).first();

  let customerStateCode = null;
  if (customerGstin) {
    customerStateCode = customerGstin.substring(0, 2);
  }

  const items = saleItems.map(item => ({
    productId: item.product_id,
    price: Number(item.price),
    quantity: item.quantity,
  }));

  const gstResult = await gstService.calculateLineItemGST(storeId, items, customerStateCode);

  const invoiceData = {
    store_id: storeId,
    invoice_type: storeConfig?.gstin ? 'tax_invoice' : 'bill_of_supply',
    format: format || 'a4',
    gstin: storeConfig?.gstin || null,
    customer_gstin: customerGstin || null,
    subtotal: gstResult.lineItems.reduce((sum, li) => sum + li.taxableAmount, 0),
    cgst: gstResult.summary.cgst,
    sgst: gstResult.summary.sgst,
    igst: gstResult.summary.igst,
    cess: gstResult.summary.cess,
    total_tax: gstResult.summary.totalTax,
    grand_total: sale.total,
  };

  await db('invoices')
    .where({ sale_id: saleId })
    .update(invoiceData);

  const invoice = await db('invoices').where({ sale_id: saleId }).first();

  return {
    invoice,
    store: {
      name: store.name,
      gstin: storeConfig?.gstin,
      legalName: storeConfig?.legal_name,
      address: [storeConfig?.address_line1, storeConfig?.address_line2, storeConfig?.city, storeConfig?.state, storeConfig?.pincode].filter(Boolean).join(', '),
      stateCode: storeConfig?.state_code,
    },
    customer: sale.customer_id ? await db('customers').where({ id: sale.customer_id }).first() : null,
    lineItems: gstResult.lineItems.map((li, idx) => ({
      ...li,
      productName: saleItems[idx].product_name,
      size: saleItems[idx].size,
      color: saleItems[idx].color,
      sku: saleItems[idx].sku,
    })),
    gstSummary: gstResult.summary,
    formattedTotal: formatINR(sale.total),
  };
}

async function getInvoiceData(saleId, storeId) {
  const invoice = await db('invoices').where({ sale_id: saleId }).first();
  if (!invoice) return null;

  const sale = await db('sales').where({ id: saleId, store_id: storeId }).first();
  if (!sale) return null;

  return {
    invoice,
    sale,
    customer: sale.customer_id ? await db('customers').where({ id: sale.customer_id }).first() : null,
    items: await db('sale_items')
      .join('product_variants', 'product_variants.id', 'sale_items.variant_id')
      .join('products', 'products.id', 'product_variants.product_id')
      .where({ 'sale_items.sale_id': saleId })
      .select('sale_items.*', 'products.name as product_name', 'product_variants.size', 'product_variants.color', 'product_variants.sku'),
  };
}

async function markShared(saleId, via) {
  await db('invoices')
    .where({ sale_id: saleId })
    .update({ shared_via: via, shared_at: new Date() });
}

function buildQRPaymentData(upiId, amount, storeName) {
  return {
    upi_url: `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR`,
    upi_id: upiId,
    amount,
  };
}

module.exports = {
  generateGSTInvoice,
  getInvoiceData,
  markShared,
  buildQRPaymentData,
};
