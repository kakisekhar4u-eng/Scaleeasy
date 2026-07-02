// apps/web/src/modules/intelligence/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { getSignals, generateBrief } from '../services/intelligenceApi';

export default function DashboardPage() {
  const [signals, setSignals] = useState(null);
  const [brief, setBrief] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => { getSignals().then(setSignals).catch(() => {}); }, []);

  const handleGenerateBrief = async () => {
    setStatus('generating');
    const result = await generateBrief();
    setBrief(result);
    setStatus('idle');
  };

  if (!signals) return <div className="w-full px-4 py-6 animate-pulse h-40 bg-gray-200 rounded" />;

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto space-y-4">
      <h1 className="text-lg font-semibold">Business Overview</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Customers</p>
          <p className="text-lg font-semibold">{signals.customerCount}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Avg Health Score</p>
          <p className="text-lg font-semibold">{signals.avgHealthScore ?? '—'}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Low Stock Items</p>
          <p className="text-lg font-semibold">{signals.lowStockProductCount}</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">Revenue (30d)</p>
          <p className="text-lg font-semibold">₹{signals.revenueLast30Days}</p>
        </div>
      </div>

      {brief
        ? <p className="text-sm text-gray-700 border-t border-gray-200 pt-4">{brief.content}</p>
        : <button onClick={handleGenerateBrief} disabled={status === 'generating'}
            className="w-full px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm disabled:opacity-50">
            {status === 'generating' ? 'Generating…' : 'Generate Business Brief'}
          </button>
      }
    </div>
  );
}
