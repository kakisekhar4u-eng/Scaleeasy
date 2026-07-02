// apps/web/src/modules/connectors/pages/ConnectorsPage.jsx
import { useState, useEffect } from 'react';
import { listConnectors, connectProvider, disconnectProvider } from '../services/connectorApi';

const STATUS_COLOR = { connected: 'bg-green-500', not_connected: 'bg-gray-300', needs_attention: 'bg-amber-500' };
const STATUS_LABEL = { connected: 'Connected', not_connected: 'Not Connected', needs_attention: 'Needs Attention' };

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState({});

  const load = () => listConnectors().then(setConnectors).catch(() => setConnectors([]));
  useEffect(load, []);

  const handleConnect = async (provider) => {
    await connectProvider(provider, { apiKey: apiKeyInput[provider] || '' });
    load();
  };

  const handleDisconnect = async (provider) => {
    await disconnectProvider(provider);
    load();
  };

  if (!connectors) return <div className="w-full px-4 py-6 animate-pulse h-40 bg-gray-200 rounded" />;

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto space-y-3">
      <h1 className="text-lg font-semibold mb-2">Connected Apps</h1>
      {connectors.map(c => (
        <div key={c.provider} className="border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium capitalize">{c.provider}</p>
            <span className="flex items-center gap-1 text-xs text-gray-600">
              <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[c.status]}`} />
              {STATUS_LABEL[c.status]}
            </span>
          </div>
          {c.status === 'connected' ? (
            <button onClick={() => handleDisconnect(c.provider)} className="text-xs text-red-600">Disconnect</button>
          ) : (
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                placeholder="API key"
                value={apiKeyInput[c.provider] || ''}
                onChange={e => setApiKeyInput({ ...apiKeyInput, [c.provider]: e.target.value })}
              />
              <button onClick={() => handleConnect(c.provider)} className="px-3 py-1 bg-[#1F4E5C] text-white rounded text-xs">
                Connect
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
