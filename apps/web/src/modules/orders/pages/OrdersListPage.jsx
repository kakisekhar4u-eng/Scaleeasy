// apps/web/src/modules/orders/pages/OrdersListPage.jsx
import { useState, useEffect } from 'react';
import { listOrders } from '../services/orderApi';

const STATUS_LABEL = { enquired: 'New Enquiry', confirmed: 'Confirmed', completed: 'Completed', delivered: 'Delivered' };
const STATUS_COLOR = { enquired: 'bg-amber-500', confirmed: 'bg-blue-500', completed: 'bg-green-500', delivered: 'bg-gray-400' };

export default function OrdersListPage() {
  const [orders, setOrders] = useState(null);

  useEffect(() => { listOrders().then(setOrders).catch(() => setOrders([])); }, []);

  if (!orders) return <div className="w-full px-4 py-6 animate-pulse h-40 bg-gray-200 rounded" />;
  if (orders.length === 0) return <div className="w-full px-4 py-6 text-center text-sm text-gray-600">No orders yet.</div>;

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto space-y-2">
      <h1 className="text-lg font-semibold mb-2">Orders</h1>
      {orders.map(o => (
        <div key={o.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">₹{o.total_amount} — Balance ₹{o.balance_amount}</p>
            <p className="text-xs text-gray-600">{o.source}</p>
          </div>
          <span className={`text-xs text-white px-2 py-1 rounded ${STATUS_COLOR[o.status]}`}>
            {STATUS_LABEL[o.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
