import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { chatsApi, usersApi, uploadFile } from '../services/api';
import { chatTitle, formatTime, otherParticipant } from '../utils/chat';
import { useUserSearch } from '../hooks/useUserSearch';
import type { Chat } from '../types';
import Avatar from './Avatar';
import CreateGroupModal from './CreateGroupModal';

const iconButton = 'flex size-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white';

function preview(chat: Chat, myId?: string): string {
  const msg = chat.lastMessage;
  if (!msg) return 'No messages yet';
  if (msg.type === 'image') return '📷 Photo';
  if (msg.type === 'audio') return '🎤 Voice message';
  if (msg.type === 'file') return `📎 ${msg.fileName || 'File'}`;
  return (msg.sender?._id === myId ? 'You: ' : '') + msg.content;
}

export default function Sidebar({ className }: { className: string }) {
  const { user, logout, updateUser } = useAuth();
  const { chats, activeChat, openChat, addChat } = useChat();
  const search = useUserSearch();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [error, setError] = useState('');

  async function startChat(userId: string) {
    try {
      const { chat } = await chatsApi.createPrivate(userId);
      addChat(chat);
      openChat(chat._id);
      search.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the chat');
    }
  }

  async function changeAvatar(file?: File) {
    if (!file) return;
    try {
      const { url } = await uploadFile(file);
      await usersApi.updateAvatar(url);
      updateUser({ avatar: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed');
    }
  }

  return (
    <aside className={`${className} w-full shrink-0 flex-col border-r border-line bg-ink-900/80 backdrop-blur-xl md:w-80`}>
      <header className="space-y-3 border-b border-line p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <h1 className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-xl font-bold text-transparent">💬 Chats</h1>
          <div className="flex">
            <button onClick={() => setShowGroupModal(true)} className={iconButton} title="New group" aria-label="New group">
              <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
            </button>
            <button onClick={logout} className={`${iconButton} hover:text-red-400`} title="Log out" aria-label="Log out">
              <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" /></svg>
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type="search"
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Search users…"
            aria-label="Search users"
            className="w-full rounded-xl border border-line bg-ink-950 px-3 py-2 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
          {search.results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-ink-950 shadow-2xl">
              {search.results.map((u) => (
                <li key={u._id}>
                  <button onClick={() => startChat(u._id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-2">
                    <Avatar name={u.username} src={u.avatar} className="size-8 text-xs" online={u.isOnline} />
                    <span className="truncate text-sm">{u.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {search.searching && <p className="mt-2 text-xs text-slate-500">Searching…</p>}
          {search.empty && <p className="mt-2 text-xs text-slate-500">No users found</p>}
        </div>
        {(error || search.error) && (
          <p role="alert" onClick={() => setError('')} className="text-xs text-red-400">
            {error || search.error}
          </p>
        )}
      </header>

      <nav className="flex-1 overflow-y-auto" aria-label="Conversations">
        {chats.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            <span className="mb-3 block text-4xl">💬</span>
            No chats yet. Search for a user to start chatting!
          </p>
        )}
        {chats.map((chat) => {
          const active = activeChat?._id === chat._id;
          const other = otherParticipant(chat, user);
          return (
            <button
              key={chat._id}
              onClick={() => openChat(chat._id)}
              aria-current={active || undefined}
              className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition ${
                active ? 'border-violet-500 bg-violet-500/15' : 'border-transparent hover:bg-white/5'
              }`}
            >
              <Avatar name={chatTitle(chat, user)} src={other?.avatar} online={other?.isOnline} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">{chatTitle(chat, user)}</span>
                  {chat.lastMessage && <span className="shrink-0 text-xs text-slate-500">{formatTime(chat.lastMessage.createdAt)}</span>}
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className="truncate text-xs text-slate-400">{preview(chat, user?._id)}</span>
                  {chat.isGroup && <span className="ml-auto shrink-0 rounded-md bg-violet-500/20 px-1.5 text-[11px] text-violet-300">group</span>}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <footer className="flex items-center gap-3 border-t border-line bg-ink-950/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <label className="group relative cursor-pointer" title="Change photo">
          <Avatar name={user?.username ?? ''} src={user?.avatar} className="size-10 text-sm" />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-xs opacity-0 transition group-hover:opacity-100">📷</span>
          <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(e) => changeAvatar(e.target.files?.[0])} />
        </label>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{user?.username}</span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-400" /> Online
          </span>
        </span>
      </footer>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={(chat) => {
            setShowGroupModal(false);
            addChat(chat);
            openChat(chat._id);
          }}
        />
      )}
    </aside>
  );
}
