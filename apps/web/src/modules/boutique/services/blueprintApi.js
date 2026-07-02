// apps/web/src/modules/boutique/services/blueprintApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function getBlueprint(id) {
  const res = await apiFetch(`/api/blueprints/${id}`);
  if (!res.ok) throw new Error('Failed to load blueprint');
  return res.json();
}

async function finalizeBlueprint(id) {
  const res = await apiFetch(`/api/blueprints/${id}/finalize`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to finalize');
  return res.json();
}

export { getBlueprint, finalizeBlueprint };
