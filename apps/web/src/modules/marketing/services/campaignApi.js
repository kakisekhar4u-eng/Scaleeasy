// apps/web/src/modules/marketing/services/campaignApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function listCampaigns() {
  const res = await apiFetch('/api/campaigns');
  if (!res.ok) throw new Error('Failed to load campaigns');
  return res.json();
}

async function createCampaign({ title, goal, segmentCriteria }) {
  const res = await apiFetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, goal, segmentCriteria })
  });
  if (!res.ok) throw new Error('Failed to create campaign');
  return res.json();
}

async function generateCopy(campaignId) {
  const res = await apiFetch(`/api/campaigns/${campaignId}/generate-copy`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to generate copy');
  return res.json();
}

async function publishCampaign(campaignId, destinations) {
  const res = await apiFetch(`/api/campaigns/${campaignId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ destinations })
  });
  if (!res.ok) throw new Error('Failed to publish campaign');
  return res.json();
}

export { listCampaigns, createCampaign, generateCopy, publishCampaign };
