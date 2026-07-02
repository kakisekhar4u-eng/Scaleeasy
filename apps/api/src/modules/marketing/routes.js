// apps/api/src/modules/marketing/routes.js
// Module 3 — AI Marketing Studio
const express = require('express');
const router = express.Router();
const db = require('../../db/client');
const { createCampaign, generateCampaignCopy, publishCampaign } = require('./service');

require('./events'); // side-effect: registers listeners (Ch.4)
const { requireRole } = require('../../core/permissions');

// GET /campaigns
router.get('/campaigns', async (req, res) => {
  const campaigns = await db('campaigns').where({ store_id: req.user.storeId }).orderBy('updated_at', 'desc');
  res.json(campaigns);
});

// GET /campaigns/:id — includes recipient/conversion counts
router.get('/campaigns/:id', async (req, res) => {
  const campaign = await db('campaigns').where({ id: req.params.id, store_id: req.user.storeId }).first();
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  const recipients = await db('campaign_recipients').where({ campaign_id: campaign.id });
  campaign.recipientCount = recipients.length;
  campaign.conversionCount = recipients.filter(r => r.purchased_at).length;

  res.json(campaign);
});

// POST /campaigns — Create draft
router.post('/campaigns', requireRole('manager'), async (req, res) => {
  const { title, goal, segmentCriteria } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const campaign = await createCampaign({ title, goal, segmentCriteria }, req.user.storeId);
  res.status(201).json(campaign);
});

// POST /campaigns/:id/generate-copy — AI-drafted message text
router.post('/campaigns/:id/generate-copy', requireRole('manager'), async (req, res) => {
  try {
    const result = await generateCampaignCopy(req.params.id, req.user.storeId);
    res.json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// POST /campaigns/:id/publish
router.post('/campaigns/:id/publish', requireRole('manager'), async (req, res) => {
  try {
    const result = await publishCampaign(req.params.id, req.body.destinations || [], req.user.storeId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
