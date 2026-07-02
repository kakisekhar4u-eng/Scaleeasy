// apps/web/src/modules/boutique/services/uploadApi.js
import supabase from '../../../shared/utils/supabaseClient';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Uploads a visitor's photo straight from the browser to Supabase
// Storage (not through our own server — keeps large uploads off the
// Node process) and returns a public URL tryon2buy can fetch.
async function uploadPersonPhoto(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please upload a JPG, PNG, or WebP photo.');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Photo is too large — please use one under 8MB.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage
    .from('tryon-uploads')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) throw new Error('Upload failed — please try again.');

  const { data } = supabase.storage.from('tryon-uploads').getPublicUrl(fileName);
  return data.publicUrl;
}

export { uploadPersonPhoto };
