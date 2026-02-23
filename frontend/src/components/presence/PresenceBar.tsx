import React from 'react';

interface PresenceUser {
  user_id: string;
  display_name: string;
}

interface Props {
  users: PresenceUser[];
  connected: boolean;
}

export function PresenceBar({ users, connected }: Props) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-500">{connected ? 'Connected' : 'Disconnected'}</span>
      </div>
      {users.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Online:</span>
          <div className="flex gap-1">
            {users.map((u) => (
              <span
                key={u.user_id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
              >
                {u.display_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
