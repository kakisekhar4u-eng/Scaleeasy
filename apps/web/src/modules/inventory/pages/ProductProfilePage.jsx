// apps/web/src/modules/inventory/pages/ProductProfilePage.jsx
import { useState, useEffect } from 'react';
import { getProduct } from '../services/productApi';

function SkeletonSnapshot() {
  return <div className="w-full px-4 py-6 animate-pulse space-y-3">
    <div className="h-6 bg-gray-200 rounded w-2/3" />
    <div className="h-40 bg-gray-200 rounded" />
  </div>;
}

function ErrorState({ onRetry }) {
  return <div className="w-full px-4 py-6 text-center">
    <p className="text-sm text-gray-700 mb-3">Couldn't load this product right now.</p>
    <button onClick={onRetry} className="px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm">Retry</button>
  </div>;
}

export default function ProductProfilePage({ productId }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    setProduct(null);
    getProduct(productId).then(setProduct).catch(() => setError(true));
  };

  useEffect(load, [productId]);

  if (error) return <ErrorState onRetry={load} />;
  if (!product) return <SkeletonSnapshot />;

  const totalStock = product.stockByStore.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto">
      <h1 className="text-lg font-semibold">{product.name}</h1>
      <p className="text-sm text-gray-700">{product.category}</p>

      <div className="mt-4 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          product.dna?.health_score >= 65 ? 'bg-green-500' : product.dna?.health_score >= 40 ? 'bg-amber-500' : 'bg-red-500'
        }`} />
        <span className="text-sm text-gray-700">{product.dna?.health_score_reason || 'Not enough data yet'}</span>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-1">Stock ({totalStock} total)</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          {product.variants.map(v => {
            const stock = product.stockByStore.filter(s => s.variant_id === v.id)
              .reduce((sum, s) => sum + s.quantity, 0);
            return <li key={v.id}>{v.size} / {v.color} — {stock} in stock — ₹{v.selling_price}</li>;
          })}
        </ul>
      </div>
    </div>
  );
}
