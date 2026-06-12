import { useEffect, useRef } from 'react';
import { useChatContext } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

export default function ChatWindow() {
  const { activeChat, messages, messagesLoading, loadMoreMessages, typingUsers } = useChatContext();
  const { socket } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLen = useRef(0);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLen.current) {
      // New message arrived — scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLen.current = messages.length;
  }, [messages.length]);

  // Scroll to bottom on chat change
  useEffect(() => {
    if (activeChat) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView();
      }, 100);
    }
  }, [activeChat?._id]);

  // Mark messages as read
  useEffect(() => {
    if (activeChat && socket) {
      socket.emit('messages:read', { chatId: activeChat._id });
    }
  }, [activeChat?._id, socket, messages.length]);

  // Infinite scroll up
  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (el.scrollTop < 50 && !messagesLoading) {
      loadMoreMessages();
    }
  }

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-navy-900">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Select a conversation
          </h2>
          <p className="text-slate-400 text-sm">
            Choose a chat from the sidebar or start a new one
          </p>
        </div>
      </div>
    );
  }

  const chatName = activeChat.isGroup
    ? activeChat.name || 'Group'
    : activeChat.participants.find((p) => p._id !== user?._id)?.username || 'Chat';

  const otherParticipant = activeChat.isGroup
    ? null
    : activeChat.participants.find((p) => p._id !== user?._id);

  return (
    <div className="flex-1 flex flex-col bg-navy-900">
      {/* Header */}
      <div className="h-14 border-b border-navy-700 flex items-center px-4 gap-3 shrink-0">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-navy-600 flex items-center justify-center text-sm font-medium">
            {chatName[0].toUpperCase()}
          </div>
          {!activeChat.isGroup && otherParticipant && (
            <span
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-navy-900 ${
                otherParticipant.isOnline ? 'bg-green-500' : 'bg-slate-500'
              }`}
            />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">{chatName}</h3>
          <p className="text-xs text-slate-400">
            {activeChat.isGroup
              ? `${activeChat.participants.length} members`
              : otherParticipant?.isOnline
              ? 'Online'
              : 'Offline'}
          </p>
        </div>

        {/* Typing indicator in header */}
        {typingUsers.length > 0 && (
          <div className="ml-auto">
            <TypingIndicator usernames={typingUsers.map((u) => u.username)} />
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      >
        {messagesLoading && (
          <div className="text-center py-2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput />
    </div>
  );
}
