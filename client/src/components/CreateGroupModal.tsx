import { useEffect, useState } from 'react';
import { chatsApi } from '../services/api';
import { useUserSearch } from '../hooks/useUserSearch';
import type { Chat, User } from '../types';
import Avatar from './Avatar';

interface Props {
  onClose: () => void;
  onCreated: (chat: Chat) => void;
}

const inputClass =
  'w-full rounded-xl border border-line bg-ink-950 px-4 py-2.5 text-base text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';

const MIN_MEMBERS = 2;

export default function CreateGroupModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const search = useUserSearch(selected.map((u) => u._id));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function create() {
    setBusy(true);
    setError('');
    try {
      const { chat } = await chatsApi.createGroup(name.trim(), selected.map((u) => u._id));
      onCreated(chat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      setBusy(false);
    }
  }

  const ready = name.trim() !== '' && selected.length >= MIN_MEMBERS && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="group-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-slide-up rounded-t-3xl border border-line bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
      >
        <h2 id="group-title" className="mb-4 bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-lg font-bold text-transparent">
          New group
        </h2>

        {error && <p role="alert" className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Group name" aria-label="Group name" className={`${inputClass} mb-3`} />

        {selected.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selected.map((u) => (
              <button
                key={u._id}
                onClick={() => setSelected(selected.filter((s) => s._id !== u._id))}
                className="flex items-center gap-1.5 rounded-full bg-violet-500/20 px-2.5 py-1 text-xs text-violet-200 hover:bg-violet-500/30"
                aria-label={`Remove ${u.username}`}
              >
                {u.username} <span aria-hidden>✕</span>
              </button>
            ))}
          </div>
        )}

        <input
          type="search"
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          placeholder={`Add at least ${MIN_MEMBERS} people…`}
          aria-label="Search users to add"
          className={inputClass}
        />
        {search.results.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-line bg-ink-950">
            {search.results.map((u) => (
              <li key={u._id}>
                <button
                  onClick={() => {
                    setSelected([...selected, u]);
                    search.clear();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <Avatar name={u.username} src={u.avatar} className="size-7 text-xs" />
                  {u.username}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!ready}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create group'}
          </button>
        </div>
      </div>
    </div>
  );
}
