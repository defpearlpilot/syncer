import React, { useState } from 'react';
import { DecisionRoomWithStages } from '../../types';
import { Button } from '../common/Button';
import * as roomsApi from '../../api/rooms';

interface Props {
  room: DecisionRoomWithStages;
  onTransition: (room: DecisionRoomWithStages) => void;
}

export function TransitionButton({ room, onTransition }: Props) {
  const [loading, setLoading] = useState(false);

  const currentIdx = room.stages.findIndex((s) => s.id === room.current_stage_id);
  const isLastStage = currentIdx >= room.stages.length - 1;
  const nextStage = !isLastStage ? room.stages[currentIdx + 1] : null;

  if (isLastStage || !nextStage) return null;

  const handleTransition = async () => {
    setLoading(true);
    try {
      const updated = await roomsApi.transitionStage(room.id);
      onTransition(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to transition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200">
      <Button onClick={handleTransition} disabled={loading}>
        {loading ? 'Transitioning...' : `Advance to ${nextStage.name}`}
      </Button>
    </div>
  );
}
