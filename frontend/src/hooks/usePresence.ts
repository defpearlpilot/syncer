import { useCallback, useState } from 'react';

interface PresenceUser {
  user_id: string;
  display_name: string;
}

export function usePresence() {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  const handlePresenceMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'presence_sync':
        setUsers(data.payload.users || []);
        break;
      case 'user_joined':
        setUsers((prev) => {
          if (prev.some((u) => u.user_id === data.payload.user_id)) return prev;
          return [...prev, data.payload];
        });
        break;
      case 'user_left':
        setUsers((prev) => prev.filter((u) => u.user_id !== data.payload.user_id));
        break;
    }
  }, []);

  return { users, handlePresenceMessage };
}
