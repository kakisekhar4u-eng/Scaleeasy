// apps/api/src/core/supabaseAdmin.js
// Server-side Supabase client used ONLY for verifying auth tokens.
// Uses the service role key — backend-only, never sent to the browser.
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabaseAdmin;
