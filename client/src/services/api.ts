import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ─── Users ───────────────────────────────────────────────
export const usersApi = {
  search: (q: string) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  online: () => api.get('/users/online'),
  getById: (id: string) => api.get(`/users/${id}`),
};

// ─── Chats ───────────────────────────────────────────────
export const chatsApi = {
  getAll: () => api.get('/chats'),
  getById: (id: string) => api.get(`/chats/${id}`),
  createPrivate: (userId: string) => api.post('/chats/private', { userId }),
  createGroup: (name: string, participants: string[]) =>
    api.post('/chats/group', { name, participants }),
  addParticipant: (chatId: string, userId: string) =>
    api.put(`/chats/${chatId}/participants`, { userId }),
};

// ─── Messages ────────────────────────────────────────────
export const messagesApi = {
  getHistory: (chatId: string, page = 1, limit = 50) =>
    api.get(`/messages/${chatId}?page=${page}&limit=${limit}`),
};

// ─── Upload ──────────────────────────────────────────────
export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
