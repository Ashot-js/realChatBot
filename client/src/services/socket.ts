import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || window.location.origin;

// ─── React integration: notify components when socket changes ───
const listeners = new Set<(s: Socket | null) => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb(socket));
}

export function onSocketChange(cb: (s: Socket | null) => void): () => void {
  listeners.add(cb);
  // Immediately call with current state
  cb(socket);
  return () => {
    listeners.delete(cb);
  };
}

// ─── Public API ──────────────────────────────────────────
export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
    notifyListeners();
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    notifyListeners();
  });

  socket.on('reconnect', () => {
    console.log('[Socket] Reconnected');
    notifyListeners();
  });

  notifyListeners();
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    notifyListeners();
  }
}
