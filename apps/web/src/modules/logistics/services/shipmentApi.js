// apps/web/src/modules/logistics/services/shipmentApi.js
import apiFetch from '../../../shared/utils/apiClient';
async function getShipment(id) {
  const res = await apiFetch(`/api/shipments/${id}`);
  if (!res.ok) throw new Error('Shipment not found');
  return res.json();
}

export { getShipment };
