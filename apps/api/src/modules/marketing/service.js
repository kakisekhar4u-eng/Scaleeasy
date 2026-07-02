// apps/api/src/modules/marketing/service.js
// Module 3 — AI Marketing Studio
const db = require('../../db/client');
const { emit } = require('../../core/eventBus');
const { generate, registerTask } = require('../../core/aiEngine');
const { getConnector, ConnectorNotAvailableError } = require('../../core/connectorLayer');

const CAMPAIGN_TEMPLATES = {
  win_back: [
    "We've missed you! Come by this week and enjoy 10% off your next visit.",
    "It's been a while — we've got new pieces we think you'll love. Drop in anytime.",
    "Your favorite spot has some new arrivals. Would love to see you again soon."
  ],
  new_arrival: [
    "New arrivals just in! Come take a look before the best pieces are gone.",
    "Fresh styles have landed at the store — thought of you when they came in.",
    "New collection is here. Stop by whenever you get a chance."
  ],
  festive_sale: [
    "Festive season is here — special prices this week on select pieces. See you soon!",
    "Celebrate with us — festive offers now live in store.",
    "Something special for the festive season, just for you."
  ]
};

registerTask('campaign_copy', {
  buildPrompt: (goal) => `Write a short WhatsApp message (under 300 characters) for a boutique
customer, for this campaign goal: "${goal}".
Tone: warm, personal, not salesy. No emojis. No generic "Dear Customer" openers.`,

  // Zero-cost default: a small set of pre-written, on-brand templates
  // per goal, picked at random so repeat campaigns don't feel identical.
  ruleBased: (goal) => {
    const options = CAMPAIGN_TEMPLATES[goal] || CAMPAIGN_TEMPLATES.new_arrival;
    return options[Math.floor(Math.random() * options.length)];
  }
});

async function createCampaign({ title, goal, segmentCriteria }, storeId) {
  const [campaign] = await db('campaigns').insert({
    store_id: storeId, title, goal, segment_criteria: segmentCriteria, status: 'draft'
  }).returning('*');
  return campaign;
}

// SECURITY FIX (this pass): both functions below previously fetched a
// campaign by id alone, with no store check — a user from Store A could
// generate copy for, or even publish (sending real messages and marking
// live) Store B's campaign, just by knowing/guessing its id. Fixed by
// requiring storeId to match on every fetch.
async function generateCampaignCopy(campaignId, storeId) {
  const campaign = await db('campaigns').where({ id: campaignId, store_id: storeId }).first();
  if (!campaign) throw new Error('Campaign not found');

  const result = await generate('campaign_copy', campaign.goal, `campaign_copy:${campaignId}`, 1440);

  await db('campaigns').where({ id: campaignId }).update({ message_text: result.text, updated_at: new Date() });
  return { text: result.text, provider: result.provider };
}

// v2.2: recipients are resolved from segment_criteria and inserted at
// publish time — previously nothing ever wrote to campaign_recipients,
// so attribution silently never worked.
async function resolveSegment(storeId, segmentCriteria) {
  let query = db('customers').where({ store_id: storeId }).select('id');
  if (segmentCriteria?.healthScoreBelow != null) {
    query = query.where('health_score', '<', segmentCriteria.healthScoreBelow);
  }
  if (segmentCriteria?.relationshipStrength) {
    query = query.where('relationship_strength', segmentCriteria.relationshipStrength);
  }
  const rows = await query;
  return rows.map(r => r.id);
}

// v2.2: full API -> app prefill -> file export fallback chain, so a
// campaign can still go out even if a store hasn't connected WhatsApp.
async function publishToDestination(campaign, destination, storeId) {
  try {
    const provider = await getConnector(storeId, destination);
    return await provider.send({ text: campaign.message_text });
  } catch (err) {
    if (!(err instanceof ConnectorNotAvailableError)) throw err;
  }

  try {
    const provider = await getConnector(storeId, destination);
    return await provider.prefill({ text: campaign.message_text });
  } catch (err) {
    if (!(err instanceof ConnectorNotAvailableError)) throw err;
  }

  // Last resort: hand the associate a file they can send manually.
  return { status: 'file_ready', message: 'Connector unavailable — export the recipient list and send manually.' };
}

async function publishCampaign(campaignId, destinations, storeId) {
  const campaign = await db('campaigns').where({ id: campaignId, store_id: storeId }).first();
  if (!campaign) throw new Error('Campaign not found');
  if (!campaign.message_text) throw new Error('Campaign has no message — generate or write one first');

  const recipients = await resolveSegment(storeId, campaign.segment_criteria);
  if (recipients.length > 0) {
    await db('campaign_recipients').insert(
      recipients.map(customerId => ({ campaign_id: campaignId, customer_id: customerId, sent_at: new Date() }))
    );
  }

  const results = [];
  for (const destination of destinations) {
    results.push(await publishToDestination(campaign, destination, storeId));
  }

  await db('campaigns').where({ id: campaignId }).update({ status: 'live', published_at: new Date() });
  await emit('CampaignSent', { campaignId, destinations }, 'marketing');

  return { campaign, recipientCount: recipients.length, results };
}

module.exports = { createCampaign, generateCampaignCopy, resolveSegment, publishCampaign };
