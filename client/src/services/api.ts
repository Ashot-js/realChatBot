import type { Chat, Message, User } from '../types';

/** Server origin. Empty in local dev: Vite proxies /api and /socket.io. */
export const SERVER_URL: string = import.meta.env.VITE_SOCKET_URL ?? '';

const TOKEN_KEY = 'token';
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Turns a stored file path (/api/files/...) into a URL the browser can load. */
export const fileUrl = (path: string) => (path.startsWith('/') ? SERVER_URL + path : path);

export class ApiError extends Error {}

// The free server sleeps when idle and takes up to a minute to wake up.
const TIMEOUT_MS = 90_000;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(`${SERVER_URL}/api${path}`, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new ApiError('Server is waking up (first load can take ~1 min). Please try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

type AuthResult = { user: User; token: string };

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    request<AuthResult>('/auth/register', json('POST', body)),
  login: (body: { email: string; password: string }) => request<AuthResult>('/auth/login', json('POST', body)),
  me: () => request<{ user: User }>('/auth/me'),
};

export const usersApi = {
  search: (q: string, signal?: AbortSignal) =>
    request<{ users: User[] }>(`/users/search?q=${encodeURIComponent(q)}`, { signal }),
  updateAvatar: (avatar: string) => request<{ user: User }>('/users/avatar', json('PATCH', { avatar })),
};

export const chatsApi = {
  getAll: () => request<{ chats: Chat[] }>('/chats'),
  createPrivate: (userId: string) => request<{ chat: Chat }>('/chats/private', json('POST', { userId })),
  createGroup: (name: string, participants: string[]) =>
    request<{ chat: Chat }>('/chats/group', json('POST', { name, participants })),
};

export const messagesApi = {
  getHistory: (chatId: string, page = 1, signal?: AbortSignal) =>
    request<{ messages: Message[]; hasMore: boolean }>(`/messages/${chatId}?page=${page}&limit=50`, { signal }),
};

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimetype: string;
}

export function uploadFile(file: File): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  return request<UploadResult>('/upload', { method: 'POST', body: form });
}
