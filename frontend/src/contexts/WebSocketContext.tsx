import React, { createContext, useContext } from 'react';

interface WebSocketContextValue {
  connected: boolean;
  send: (message: any) => void;
}

export const WebSocketContext = createContext<WebSocketContextValue>({
  connected: false,
  send: () => {},
});

export function useWsContext() {
  return useContext(WebSocketContext);
}

export function WebSocketProvider({
  connected,
  send,
  children,
}: WebSocketContextValue & { children: React.ReactNode }) {
  return (
    <WebSocketContext.Provider value={{ connected, send }}>
      {children}
    </WebSocketContext.Provider>
  );
}
