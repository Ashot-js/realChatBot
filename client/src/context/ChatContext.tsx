import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { chatsApi, messagesApi } from '../services/api';
import { useSocket } from './SocketContext';
import type { Chat, Message } from '../types';

interface History {
  chatId: string | null;
  messages: Message[];
  page: number;
  hasMore: boolean;
  loading: boolean;
}

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  messagesLoading: boolean;
  hasMore: boolean;
  /** Usernames currently typing in the active chat. */
  typing: string[];
  openChat: (chatId: string | null) => void;
  addChat: (chat: Chat) => void;
  loadMoreMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

const byRecent = (a: Chat, b: Chat) =>
  (b.lastMessage?.createdAt ?? b.updatedAt).localeCompare(a.lastMessage?.createdAt ?? a.updatedAt);

const EMPTY: History = { chatId: null, messages: [], page: 1, hasMore: false, loading: false };

/** Mounted only while signed in (keyed by user id), so state never leaks between accounts. */
export function ChatProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [history, setHistory] = useState<History>(EMPTY);
  // chatId → userId → username
  const [typingByChat, setTypingByChat] = useState<Record<string, Record<string, string>>>({});

  const addChat = useCallback((chat: Chat) => {
    setChats((prev) => [chat, ...prev.filter((c) => c._id !== chat._id)].sort(byRecent));
  }, []);

  const refreshChats = useCallback(() => {
    chatsApi
      .getAll()
      .then(({ chats }) => setChats(chats))
      .catch((err) => console.warn('Failed to load chats:', err));
  }, []);

  useEffect(refreshChats, [refreshChats]);

  // First page of history whenever another chat is opened. Until it arrives,
  // history.chatId differs from activeChatId and the window shows a spinner.
  useEffect(() => {
    if (!activeChatId) return;
    const controller = new AbortController();
    messagesApi
      .getHistory(activeChatId, 1, controller.signal)
      .then(({ messages, hasMore }) => setHistory({ chatId: activeChatId, messages, page: 1, hasMore, loading: false }))
      .catch(() => !controller.signal.aborted && setHistory({ ...EMPTY, chatId: activeChatId }));
    return () => controller.abort();
  }, [activeChatId]);

  const loadMoreMessages = useCallback(async () => {
    const { chatId, page, hasMore, loading } = history;
    if (!chatId || !hasMore || loading) return;
    setHistory((h) => ({ ...h, loading: true }));
    try {
      const older = await messagesApi.getHistory(chatId, page + 1);
      setHistory((h) =>
        h.chatId === chatId
          ? { ...h, messages: [...older.messages, ...h.messages], page: page + 1, hasMore: older.hasMore, loading: false }
          : h,
      );
    } catch {
      setHistory((h) => ({ ...h, loading: false }));
    }
  }, [history]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg: Message) => {
      setHistory((h) =>
        h.chatId === msg.chat && !h.messages.some((m) => m._id === msg._id) ? { ...h, messages: [...h.messages, msg] } : h,
      );
      setChats((prev) => {
        if (!prev.some((c) => c._id === msg.chat)) {
          refreshChats(); // a chat we have not loaded yet
          return prev;
        }
        return prev.map((c) => (c._id === msg.chat ? { ...c, lastMessage: msg } : c)).sort(byRecent);
      });
    };

    const onTyping = ({ chatId, userId, isTyping }: { chatId: string; userId: string; isTyping: boolean }) => {
      setTypingByChat((prev) => {
        const current = { ...prev[chatId] };
        if (isTyping) {
          const name = chats.find((c) => c._id === chatId)?.participants.find((p) => p._id === userId)?.username;
          current[userId] = name ?? 'Someone';
        } else {
          delete current[userId];
        }
        return { ...prev, [chatId]: current };
      });
    };

    const setOnline = (isOnline: boolean) => ({ userId }: { userId: string }) =>
      setChats((prev) =>
        prev.map((c) => ({ ...c, participants: c.participants.map((p) => (p._id === userId ? { ...p, isOnline } : p)) })),
      );
    const onOnline = setOnline(true);
    const onOffline = setOnline(false);

    socket.on('message:new', onMessage);
    socket.on('chat:new', addChat);
    socket.on('typing:update', onTyping);
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);
    socket.on('connect', refreshChats); // catch up after a reconnect
    return () => {
      socket.off('message:new', onMessage);
      socket.off('chat:new', addChat);
      socket.off('typing:update', onTyping);
      socket.off('user:online', onOnline);
      socket.off('user:offline', onOffline);
      socket.off('connect', refreshChats);
    };
  }, [socket, chats, addChat, refreshChats]);

  const isActive = history.chatId === activeChatId;
  const value: ChatContextType = {
    chats,
    activeChat: chats.find((c) => c._id === activeChatId) ?? null,
    messages: isActive ? history.messages : [],
    messagesLoading: !isActive || history.loading,
    hasMore: isActive && history.hasMore,
    typing: Object.values((activeChatId && typingByChat[activeChatId]) || {}),
    openChat: setActiveChatId,
    addChat,
    loadMoreMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
