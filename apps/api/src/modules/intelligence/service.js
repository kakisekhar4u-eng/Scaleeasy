// apps/api/src/modules/intelligence/service.js
// Module 9 — AI Business Intelligence
const db = require('../../db/client');
const { generate, registerTask } = require('../../core/aiEngine');

// Read-only cross-module aggregation (Appendix F #2 exception).
async function gatherCrossModuleSignals(storeId) {
  const customers = await db('customers').where({ store_id: storeId });
  const campaigns = await db('campaigns').where({ store_id: storeId });
  const orders = await db('order_cards').where({ store_id: storeId });

  // Correctly aggregates stock per product across variants and stores —
  // products has no stock column of its own (that was a real bug caught
  // in the earlier audit: the original version filtered on p.stock,
  // which never existed and always silently returned zero).
  const lowStockProducts = await db('products')
    .join('product_variants', 'product_variants.product_id', 'products.id')
    .join('inventory_stock', 'inventory_stock.variant_id', 'product_variants.id')
    .where('products.store_id', storeId)
    .groupBy('products.id')
    .havingRaw('sum(inventory_stock.quantity) < 10')
    .select('products.id');

  const sales = await db('sales').where({ store_id: storeId });
  const last30Days = sales.filter(s => new Date(s.created_at) > new Date(Date.now() - 30 * 86400000));

  return {
    customerCount: customers.length,
    avgHealthScore: customers.length
      ? Math.round(customers.reduce((sum, c) => sum + c.health_score, 0) / customers.length)
      : null, // avoids NaN when a new store has zero customers yet
    lowStockProductCount: lowStockProducts.length,
    activeCampaignCount: campaigns.filter(c => c.status === 'live').length,
    pendingOrderCount: orders.filter(o => o.status === 'enquired').length,
    revenueLast30Days: last30Days.reduce((sum, s) => sum + Number(s.total), 0),
    salesCountLast30Days: last30Days.length
  };
}

registerTask('business_brief', {
  buildPrompt: (signals) => `Write a short, plain-language business summary (under 120 words) for a
boutique owner, based on these numbers: ${JSON.stringify(signals)}.
Lead with what needs attention most. No corporate jargon, no bullet points, just 2-3 sentences.`,

  // Zero-cost default: a template that fills in the same numbers, just
  // without natural narrative flow. Still genuinely useful, still true.
  ruleBased: (signals) => {
    const parts = [];
    parts.push(`${signals.customerCount} customers, average Health Score ${signals.avgHealthScore ?? 'N/A'}.`);
    if (signals.lowStockProductCount > 0) parts.push(`${signals.lowStockProductCount} products are low on stock.`);
    if (signals.pendingOrderCount > 0) parts.push(`${signals.pendingOrderCount} orders are awaiting follow-up.`);
    parts.push(`₹${signals.revenueLast30Days} in revenue over the last 30 days across ${signals.salesCountLast30Days} sales.`);
    return parts.join(' ');
  }
});

async function generateBusinessBrief(storeId) {
  const signals = await gatherCrossModuleSignals(storeId);
  const result = await generate('business_brief', signals, `business_brief:${storeId}:${new Date().toDateString()}`, 1440); // once per day is plenty

  const [brief] = await db('business_briefs').insert({
    store_id: storeId, content: result.text, signals, provider: result.provider
  }).returning('*');

  return brief;
}

module.exports = { gatherCrossModuleSignals, generateBusinessBrief };
