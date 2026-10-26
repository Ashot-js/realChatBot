import type { Chat, User } from '../types';

/** The other person in a one-to-one chat. */
export const otherParticipant = (chat: Chat, me: User | null) =>
  chat.isGroup ? undefined : chat.participants.find((p) => p._id !== me?._id);

export const chatTitle = (chat: Chat, me: User | null) =>
  chat.isGroup ? chat.name || 'Group' : otherParticipant(chat, me)?.username || 'Unknown';

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatSize = (bytes = 0) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
