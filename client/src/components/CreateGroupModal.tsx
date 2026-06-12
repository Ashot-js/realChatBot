import { useState } from 'react';
import { usersApi } from '../services/api';
import { useChatContext } from '../context/ChatContext';
import { Chat, User } from '../types';

interface Props {
  onClose: () => void;
  onCreated: (chat: Chat) => void;
}

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const { createGroupChat } = useChatContext();
  const [name, setName] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(q: string) {
    setSearchQ(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await usersApi.search(q);
      setSearchResults(
        data.users.filter((u: User) => !selected.find((s) => s._id === u._id))
      );
    } catch {
      setSearchResults([]);
    }
  }

  function addUser(u: User) {
    setSelected((prev) => [...prev, u]);
    setSearchQ('');
    setSearchResults([]);
  }

  function removeUser(id: string) {
    setSelected((prev) => prev.filter((u) => u._id !== id));
  }

  async function handleCreate() {
    if (!name.trim() || selected.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const chat = await createGroupChat(
        name.trim(),
        selected.map((u) => u._id)
      );
      onCreated(chat);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create group';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-violet-500/10 animate-slide-up">
        <h2 className="text-lg font-bold mb-4">
          <span className="gradient-text">Create Group Chat</span>
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-3 animate-fade-in">
            {error}
          </div>
        )}

        {/* Group name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full bg-dark-900 border border-surface-lighter text-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500 mb-3"
        />

        {/* Selected users */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selected.map((u) => (
              <span
                key={u._id}
                className="flex items-center gap-1.5 bg-violet-500/20 text-violet-300 text-xs px-2.5 py-1 rounded-full"
              >
                {u.username}
                <button
                  type="button"
                  onClick={() => removeUser(u._id)}
                  className="hover:text-white transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* User search */}
        <input
          type="text"
          value={searchQ}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users to add..."
          className="w-full bg-dark-900 border border-surface-lighter text-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-slate-500 mb-2"
        />

        {searchResults.length > 0 && (
          <div className="bg-dark-900 rounded-xl border border-surface-lighter max-h-36 overflow-y-auto mb-3">
            {searchResults.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => addUser(u)}
                className="w-full text-left px-3 py-2.5 hover:bg-surface-light text-sm text-slate-200 transition-colors"
              >
                {u.username}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || selected.length === 0 || loading}
            className="px-5 py-2 text-sm bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
