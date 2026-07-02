// apps/web/src/modules/logistics/pages/ShipmentStatusPage.jsx
import { useState, useEffect } from 'react';
import { getShipment } from '../services/shipmentApi';

const STATUS_LABEL = { booked: 'Booked', in_transit: 'In Transit', delivered: 'Delivered', failed: 'Failed' };

export default function ShipmentStatusPage({ shipmentId }) {
  const [shipment, setShipment] = useState(null);
  useEffect(() => { getShipment(shipmentId).then(setShipment).catch(() => {}); }, [shipmentId]);

  if (!shipment) return <div className="w-full px-4 py-6 animate-pulse h-24 bg-gray-200 rounded" />;

  return (
    <div className="w-full px-4 py-6 md:max-w-md md:mx-auto text-center">
      <p className="text-sm text-gray-600">{shipment.provider} — {shipment.tracking_id}</p>
      <p className="text-lg font-semibold mt-1">{STATUS_LABEL[shipment.status]}</p>
    </div>
  );
}
