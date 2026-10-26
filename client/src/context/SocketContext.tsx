import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { onSocketChange } from '../services/socket';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  useEffect(() => onSocketChange(setSocket), []);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
