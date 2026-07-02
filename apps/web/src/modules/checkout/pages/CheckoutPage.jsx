// apps/web/src/modules/checkout/pages/CheckoutPage.jsx
// Deliberately minimal (Ch.9 "simplest working implementation") — a real
// register UI needs a product/variant picker; this assumes items are
// already chosen elsewhere and passed in as a prop, and focuses on the
// part that matters most: what happens when you tap "Complete Sale".
import { useState } from 'react';
import { completeSale } from '../services/checkoutApi';

export default function CheckoutPage({ items }) {
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [status, setStatus] = useState('idle'); // idle | processing | done | error
  const [errorMessage, setErrorMessage] = useState('');
  const [receipt, setReceipt] = useState(null);

  const handleComplete = async () => {
    setStatus('processing');
    setErrorMessage('');
    try {
      const result = await completeSale({ items, customerPhone, paymentMode });
      setReceipt(result);
      setStatus('done');
    } catch (err) {
      setErrorMessage(err.message);
      setStatus('error'); // e.g. "One or more items are sold out" — a real, expected outcome, not a crash
    }
  };

  if (status === 'done') {
    return (
      <div className="w-full px-4 py-6 text-center">
        <p className="text-sm font-medium">Sale complete — {receipt.invoice.invoice_number}</p>
        <p className="text-sm text-gray-700">Total: ₹{receipt.sale.total}</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:max-w-md md:mx-auto space-y-3">
      <h1 className="text-lg font-semibold">Checkout</h1>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Customer phone (optional)"
        value={customerPhone}
        onChange={e => setCustomerPhone(e.target.value)}
      />
      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
        <option value="cash">Cash</option>
        <option value="card">Card</option>
        <option value="upi">UPI</option>
      </select>

      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        onClick={handleComplete}
        disabled={status === 'processing'}
        className="w-full px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm disabled:opacity-50"
      >
        {status === 'processing' ? 'Processing…' : 'Complete Sale'}
      </button>
    </div>
  );
}
