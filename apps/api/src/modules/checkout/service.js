// apps/api/src/modules/checkout/service.js
// Module 5 — Billing & Invoicing (Checkout Engine)
//
// EXCEPTION NOTE: Checkout reads and decrements inventory_stock (owned
// by Module 2) directly, inside its own DB transaction, instead of
// purely emitting ProductSold and waiting for Inventory's listener to
// decrement. Preventing overselling requires the availability check and
// the decrement to be atomic with the sale itself — an async listener
// running after the sale is already paid for is structurally too late
// to stop it. Inventory still owns everything else about stock (Product
// DNA, Journey log, transfers between stores).
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { findOrCreateCustomer } = require('../customers/service');

async function calculateTotalFromDatabase(items, discount, trx = db) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one sale item is required');
  }

  let subtotal = 0;
  const lineItems = [];

  for (const item of items) {
    if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('Each item requires a valid variantId and positive integer quantity');
    }
    const variant = await trx('product_variants').where({ id: item.variantId }).select('id', 'selling_price').first();
    if (!variant) throw new Error(`Invalid variant: ${item.variantId}`);

    const price = Number(variant.selling_price);
    subtotal += price * item.quantity;
    lineItems.push({ variantId: item.variantId, quantity: item.quantity, price });
  }

  const safeDiscount = Math.max(0, Number(discount || 0));
  return { total: Math.max(0, subtotal - safeDiscount), lineItems };
}

async function generateInvoice(saleId, trx = db) {
  const count = await trx('invoices').count().then(r => Number(r[0].count));
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
  const [invoice] = await trx('invoices').insert({ sale_id: saleId, invoice_number: invoiceNumber }).returning('*');
  return invoice; // pdf_url stays null until a PDF-generation step is added — honest gap, not faked
}

async function checkSalesOpportunityAttribution(customerId, items) {
  const liveCampaign = await db('campaign_recipients')
    .join('campaigns', 'campaign_recipients.campaign_id', 'campaigns.id')
    .where({ 'campaign_recipients.customer_id': customerId, 'campaigns.status': 'live' })
    .whereNull('campaign_recipients.purchased_at')
    .first();
  if (liveCampaign) return { source: 'campaign', campaignId: liveCampaign.campaign_id };

  const variantIds = items.map(i => i.variantId);
  const openEnquiry = await db('order_cards')
    .join('product_variants', 'product_variants.product_id', 'order_cards.product_id')
    .where('order_cards.customer_id', customerId)
    .where('order_cards.status', 'enquired')
    .whereIn('product_variants.id', variantIds)
    .select('order_cards.id as orderCardId')
    .first();
  if (openEnquiry) return { source: 'catalog_enquiry', orderCardId: openEnquiry.orderCardId };

  return null;
}

async function completeSale({ items, customerPhone, paymentMode, discount }, storeId) {
  const customer = customerPhone ? await findOrCreateCustomer(customerPhone, storeId) : null;

  const { sale, invoice } = await db.transaction(async (trx) => {
    const { total, lineItems } = await calculateTotalFromDatabase(items, discount, trx);

    // Availability check + decrement, atomic with the sale itself.
    for (const item of lineItems) {
      const stockRow = await trx('inventory_stock')
        .where({ variant_id: item.variantId, store_id: storeId })
        .forUpdate() // row lock — prevents two concurrent sales from both passing the check
        .first();
      if (!stockRow || stockRow.quantity < item.quantity) {
        const err = new Error(`Insufficient stock for variant ${item.variantId}`);
        err.code = 'INSUFFICIENT_STOCK';
        throw err; // transaction rolls back — no partial sale is ever recorded
      }
      await trx('inventory_stock').where({ id: stockRow.id }).decrement('quantity', item.quantity);
    }

    const [sale] = await trx('sales').insert({
      store_id: storeId, customer_id: customer?.id, total, discount: discount || 0, payment_mode: paymentMode
    }).returning('*');

    await trx('sale_items').insert(lineItems.map(i => ({
      sale_id: sale.id, variant_id: i.variantId, quantity: i.quantity, price: i.price
    })));

    const invoice = await generateInvoice(sale.id, trx);
    return { sale, invoice };
  });

  // Events fire only after the transaction commits — a listener should
  // never react to a sale that might still be rolled back.
  for (const item of items) {
    await emit('ProductSold', { variantId: item.variantId, quantity: item.quantity }, 'checkout');
  }

  if (customer) {
    const priorSales = await db('sales').where({ customer_id: customer.id }).count().then(r => Number(r[0].count));
    if (priorSales > 1) await emit('CustomerRevisited', { customerId: customer.id }, 'checkout');
    await emit('CustomerPurchased', { customerId: customer.id, amount: sale.total }, 'checkout');

    const opportunityMatch = await checkSalesOpportunityAttribution(customer.id, items);
    if (opportunityMatch) {
      await emit('SalesOpportunityClosed', { customerId: customer.id, ...opportunityMatch }, 'checkout');
    }
  }

  return { sale, invoice };
}

module.exports = { completeSale, calculateTotalFromDatabase };
