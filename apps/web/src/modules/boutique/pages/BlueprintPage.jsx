// apps/web/src/modules/boutique/pages/BlueprintPage.jsx
import { useState, useEffect } from 'react';
import { getBlueprint, finalizeBlueprint } from '../services/blueprintApi';

const STATUS_LABEL = {
  draft: 'Draft', measuring: 'Taking Measurements', stitching: 'Stitching',
  ready: 'Ready for Delivery', delivered: 'Delivered'
};

export default function BlueprintPage({ blueprintId }) {
  const [blueprint, setBlueprint] = useState(null);

  const load = () => getBlueprint(blueprintId).then(setBlueprint).catch(() => {});
  useEffect(() => { load(); }, [blueprintId]);

  if (!blueprint) return <div className="w-full px-4 py-6 animate-pulse h-40 bg-gray-200 rounded" />;

  return (
    <div className="w-full px-4 py-6 md:max-w-2xl md:mx-auto">
      <h1 className="text-lg font-semibold mb-1">{blueprint.fabric || 'Custom Garment'}</h1>
      <p className="text-sm text-gray-700 mb-4">{STATUS_LABEL[blueprint.status]}</p>

      {blueprint.style_notes && <p className="text-sm text-gray-700 mb-4">{blueprint.style_notes}</p>}

      <h2 className="text-sm font-semibold mb-2">Notes</h2>
      <ul className="text-sm text-gray-700 space-y-1 mb-4">
        {(blueprint.notes || []).map(n => <li key={n.id}>{n.note_text}</li>)}
      </ul>

      {blueprint.status !== 'ready' && blueprint.status !== 'delivered' && (
        <button
          onClick={() => finalizeBlueprint(blueprintId).then(load)}
          className="px-4 py-2 bg-[#1F4E5C] text-white rounded-lg text-sm"
        >
          Mark Ready for Delivery
        </button>
      )}
    </div>
  );
}
