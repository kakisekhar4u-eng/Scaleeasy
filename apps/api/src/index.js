// apps/api/src/index.js
require('dotenv').config();
const express = require('express');
// FIXED (found by actually running the app): Express 4 does NOT
// automatically forward errors thrown inside async route handlers to
// the error-handling middleware below — without this, every async
// handler that throws just hangs the request silently instead of
// returning the friendly 500 response. This patches Express's router
// to catch that automatically. Must be required after 'express' and
// before any routes are defined.
require('express-async-errors');
const db = require('./db/client');

const customersRoutes = require('./modules/customers/routes');
const inventoryRoutes = require('./modules/inventory/routes');
const marketingRoutes = require('./modules/marketing/routes');
const catalogRoutes = require('./modules/catalog/routes');
const catalogPublicRoutes = require('./modules/catalog/publicRoutes');
const boutiquePublicRoutes = require('./modules/boutique/publicRoutes');
const logisticsWebhookRoutes = require('./modules/logistics/webhookRoutes');
const checkoutRoutes = require('./modules/checkout/routes');
const boutiqueRoutes = require('./modules/boutique/routes');
const ordersRoutes = require('./modules/orders/routes');
const logisticsRoutes = require('./modules/logistics/routes');
const intelligenceRoutes = require('./modules/intelligence/routes');
const connectorsRoutes = require('./modules/connectors/routes');
const teamRoutes = require('./modules/team/routes');
const paymentsRoutes = require('./modules/payments/routes');
const paymentWebhookRoutes = require('./modules/payments/webhookRoutes');
const whatsappRoutes = require('./modules/whatsapp/routes');
const whatsappWebhookRoutes = require('./modules/whatsapp/webhookRoutes');
const gstRoutes = require('./modules/gst/routes');
const storeCreditRoutes = require('./modules/storeCredit/routes');
const invoicesRoutes = require('./modules/invoices/routes');

const app = express();
// Captures the raw request body alongside the parsed JSON — needed for
// webhook signature verification (Ch.7A), which must hash the exact
// bytes the sender signed, not a re-serialized copy that could differ
// in whitespace/key order.
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

// Ch.7A — the ONE exception to "every route requires auth": public
// catalog links, mounted BEFORE requireAuth so they never hit it.
// Security here comes from the catalog_links token, not a login session
// (see publicRoutes.js).
app.use('/public', catalogPublicRoutes);
app.use('/public', boutiquePublicRoutes);
app.use('/webhooks', logisticsWebhookRoutes);
app.use('/webhooks', paymentWebhookRoutes);
app.use('/webhooks', whatsappWebhookRoutes);

const supabaseAdmin = require('./core/supabaseAdmin');

// Ch.7A — every authenticated API runs through requireAuth + requireStoreAccess.
// FIXED (this pass): this was previously a placeholder that trusted a
// client-supplied header with zero verification — anyone could claim to
// be any user. Now verifies the token against Supabase Auth for real.
async function requireAuth(req, res, next) {
  // Dev-only bypass, OFF by default, and impossible to enable by
  // accident: requires BOTH NODE_ENV=development AND an explicit opt-in
  // env var, so it can never silently ship to production. Useful for
  // local testing before you've wired up a real login flow.
  if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_AUTH_BYPASS === 'true') {
    const devUserId = req.headers['x-debug-user-id'];
    if (devUserId) {
      console.warn('⚠️  ALLOW_DEV_AUTH_BYPASS is active — never enable this in production.');
      req.user = { id: devUserId };
      return next();
    }
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Invalid or expired token' });

  req.user = { id: data.user.id };
  next();
}

async function requireStoreAccess(req, res, next) {
  const user = await db('users').where({ id: req.user.id }).first();
  if (!user) return res.status(403).json({ error: 'User is not linked to a store' });

  const requestedStoreId = req.headers['x-active-store-id'];
  if (requestedStoreId) {
    const membership = await db('store_memberships')
      .where({ user_id: user.id, store_id: requestedStoreId })
      .first();
    if (!membership) return res.status(403).json({ error: 'No access to requested store' });
    req.user.storeId = requestedStoreId;
    // A person's role can differ per store they're a member of (e.g. an
    // owner at Store A, just helping out as associate at Store B) — use
    // the membership's role when switching stores, not their home role.
    req.user.role = membership.role;
  } else {
    req.user.storeId = user.store_id;
    req.user.role = user.experience_mode; // home store — role comes from their primary account record
  }
  next();
}

app.use('/api', requireAuth, requireStoreAccess);

// Modules 1–8 are fully implemented. Modules 9–10 are stubbed (see each
// modules/<name>/routes.js — they currently return no routes).
app.use('/api', customersRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', marketingRoutes);
app.use('/api', catalogRoutes);
app.use('/api', checkoutRoutes);
app.use('/api', boutiqueRoutes);
app.use('/api', ordersRoutes);
app.use('/api', logisticsRoutes);
app.use('/api', intelligenceRoutes);
app.use('/api', connectorsRoutes);
app.use('/api', teamRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', whatsappRoutes);
app.use('/api', gstRoutes);
app.use('/api', storeCreditRoutes);
app.use('/api', invoicesRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' }); // Commandment 17
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Scaleeasy API listening on :${PORT}`));

// MVP background poller for tryon2buy jobs — catalog images AND try-on
// results, same "single-instance, in-process" limitation as the event
// bus (Ch.5): fine for one server, needs a real job queue (e.g. BullMQ +
// Redis) once you run more than one instance, so two instances don't
// double-poll.
const { pollCatalogImageJob } = require('./modules/catalog/service');
const { pollTryOnJob } = require('./modules/boutique/service');
setInterval(async () => {
  const pendingProducts = await db('products').where({ image_generation_status: 'processing' });
  for (const product of pendingProducts) {
    try {
      await pollCatalogImageJob(product.id, product.store_id);
    } catch (err) {
      console.error(`Catalog image poll failed for product ${product.id}`, err);
    }
  }

  const pendingLooks = await db('saved_looks').where({ status: 'processing' });
  for (const look of pendingLooks) {
    try {
      await pollTryOnJob(look.id);
    } catch (err) {
      console.error(`Try-on poll failed for look ${look.id}`, err);
    }
  }
}, 10000);
