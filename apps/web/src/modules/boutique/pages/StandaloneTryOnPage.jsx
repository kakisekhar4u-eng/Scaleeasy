// apps/web/src/modules/boutique/pages/StandaloneTryOnPage.jsx
// Reached via scaleeasy.app/tryon/:productId directly, OR embedded on a
// store's own external website via:
//   <iframe src="https://scaleeasy.app/tryon/:productId" width="400" height="600" />
// No Scaleeasy login involved — visitor never needs an account.
import { useState, useEffect } from 'react';
import { getProduct, generateTryOn, getTryOnStatus } from '../services/tryOnApi';
import { uploadPersonPhoto } from '../services/uploadApi';

export default function StandaloneTryOnPage({ productId }) {
  const [product, setProduct] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [status, setStatus] = useState('idle'); // idle | uploading | generating | processing | ready | failed
  const [errorMessage, setErrorMessage] = useState('');
  const [resultUrl, setResultUrl] = useState('');

  useEffect(() => { getProduct(productId).then(setProduct).catch(() => {}); }, [productId]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStatus('idle');
    setErrorMessage('');
  };

  const handleGenerate = async () => {
    setErrorMessage('');
    try {
      setStatus('uploading');
      const personImageUrl = await uploadPersonPhoto(photoFile);

      setStatus('generating');
      const { lookId } = await generateTryOn(productId, personImageUrl);

      setStatus('processing');
      const poll = setInterval(async () => {
        const result = await getTryOnStatus(lookId);
        if (result.status === 'ready') {
          clearInterval(poll);
          setResultUrl(result.imageUrl);
          setStatus('ready');
        } else if (result.status === 'failed') {
          clearInterval(poll);
          setStatus('failed');
          setErrorMessage('The try-on render failed — please try a different photo.');
        }
      }, 3000);
    } catch (err) {
      setStatus('failed');
      setErrorMessage(err.message || 'Something went wrong — please try again.');
    }
  };

  if (!product) return <div className="w-full px-4 py-6 animate-pulse h-64 bg-gray-200 rounded" />;

  const busy = status === 'uploading' || status === 'generating' || status === 'processing';
  const busyLabel = { uploading: 'Uploading your photo…', generating: 'Starting render…', processing: 'Rendering your try-on…' }[status];

  return (
    <div className="w-full px-4 py-6 max-w-md mx-auto text-center">
      <h1 className="text-lg font-semibold mb-1">Try On: {product.name}</h1>
      <img src={product.primary_image_url} alt={product.name} className="w-full h-64 object-cover rounded-lg my-3" />

      {status !== 'ready' && (
        <div className="space-y-3">
          {photoPreview
            ? <img src={photoPreview} alt="Your photo" className="w-32 h-32 object-cover rounded-lg mx-auto" />
            : <p className="text-sm text-gray-600">Add a full-length photo of yourself to see how this looks on you.</p>
          }

          <label className="block w-full px-4 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer">
            {photoFile ? 'Change photo' : 'Take or choose a photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment"
              onChange={handleFileSelect} className="hidden" />
          </label>

          <button
            onClick={handleGenerate}
            disabled={!photoFile || busy}
            className="w-full px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm disabled:opacity-50"
          >
            {busy ? busyLabel : 'See it on me'}
          </button>

          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </div>
      )}

      {status === 'ready' && <img src={resultUrl} alt="Your try-on result" className="w-full rounded-lg" />}
    </div>
  );
}
