// apps/web/src/modules/marketing/pages/CampaignBuilderPage.jsx
import { useState } from 'react';
import { createCampaign, generateCopy, publishCampaign } from '../services/campaignApi';

export default function CampaignBuilderPage() {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('win_back');
  const [campaign, setCampaign] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | generating | publishing | published

  const handleCreate = async () => {
    const created = await createCampaign({ title, goal, segmentCriteria: { healthScoreBelow: 40 } });
    setCampaign(created);
  };

  const handleGenerate = async () => {
    setStatus('generating');
    const result = await generateCopy(campaign.id);
    setMessage(result.text);
    setStatus('idle');
  };

  const handlePublish = async () => {
    setStatus('publishing');
    await publishCampaign(campaign.id, ['whatsapp']);
    setStatus('published');
  };

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto space-y-4">
      <h1 className="text-lg font-semibold">New Campaign</h1>

      {!campaign && (
        <div className="space-y-3">
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Campaign title (e.g. 'Diwali Win-Back')"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          >
            <option value="win_back">Win back inactive customers</option>
            <option value="new_arrival">Announce new arrivals</option>
            <option value="festive_sale">Festive sale</option>
          </select>
          <button onClick={handleCreate} className="px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm">
            Create Draft
          </button>
        </div>
      )}

      {campaign && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">Segment: customers with Health Score below 40</p>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm h-28"
            placeholder="Message text — tap Generate to draft with AI, or write your own"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={status === 'generating'}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
              {status === 'generating' ? 'Generating…' : 'Generate with AI'}
            </button>
            <button onClick={handlePublish} disabled={!message || status === 'publishing'}
              className="px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm disabled:opacity-50">
              {status === 'published' ? 'Published ✓' : 'Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
