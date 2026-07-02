// apps/api/src/core/providers/tryon2buyProvider.js
// tryon2buy does TWO distinct jobs in Scaleeasy, both via the same
// submit-then-poll pattern:
//   1. generateCatalogPhoto — garment photo alone -> a clean on-model
//      catalog image. Runs automatically when any product is uploaded
//      (see modules/catalog/events.js listening for ProductCreated),
//      regardless of whether that product came through Module 2's full
//      inventory flow or any other path.
//   2. generateTryOn — a specific visitor's photo + a garment -> a
//      personalized try-on result. Used by Module 6A (logged-in
//      customers) AND the standalone/embeddable try-on widget
//      (modules/boutique/publicRoutes.js, for anonymous website visitors).
//
// HONEST NOTE: unlike core/aiEngine.js's text tasks (which default to
// free rule-based logic — see aiEngine.js), there is no realistic
// zero-cost substitute for photorealistic image rendering here. Rule-
// based logic can't generate a photo. Free public demo APIs for virtual
// try-on exist (e.g. some Hugging Face Spaces) but are rate-limited and
// unreliable — fine to experiment with, not something to build a real
// business on. tryon2buy (or whichever vendor you actually use) remains
// a real, ongoing cost for this specific feature. Budget for it
// separately from the AI_PROVIDER=rules savings elsewhere.
//
// TODO: confirm tryon2buy's actual API — endpoint names, auth method, and
// request/response shape below are placeholders until you have real API
// docs. The shape (submit -> poll for result) matches how most try-on/
// model-generation APIs work, so it should need only field-name changes
// once you have the real spec, not a rewrite.

function createClient(credentials) {
  const { apiKey, baseUrl = 'https://api.tryon2buy.com' } = credentials;

  async function submit(path, body) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`tryon2buy request failed: ${res.status}`);
    const data = await res.json();
    return { jobId: data.jobId, statusUrl: data.statusUrl };
  }

  return {
    // Product-only rendering — turns a flat-lay/ghost-mannequin photo
    // into a catalog-ready on-model image. No customer involved.
    async generateCatalogPhoto({ garmentImageUrl }) {
      return submit('/v1/catalog-render', { garment_image_url: garmentImageUrl });
    },

    // Person + garment -> personalized try-on result.
    async generateTryOn({ personImageUrl, garmentImageUrl }) {
      return submit('/v1/tryon', { person_image_url: personImageUrl, garment_image_url: garmentImageUrl });
    },

    // Shared poll endpoint for either job type above. Module service.js
    // files should call this from a background job, not inline in a
    // request handler — generation typically takes several seconds.
    async getJobResult(jobId) {
      const res = await fetch(`${baseUrl}/v1/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`tryon2buy status check failed: ${res.status}`);
      return res.json(); // expect { status: 'processing'|'completed'|'failed', imageUrl? }
    }
  };
}

// tryon2buy has no inbound webhooks in this design (poll-based instead) —
// see connectorLayer.js comment on why this export is optional.

module.exports = { createClient };
