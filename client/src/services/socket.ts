import { io, type Socket } from 'socket.io-client';
import { SERVER_URL } from './api';

// One socket per signed-in session; React subscribes through SocketContext.
let socket: Socket | null = null;
const listeners = new Set<(s: Socket | null) => void>();
const notify = () => listeners.forEach((cb) => cb(socket));

export function onSocketChange(cb: (s: Socket | null) => void): () => void {
  listeners.add(cb);
  cb(socket);
  return () => listeners.delete(cb);
}

export function connectSocket(token: string): void {
  if (socket) return;
  socket = io(SERVER_URL || window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  socket.on('connect_error', (err) => console.warn('[socket]', err.message));
  notify();
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  notify();
}
