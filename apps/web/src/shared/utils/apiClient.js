// apps/web/src/shared/utils/apiClient.js
// Every frontend call to a /api/* (authenticated) endpoint should go
// through this, not raw fetch() — it automatically attaches the current
// user's real Supabase session token. /public/* endpoints (catalog
// links, try-on widget) don't need this; they use their own token/no
// auth at all, by design.
import supabase from './supabaseClient';

async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not signed in — please log in again.');
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'Authorization': `Bearer ${session.access_token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {})
    }
  });

  return res;
}

export default apiFetch;
