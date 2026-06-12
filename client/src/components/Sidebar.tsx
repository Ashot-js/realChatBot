import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import { chatsApi, usersApi } from '../services/api';
import { Chat, User } from '../types';
import CreateGroupModal from './CreateGroupModal';
import OnlineStatus from './OnlineStatus';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { chats, activeChat, setActiveChat, createPrivateChat, refreshChats } = useChatContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const [searchError, setSearchError] = useState('');

  async function handleSearch(q: string) {
    setSearchQuery(q);
    setSearchError('');
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await usersApi.search(q);
      setSearchResults(data.users);
    } catch (err: unknown) {
      setSearchResults([]);
      setSearchError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function handleStartChat(userId: string) {
    try {
      const chat = await createPrivateChat(userId);
      setSearchQuery('');
      setSearchResults([]);
      setActiveChat(chat);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Failed to start chat');
    }
  }

  function getChatName(chat: Chat): string {
    if (chat.isGroup) return chat.name || 'Group';
    const other = chat.participants.find((p) => p._id !== user?._id);
    return other?.username || 'Unknown';
  }

  function getLastMessagePreview(chat: Chat): string {
    if (!chat.lastMessage) return 'No messages yet';
    const msg = chat.lastMessage;
    if (msg.type === 'image') return '📷 Image';
    if (msg.type === 'file') return `📎 ${msg.fileName || 'File'}`;
    const prefix = msg.sender?._id === user?._id ? 'You: ' : '';
    return `${prefix}${msg.content?.slice(0, 40) || ''}`;
  }

  return (
    <div className="w-80 bg-navy-800 border-r border-navy-700 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-navy-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">💬 Chats</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGroupModal(true)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Create group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-navy-900 border border-navy-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-navy-900 rounded-lg border border-navy-700 overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map((u) => (
              <button
                key={u._id}
                onClick={() => handleStartChat(u._id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-navy-700 transition-colors text-left"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-navy-600 flex items-center justify-center text-sm font-medium">
                    {u.username[0].toUpperCase()}
                  </div>
                  <OnlineStatus isOnline={u.isOnline} />
                </div>
                <span className="text-sm">{u.username}</span>
              </button>
            ))}
          </div>
        )}

        {searching && (
          <p className="text-slate-500 text-xs mt-2">Searching...</p>
        )}
        {searchError && (
          <p className="text-red-400 text-xs mt-2">{searchError}</p>
        )}
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 && !searchQuery && (
          <p className="text-slate-500 text-sm text-center py-8">
            No chats yet. Search for a user to start chatting!
          </p>
        )}

        {chats.map((chat) => (
          <button
            key={chat._id}
            onClick={() => setActiveChat(chat)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-navy-700 transition-colors text-left ${
              activeChat?._id === chat._id ? 'bg-navy-700 border-l-2 border-blue-500' : ''
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-navy-600 flex items-center justify-center text-sm font-medium">
                {getChatName(chat)[0].toUpperCase()}
              </div>
              {!chat.isGroup && (
                <OnlineStatus
                  isOnline={
                    chat.participants.find((p) => p._id !== user?._id)?.isOnline || false
                  }
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium truncate">
                  {getChatName(chat)}
                </span>
                {chat.lastMessage && (
                  <span className="text-xs text-slate-500 shrink-0 ml-2">
                    {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {getLastMessagePreview(chat)}
              </p>
            </div>
            {chat.isGroup && (
              <span className="text-xs bg-navy-600 text-blue-300 px-1.5 py-0.5 rounded">
                group
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Current user */}
      <div className="p-3 border-t border-navy-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.username}</p>
          <p className="text-xs text-slate-400">Online</p>
        </div>
      </div>

      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={(chat) => {
            setShowGroupModal(false);
            setActiveChat(chat);
          }}
        />
      )}
    </div>
  );
}
