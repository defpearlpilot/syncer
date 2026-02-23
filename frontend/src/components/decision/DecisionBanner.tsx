import React, { useState } from 'react';
import { DecisionRoomWithStages, Proposal, ScoreSummary } from '../../types';
import { Button } from '../common/Button';
import * as roomsApi from '../../api/rooms';

interface Props {
  room: DecisionRoomWithStages;
  proposals: Proposal[];
  scoreSummary: ScoreSummary[];
  onDecided: (room: any) => void;
}

export function DecisionBanner({ room, proposals, scoreSummary, onDecided }: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    room.decided_proposal_id || (scoreSummary.length > 0 ? scoreSummary[0].proposal_id : '')
  );
  const [summary, setSummary] = useState(room.decision_summary || '');
  const [loading, setLoading] = useState(false);

  if (room.decided_proposal_id) {
    const decided = proposals.find((p) => p.id === room.decided_proposal_id);
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-bold text-green-800">Decision Made</h3>
        {decided && (
          <p className="text-green-700 font-medium mt-2">{decided.title}</p>
        )}
        {room.decision_summary && (
          <p className="text-green-600 text-sm mt-2">{room.decision_summary}</p>
        )}
      </div>
    );
  }

  const handleDecide = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const updated = await roomsApi.decide(room.id, selectedId, summary || undefined);
      onDecided(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to record decision');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
      <h3 className="text-lg font-bold text-amber-800 mb-4">Select the Winning Proposal</h3>
      <div className="space-y-3 mb-4">
        {scoreSummary.map((s) => (
          <label
            key={s.proposal_id}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
              selectedId === s.proposal_id
                ? 'border-amber-500 bg-amber-100'
                : 'border-gray-200 bg-white'
            }`}
          >
            <input
              type="radio"
              name="decision"
              value={s.proposal_id}
              checked={selectedId === s.proposal_id}
              onChange={() => setSelectedId(s.proposal_id)}
              className="accent-amber-600"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-900">{s.proposal_title}</span>
            </div>
            <span className="text-sm font-semibold text-indigo-600">
              {s.weighted_average.toFixed(2)}
            </span>
          </label>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Rationale (optional)</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Why this proposal was chosen..."
        />
      </div>
      <Button onClick={handleDecide} disabled={!selectedId || loading}>
        {loading ? 'Recording...' : 'Confirm Decision'}
      </Button>
    </div>
  );
}
