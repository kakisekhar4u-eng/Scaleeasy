// apps/web/src/modules/connectors/services/connectorApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function listConnectors() {
  const res = await apiFetch('/api/connectors');
  if (!res.ok) throw new Error('Failed to load connectors');
  return res.json();
}

async function connectProvider(provider, credentials) {
  const res = await apiFetch(`/api/connectors/${provider}/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to connect');
  return res.json();
}

async function disconnectProvider(provider) {
  const res = await apiFetch(`/api/connectors/${provider}/disconnect`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to disconnect');
  return res.json();
}

export { listConnectors, connectProvider, disconnectProvider };
