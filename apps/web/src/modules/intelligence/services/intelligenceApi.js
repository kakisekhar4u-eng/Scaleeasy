// apps/web/src/modules/intelligence/services/intelligenceApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function getSignals() {
  const res = await apiFetch('/api/signals');
  if (!res.ok) throw new Error('Failed to load signals');
  return res.json();
}

async function generateBrief() {
  const res = await apiFetch('/api/business-brief', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate brief');
  return res.json();
}

export { getSignals, generateBrief };
