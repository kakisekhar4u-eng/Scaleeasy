// apps/web/src/App.jsx
// Interactive App Shell with side navigation for all Scaleeasy modules.
import { useState, useEffect } from 'react';
import supabase from './shared/utils/supabaseClient';
import LoginPage from './modules/auth/pages/LoginPage';
import CustomerProfilePage from './modules/customers/pages/CustomerProfilePage';
import ProductProfilePage from './modules/inventory/pages/ProductProfilePage';
import CampaignBuilderPage from './modules/marketing/pages/CampaignBuilderPage';
import PublicCatalogPage from './modules/catalog/pages/PublicCatalogPage';
import StandaloneTryOnPage from './modules/boutique/pages/StandaloneTryOnPage';
import CheckoutPage from './modules/checkout/pages/CheckoutPage';
import BlueprintPage from './modules/boutique/pages/BlueprintPage';
import OrdersListPage from './modules/orders/pages/OrdersListPage';
import ShipmentStatusPage from './modules/logistics/pages/ShipmentStatusPage';
import DashboardPage from './modules/intelligence/pages/DashboardPage';
import ConnectorsPage from './modules/connectors/pages/ConnectorsPage';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  const [tab, setTab] = useState('dashboard');
  
  // Seeded test data IDs (auto-populated for easy click-to-test)
  const [customerId, setCustomerId] = useState('26c9561f-2ff5-40d0-9be4-0eeb6068cec7');
  const [productId, setProductId] = useState('7ee0abba-8cfe-4426-890e-aa537a30599d');
  const [blueprintId, setBlueprintId] = useState('48466f65-47cd-4b0b-88f4-95b4347bb792');
  const [shipmentId, setShipmentId] = useState('85dfc87d-3332-4e05-a42a-4036d3434397');
  
  // Variant ID and quantity for testing the Checkout flow
  const [checkoutVariantId, setCheckoutVariantId] = useState('');
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);

  // Fetch product details to pre-populate the variant ID for testing the checkout flow
  useEffect(() => {
    if (session && productId) {
      fetch(`/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.variants && data.variants.length > 0) {
          setCheckoutVariantId(data.variants[0].id);
        }
      })
      .catch(err => console.log('Error fetching product variants for checkout:', err));
    }
  }, [session, productId]);

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

  // Public pages (catalog shares & standalone try-on pages)
  const catalogMatch = path.match(/^\/c\/([^/]+)$/);
  if (catalogMatch) return <PublicCatalogPage token={catalogMatch[1]} />;

  const tryonMatch = path.match(/^\/tryon\/([^/]+)$/);
  if (tryonMatch) return <StandaloneTryOnPage productId={tryonMatch[1]} />;

  if (session === undefined) {
    return <div className="w-full h-screen flex items-center justify-center text-sm text-gray-500 bg-slate-50">Loading…</div>;
  }
  
  if (session === null) {
    return <LoginPage />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: '📊' },
    { id: 'customers', label: 'Customers CRM', icon: '👥' },
    { id: 'products', label: 'Inventory Stock', icon: '📦' },
    { id: 'blueprints', label: 'Boutique Blueprints', icon: '✂️' },
    { id: 'checkout', label: 'Sales Checkout', icon: '🛒' },
    { id: 'orders', label: 'Orders List', icon: '📋' },
    { id: 'shipments', label: 'Shipment Status', icon: '🚚' },
    { id: 'campaigns', label: 'Campaign Builder', icon: '📢' },
    { id: 'connectors', label: 'App Connectors', icon: '🔌' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Side Navigation Bar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="p-6 bg-slate-950 flex items-center gap-3">
            <span className="text-xl">⭐</span>
            <h1 className="text-lg font-bold tracking-tight">Scaleeasy 2.0</h1>
          </div>
          <nav className="mt-6 px-3 space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  tab === item.id 
                    ? 'bg-[#1F4E5C] text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile and Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <p className="text-xs text-slate-400 truncate mb-2">{session.user.email}</p>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-xs font-semibold text-center text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-800 capitalize">
              {navItems.find(i => i.id === tab)?.label}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
            Active Store: Sudhe Retail Store
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'dashboard' && <DashboardPage />}

          {tab === 'customers' && (
            <div className="flex flex-col">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Testing Context</span>
                <div className="flex gap-2 items-center w-full md:w-auto">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Customer UUID:</span>
                  <input
                    type="text"
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    className="flex-1 md:w-80 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#1F4E5C] focus:outline-none"
                    placeholder="Enter Customer UUID"
                  />
                </div>
              </div>
              <CustomerProfilePage customerId={customerId} />
            </div>
          )}

          {tab === 'products' && (
            <div className="flex flex-col">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Testing Context</span>
                <div className="flex gap-2 items-center w-full md:w-auto">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Product UUID:</span>
                  <input
                    type="text"
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    className="flex-1 md:w-80 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#1F4E5C] focus:outline-none"
                    placeholder="Enter Product UUID"
                  />
                </div>
              </div>
              <ProductProfilePage productId={productId} />
            </div>
          )}

          {tab === 'blueprints' && (
            <div className="flex flex-col">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Testing Context</span>
                <div className="flex gap-2 items-center w-full md:w-auto">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Blueprint UUID:</span>
                  <input
                    type="text"
                    value={blueprintId}
                    onChange={e => setBlueprintId(e.target.value)}
                    className="flex-1 md:w-80 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#1F4E5C] focus:outline-none"
                    placeholder="Enter Blueprint UUID"
                  />
                </div>
              </div>
              <BlueprintPage blueprintId={blueprintId} />
            </div>
          )}

          {tab === 'checkout' && (
            <div className="flex flex-col">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col gap-3">
                <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Configure Sale Cart</span>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Variant UUID:</span>
                    <input
                      type="text"
                      value={checkoutVariantId}
                      onChange={e => setCheckoutVariantId(e.target.value)}
                      className="flex-1 md:w-80 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#1F4E5C] focus:outline-none"
                      placeholder="Enter Variant UUID"
                    />
                  </div>
                  <div className="flex gap-2 items-center w-full md:w-auto">
                    <span className="text-xs text-slate-500 whitespace-nowrap">Quantity:</span>
                    <input
                      type="number"
                      value={checkoutQuantity}
                      onChange={e => setCheckoutQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-20 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#1F4E5C] focus:outline-none"
                      min="1"
                    />
                  </div>
                </div>
              </div>
              {checkoutVariantId ? (
                <CheckoutPage items={[{ variantId: checkoutVariantId, quantity: checkoutQuantity }]} />
              ) : (
                <div className="p-6 text-center text-sm text-slate-500">
                  Select a product variant to begin checkout.
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && <OrdersListPage />}

          {tab === 'shipments' && (
            <div className="flex flex-col">
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 tracking-wider uppercase">Testing Context</span>
                <div className="flex gap-2 items-center w-full md:w-auto">
                  <span className="text-xs text-slate-500 whitespace-nowrap">Shipment UUID:</span>
                  <input
                    type="text"
                    value={shipmentId}
                    onChange={e => setShipmentId(e.target.value)}
                    className="flex-1 md:w-80 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono focus:ring-1 focus:ring-[#1F4E5C] focus:outline-none"
                    placeholder="Enter Shipment UUID"
                  />
                </div>
              </div>
              <ShipmentStatusPage shipmentId={shipmentId} />
            </div>
          )}

          {tab === 'campaigns' && <CampaignBuilderPage />}

          {tab === 'connectors' && <ConnectorsPage />}
        </div>
      </main>
    </div>
  );
}
