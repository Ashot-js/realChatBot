export interface User {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
}

export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'system';

export interface Message {
  _id: string;
  chat: string;
  sender: Pick<User, '_id' | 'username' | 'avatar'>;
  content: string;
  type: MessageType;
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
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
