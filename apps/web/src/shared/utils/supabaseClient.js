// apps/web/src/shared/utils/supabaseClient.js
// Browser-side Supabase client. Uses the ANON key only (never the
// service_role key — that one is backend-only and must never ship to
// the browser). Safe to expose: access is controlled by the storage
// bucket policies (see db/migrations/012_catalog_ai_rendering.sql), not
// by keeping this key secret.
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default supabase;
