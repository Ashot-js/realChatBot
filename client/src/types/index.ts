export interface User {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: string[];
  createdAt: string;
}

export interface Chat {
  _id: string;
  name?: string;
  isGroup: boolean;
  participants: User[];
  admins: User[];
  lastMessage?: Message;
  avatar?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TypingUser {
  userId: string;
  username: string;
}
