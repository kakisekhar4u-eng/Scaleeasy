// apps/web/src/modules/customers/pages/CustomerProfilePage.jsx
import { useState, useEffect } from 'react';
import { getCustomer } from '../services/customerApi';

function SkeletonSnapshot() {
  return <div className="w-full px-4 py-6 animate-pulse space-y-3">
    <div className="h-6 bg-gray-200 rounded w-2/3" />
    <div className="h-4 bg-gray-200 rounded w-1/2" />
    <div className="h-24 bg-gray-200 rounded" />
  </div>;
}

function ErrorState({ onRetry }) {
  return <div className="w-full px-4 py-6 text-center">
    <p className="text-sm text-gray-700 mb-3">Couldn't load this customer right now.</p>
    <button onClick={onRetry} className="px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm">Retry</button>
  </div>;
}

export default function CustomerProfilePage({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setCustomer(null);
    getCustomer(customerId).then(setCustomer).catch(() => setError(true));
  };

  useEffect(load, [customerId]);

  if (error) return <ErrorState onRetry={load} />;
  if (!customer) return <SkeletonSnapshot />;

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto">
      <h1 className="text-lg font-semibold">{customer.full_name}</h1>
      <p className="text-sm text-gray-700">{customer.phone}</p>

      <div className="mt-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          customer.health_score >= 65 ? 'bg-green-500' : customer.health_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
        }`} />
        <span className="text-sm text-gray-700">{customer.health_score_reason || 'New customer'}</span>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-1">Next Best Action</h2>
        <p className="text-sm text-gray-700">
          {customer.nextBestAction?.action} — {customer.nextBestAction?.reason}
        </p>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-1">Things to Remember</h2>
        <p className="text-sm text-gray-700">
          {Array.isArray(customer.thingsToRemember) ? customer.thingsToRemember.join(' • ') : customer.thingsToRemember}
        </p>
      </div>
    </div>
  );
}
