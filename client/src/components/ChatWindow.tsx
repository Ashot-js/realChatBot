import { useEffect, useLayoutEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { chatTitle, otherParticipant } from '../utils/chat';
import type { Chat } from '../types';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import Spinner from './Spinner';

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return `${names.length} people are typing`;
}

export default function ChatWindow({ chat }: { chat: Chat }) {
  const { messages, messagesLoading, hasMore, loadMoreMessages, typing, openChat } = useChat();
  const socket = useSocket();
  const { user } = useAuth();
  const scroller = useRef<HTMLDivElement>(null);
  const scrollState = useRef({ height: 0, first: '', last: '', nearBottom: true });

  const other = otherParticipant(chat, user);
  const title = chatTitle(chat, user);

  // Keep the view anchored: older messages loaded above keep the same message in view;
  // a new message scrolls down only if the reader was already at the bottom.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const prev = scrollState.current;
    const first = messages[0]?._id ?? '';
    const last = messages.at(-1)?._id ?? '';
    if (prev.first && first !== prev.first && last === prev.last) {
      el.scrollTop += el.scrollHeight - prev.height;
    } else if (last !== prev.last && (prev.nearBottom || !prev.last || messages.at(-1)?.sender._id === user?._id)) {
      el.scrollTop = el.scrollHeight;
    }
    scrollState.current = { ...prev, height: el.scrollHeight, first, last };
  }, [messages, user?._id]);

  // The list gets shorter when the phone keyboard opens; keep the latest message in view.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (scrollState.current.nearBottom) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (socket && messages.length) socket.emit('messages:read', { chatId: chat._id });
  }, [socket, chat._id, messages.length]);

  function handleScroll() {
    const el = scroller.current!;
    scrollState.current.nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 60 && hasMore && !messagesLoading) loadMoreMessages();
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-ink-900/80 px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <button
          onClick={() => openChat(null)}
          className="flex size-10 items-center justify-center rounded-xl text-slate-300 hover:bg-white/5 md:hidden"
          aria-label="Back to chats"
        >
          <svg className="size-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <Avatar name={title} src={other?.avatar} className="size-10 text-sm" online={other?.isOnline} />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          <p className="truncate text-xs text-slate-400">
            {typing.length > 0 ? (
              <span className="text-violet-300">{typingText(typing)}…</span>
            ) : chat.isGroup ? (
              `${chat.participants.length} members`
            ) : other?.isOnline ? (
              <span className="text-emerald-400">Online</span>
            ) : (
              'Offline'
            )}
          </p>
        </div>
      </header>

      <div
        ref={scroller}
        onScroll={handleScroll}
        // Images grow the list after they load; stay pinned to the bottom if we were there.
        onLoadCapture={() => {
          if (scrollState.current.nearBottom) scroller.current!.scrollTop = scroller.current!.scrollHeight;
        }}
        className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6">
        {messagesLoading && (
          <div className="flex justify-center py-2">
            <Spinner />
          </div>
        )}
        {!messagesLoading && messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">No messages yet — say hi 👋</p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={msg._id} message={msg} showSender={chat.isGroup && messages[i - 1]?.sender._id !== msg.sender._id} />
        ))}
        {typing.length > 0 && (
          <div className="flex gap-1 px-2 py-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-1.5 animate-typing rounded-full bg-violet-400" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

      <MessageInput chatId={chat._id} />
    </section>
  );
}
