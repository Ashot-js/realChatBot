import { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import type { User } from '../types';

interface Found {
  query: string;
  users: User[];
  error: string;
}

/** Search-as-you-type for users: waits 300 ms after the last keystroke, cancels stale requests. */
export function useUserSearch(exclude: string[] = []) {
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Found>({ query: '', users: [], error: '' });
  const q = query.trim();

  useEffect(() => {
    if (!q) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      usersApi
        .search(q, controller.signal)
        .then(({ users }) => setFound({ query: q, users, error: '' }))
        .catch((err) => !controller.signal.aborted && setFound({ query: q, users: [], error: err.message }));
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const current = q !== '' && found.query === q;
  const results = current ? found.users.filter((u) => !exclude.includes(u._id)) : [];
  return {
    query,
    setQuery,
    results,
    searching: q !== '' && !current,
    empty: current && !found.error && results.length === 0,
    error: current ? found.error : '',
    clear: () => setQuery(''),
  };
}
