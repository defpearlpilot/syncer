import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { DecisionRoom } from '../../types';
import * as roomsApi from '../../api/rooms';

interface Props {
  workspaceId: string;
}

export function Sidebar({ workspaceId }: Props) {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const [rooms, setRooms] = useState<DecisionRoom[]>([]);

  useEffect(() => {
    roomsApi.listRooms(workspaceId).then(setRooms).catch(() => {});
  }, [workspaceId]);

  const dimensionsPath = `/workspaces/${workspaceId}/dimensions`;
  const isDimensionsActive = location.pathname === dimensionsPath;

  return (
    <div className="w-56 bg-gray-50 border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Workspace</h3>
        <Link
          to={dimensionsPath}
          className={`block px-3 py-2 rounded text-sm mb-3 ${
            isDimensionsActive
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Scoring Dimensions
        </Link>

        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rooms</h3>
        <div className="space-y-1">
          {rooms.map((r) => (
            <Link
              key={r.id}
              to={`/workspaces/${workspaceId}/rooms/${r.id}`}
              className={`block px-3 py-2 rounded text-sm ${
                r.id === roomId
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {r.title}
            </Link>
          ))}
          {rooms.length === 0 && (
            <p className="text-xs text-gray-400 px-3">No rooms yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
