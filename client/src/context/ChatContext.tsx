import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { chatsApi, messagesApi } from '../services/api';
import { useSocket } from './SocketContext';
import { Chat, Message, TypingUser } from '../types';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  typingUsers: TypingUser[];
  messagesLoading: boolean;
  hasMore: boolean;
  setActiveChat: (chat: Chat | null) => void;
  createPrivateChat: (userId: string) => Promise<Chat>;
  createGroupChat: (name: string, participants: string[]) => Promise<Chat>;
  loadMoreMessages: () => Promise<void>;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // ─── Load chats ────────────────────────────────────────
  const refreshChats = useCallback(async () => {
    try {
      const { data } = await chatsApi.getAll();
      setChats(data.chats);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  // ─── Load messages when activeChat changes ─────────────
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const controller = new AbortController();
    setMessagesLoading(true);
    setPage(1);

    messagesApi
      .getHistory(activeChat._id, 1)
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setMessages(data.messages);
        setHasMore(data.hasMore);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error('Failed to load messages:', err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setMessagesLoading(false);
      });

    return () => controller.abort();
  }, [activeChat?._id]);

  // ─── Active chat ref (prevents stale closures in handlers) ──
  const activeChatRef = useRef(activeChat);
  activeChatRef.current = activeChat;

  // ─── Join socket room when active chat changes ───────────
  useEffect(() => {
    if (activeChat?._id && socket) {
      socket.emit('chat:join', activeChat._id);
    }
  }, [activeChat?._id, socket]);

  // ─── Socket listeners ──────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // Update chat's lastMessage
      setChats((prev) =>
        prev.map((c) =>
          c._id === msg.chat ? { ...c, lastMessage: msg } : c
        )
      );
    };

    const handleTypingUpdate = (data: {
      chatId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      const currentChat = activeChatRef.current;
      if (data.chatId !== currentChat?._id) return;

      setTypingUsers((prev) => {
        if (data.isTyping) {
          const exists = prev.find((u) => u.userId === data.userId);
          if (exists) return prev;
          // Look up real username from active chat participants
          const participant = currentChat?.participants.find(
            (p) => p._id === data.userId
          );
          return [
            ...prev,
            { userId: data.userId, username: participant?.username || 'User' },
          ];
        }
        return prev.filter((u) => u.userId !== data.userId);
      });
    };

    const handleOnline = (data: { userId: string }) => {
      setChats((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p._id === data.userId ? { ...p, isOnline: true } : p
          ),
        }))
      );
    };

    const handleOffline = (data: { userId: string }) => {
      setChats((prev) =>
        prev.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p._id === data.userId ? { ...p, isOnline: false } : p
          ),
        }))
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('typing:update', handleTypingUpdate);
    socket.on('user:online', handleOnline);
    socket.on('user:offline', handleOffline);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('typing:update', handleTypingUpdate);
      socket.off('user:online', handleOnline);
      socket.off('user:offline', handleOffline);
    };
  }, [socket, activeChat?._id]);

  // ─── Load more ─────────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (!activeChat || !hasMore || messagesLoading) return;

    const nextPage = page + 1;
    setMessagesLoading(true);

    try {
      const { data } = await messagesApi.getHistory(activeChat._id, nextPage);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  }, [activeChat, hasMore, messagesLoading, page]);

  // ─── Join socket room ──────────────────────────────────
  const joinRoom = useCallback((chatId: string) => {
    if (socket) {
      socket.emit('chat:join', chatId);
    }
  }, [socket]);

  // ─── Create chats ──────────────────────────────────────
  const createPrivateChat = useCallback(async (userId: string): Promise<Chat> => {
    const { data } = await chatsApi.createPrivate(userId);
    const chat: Chat = data.chat;
    setChats((prev) => {
      const exists = prev.find((c) => c._id === chat._id);
      if (exists) return prev;
      return [chat, ...prev];
    });
    joinRoom(chat._id);
    return chat;
  }, [joinRoom]);

  const createGroupChat = useCallback(
    async (name: string, participants: string[]): Promise<Chat> => {
      const { data } = await chatsApi.createGroup(name, participants);
      const chat: Chat = data.chat;
      setChats((prev) => [chat, ...prev]);
      joinRoom(chat._id);
      return chat;
    },
    [joinRoom]
  );

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        typingUsers,
        messagesLoading,
        hasMore,
        setActiveChat,
        createPrivateChat,
        createGroupChat,
        loadMoreMessages,
        refreshChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider');
  return ctx;
}
