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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-navy-800 border border-navy-700 rounded-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold mb-4">Create Group Chat</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-2 rounded-lg mb-3">
            {error}
          </div>
        )}

        {/* Group name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          className="w-full bg-navy-900 border border-navy-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500 mb-3"
        />

        {/* Selected users */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {selected.map((u) => (
              <span
                key={u._id}
                className="flex items-center gap-1 bg-blue-600/30 text-blue-300 text-xs px-2 py-1 rounded-full"
              >
                {u.username}
                <button
                  type="button"
                  onClick={() => removeUser(u._id)}
                  className="hover:text-white"
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
          className="w-full bg-navy-900 border border-navy-700 text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500 mb-2"
        />

        {searchResults.length > 0 && (
          <div className="bg-navy-900 rounded-lg border border-navy-700 max-h-32 overflow-y-auto mb-3">
            {searchResults.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => addUser(u)}
                className="w-full text-left px-3 py-2 hover:bg-navy-700 text-sm transition-colors"
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
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
