import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, X, Clock } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { searchProfiles, getSuggestedProfiles } from '../services/profiles';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';

const RECENT_KEY = 'litegram-recent-searches';

export default function Search() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'));
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    getSuggestedProfiles(profile.id, 8)
      .then(setSuggested)
      .catch(() => undefined);
  }, [profile]);

  useEffect(() => {
    const q = debounced.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    searchProfiles(q)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debounced]);

  const saveRecent = (term: string) => {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 8);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const clearRecent = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people or usernames…"
          className="input pl-11 pr-10 text-base"
          aria-label="Search users"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!query.trim() && (
        <>
          {recent.length > 0 && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                  <Clock className="h-4 w-4" /> Recent searches
                </h2>
                <button
                  onClick={clearRecent}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuery(r)}
                    className="chip bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 font-display text-base font-semibold">
              Suggested users
            </h2>
            {suggested.length === 0 ? (
              <EmptyState title="No suggestions yet" />
            ) : (
              <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
                {suggested.map((s) => (
                  <li key={s.id}>
                    <Link
                      to={`/u/${s.username}`}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      onClick={() => saveRecent(s.username)}
                    >
                      <Avatar src={s.avatar_url} alt={s.username} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">@{s.username}</p>
                        <p className="truncate text-xs text-slate-500">
                          {s.full_name ?? 'Litegram member'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {query.trim() && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold">
            Results for "{query.trim()}"
          </h2>
          {loading ? (
            <div className="card divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-2.5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={<SearchIcon className="h-6 w-6" />}
              title="No matches found"
              description="Try a different name or username."
            />
          ) : (
            <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
              {results.map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/u/${s.username}`}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    onClick={() => saveRecent(s.username)}
                  >
                    <Avatar src={s.avatar_url} alt={s.username} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">@{s.username}</p>
                      <p className="truncate text-xs text-slate-500">
                        {s.full_name ?? 'Litegram member'}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
