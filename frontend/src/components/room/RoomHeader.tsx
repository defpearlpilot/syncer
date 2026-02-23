import React from 'react';
import { DecisionRoomWithStages } from '../../types';

interface Props {
  room: DecisionRoomWithStages;
}

export function RoomHeader({ room }: Props) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">{room.title}</h1>
      {room.description && (
        <p className="text-sm text-gray-500 mt-1">{room.description}</p>
      )}
    </div>
  );
}
