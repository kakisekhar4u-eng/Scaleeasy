// apps/web/src/modules/catalog/pages/PublicCatalogPage.jsx
// The ONE page in this whole app a customer opens with no login —
// reached via a link like scaleeasy.app/c/:token.
import { useState, useEffect } from 'react';
import { browseCatalog, addToWishlist, submitEnquiry } from '../services/publicCatalogApi';

export default function PublicCatalogPage({ token }) {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    browseCatalog(token).then(r => setProducts(r.products)).catch(e => setError(e.message));
  }, [token]);

  if (error) return <div className="w-full px-4 py-6 text-center text-sm text-gray-700">{error}</div>;
  if (!products) return <div className="w-full px-4 py-6 animate-pulse h-40 bg-gray-200 rounded" />;

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto">
      <h1 className="text-lg font-semibold mb-4">Browse Collection</h1>
      <div className="grid grid-cols-2 gap-3">
        {products.map(p => (
          <div key={p.id} className="border border-gray-200 rounded-lg p-3">
            {p.primary_image_url && <img src={p.primary_image_url} alt={p.name} className="w-full h-32 object-cover rounded mb-2" />}
            <p className="text-sm font-medium">{p.name}</p>
            <p className="text-xs text-gray-600 mb-2">{p.description}</p>
            <div className="flex gap-1">
              <button onClick={() => addToWishlist(token, p.id)} className="flex-1 text-xs border border-gray-300 rounded py-1">Save</button>
              <button onClick={() => submitEnquiry(token, p.id)} className="flex-1 text-xs bg-[#1F4E5C] text-white rounded py-1">Enquire</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
