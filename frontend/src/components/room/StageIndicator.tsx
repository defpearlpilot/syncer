import React from 'react';
import { RoomStage } from '../../types';

interface Props {
  stages: RoomStage[];
  currentStageId: string | null;
}

export function StageIndicator({ stages, currentStageId }: Props) {
  const currentIdx = stages.findIndex((s) => s.id === currentStageId);

  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {stages.map((stage, idx) => {
        const isCurrent = stage.id === currentStageId;
        const isPast = idx < currentIdx;

        return (
          <React.Fragment key={stage.id}>
            {idx > 0 && (
              <div className={`w-6 h-0.5 ${isPast ? 'bg-indigo-500' : 'bg-gray-300'}`} />
            )}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                isCurrent
                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                  : isPast
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isPast && <span>&#10003;</span>}
              {stage.name}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
