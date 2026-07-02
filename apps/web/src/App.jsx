// apps/web/src/App.jsx
// TODO: replace with a real router (e.g. react-router-dom) once there
// are enough pages to need one. Public pages (no login) and app pages
// (need a real Supabase session) are handled separately here.
import { useState, useEffect } from 'react';
import supabase from './shared/utils/supabaseClient';
import LoginPage from './modules/auth/pages/LoginPage';
import CustomerProfilePage from './modules/customers/pages/CustomerProfilePage';
import ProductProfilePage from './modules/inventory/pages/ProductProfilePage';
import CampaignBuilderPage from './modules/marketing/pages/CampaignBuilderPage';
import PublicCatalogPage from './modules/catalog/pages/PublicCatalogPage';
import StandaloneTryOnPage from './modules/boutique/pages/StandaloneTryOnPage';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState(undefined); // undefined = still checking, null = signed out

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Public routes (no login required) — checked before auth state matters at all.
  const catalogMatch = path.match(/^\/c\/([^/]+)$/);
  if (catalogMatch) return <PublicCatalogPage token={catalogMatch[1]} />;

  const tryonMatch = path.match(/^\/tryon\/([^/]+)$/);
  if (tryonMatch) return <StandaloneTryOnPage productId={tryonMatch[1]} />;

  // Everything below this line requires a real, signed-in session.
  if (session === undefined) return <div className="w-full px-4 py-6 text-center text-sm text-gray-600">Loading…</div>;
  if (session === null) return <LoginPage />;

  return (
    <div className="w-full px-4 py-6 text-center text-sm text-gray-600">
      Signed in. App shell and navigation not built yet.
      <br />Individual pages (Customer, Product, Campaign, etc.) exist and work — nothing routes to them yet outside this placeholder.
    </div>
  );
}
