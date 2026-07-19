import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw, Users, Flame } from 'lucide-react';
import { PostCard } from '../components/PostCard';
import { PostCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { MoodFilter } from '../components/MoodFilter';
import { useAuth } from '../contexts/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { fetchFeed } from '../services/posts';
import { fetchMoodTags, ensureTodayPrompt } from '../services/misc';
import { getSuggestedProfiles } from '../services/profiles';
import { Avatar } from '../components/Avatar';
import { follow, isFollowing, unfollow } from '../services/profiles';
import type { MoodTag, PostWithRelations, Profile } from '../types';
import { cn } from '../utils/cn';

type Tab = 'latest' | 'following';

export default function HomeFeed() {
  const { profile, session } = useAuth();
  const [moods, setMoods] = useState<MoodTag[]>([]);
  const [moodKey, setMoodKey] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('latest');
  const [prompt, setPrompt] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMoodTags().then(setMoods).catch(() => undefined);
    ensureTodayPrompt()
      .then((p) => setPrompt(p?.prompt_text ?? null))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!profile) return;
    getSuggestedProfiles(profile.id, 4)
      .then(setSuggested)
      .catch(() => undefined);
  }, [profile]);

  const fetcher = useCallback(
    (page: number) =>
      fetchFeed({
        page,
        moodKey,
        followingOnly: tab === 'following',
        currentUserId: session?.user.id,
      }),
    [moodKey, tab, session?.user.id]
  );

  const { items, loading, loadingMore, error, sentinel, refresh } =
    useInfiniteScroll<PostWithRelations>({
      fetcher,
      enabled: !!session,
    });

  const onToggleFollow = async (other: Profile) => {
    if (!profile) return;
    const cur = followState[other.id] ?? false;
    setFollowState((s) => ({ ...s, [other.id]: !cur }));
    try {
      if (cur) await unfollow(profile.id, other.id);
      else await follow(profile.id, other.id);
    } catch {
      setFollowState((s) => ({ ...s, [other.id]: cur }));
    }
  };

  useEffect(() => {
    if (!profile || suggested.length === 0) return;
    Promise.all(
      suggested.map((s) => isFollowing(profile.id, s.id).catch(() => false))
    ).then((vals) => {
      const next: Record<string, boolean> = {};
      suggested.forEach((s, i) => (next[s.id] = vals[i] as boolean));
      setFollowState(next);
    });
  }, [profile, suggested]);

  const feedEmpty = !loading && items.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="card overflow-hidden p-5">
          <div className="flex items-center gap-2 text-brand-600">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Daily prompt
            </span>
          </div>
          <p className="mt-2 font-display text-lg font-semibold">
            {prompt ?? 'Share something that made you smile today.'}
          </p>
          <Link to="/posts/new" className="btn-outline mt-3 inline-flex text-sm">
            Take the challenge
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => setTab('latest')}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                tab === 'latest'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              Latest
            </button>
            <button
              onClick={() => setTab('following')}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                tab === 'following'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              )}
            >
              Following
            </button>
          </div>
          <button
            onClick={refresh}
            className="btn-ghost text-sm"
            aria-label="Refresh feed"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        <MoodFilter moods={moods} value={moodKey} onChange={setMoodKey} />

        {error && (
          <div className="card border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        ) : feedEmpty ? (
          <EmptyState
            icon={<Flame className="h-6 w-6" />}
            title={tab === 'following' ? 'No posts from your follows yet' : 'No posts yet'}
            description={
              tab === 'following'
                ? 'Discover new creators to fill your feed, or switch to Latest to see everything.'
                : 'Be the first to share a moment today.'
            }
            action={
              <Link to="/posts/new" className="btn-primary">
                Share a post
              </Link>
            }
          />
        ) : (
          <div className="space-y-5">
            {items.map((p) => (
              <PostCard key={p.id} post={p} onDeleted={() => refresh()} />
            ))}
            {loadingMore && <PostCardSkeleton />}
            {items.length > 0 && (
              <div ref={sentinel} className="h-10" aria-hidden />
            )}
          </div>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Users className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Suggested for you</h3>
          </div>
          <ul className="mt-3 space-y-3">
            {suggested.length === 0 && (
              <li className="text-sm text-slate-500">No suggestions yet.</li>
            )}
            {suggested.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <Link to={`/u/${s.username}`}>
                  <Avatar src={s.avatar_url} alt={s.username} size={36} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/u/${s.username}`}
                    className="block truncate text-sm font-semibold hover:underline"
                  >
                    @{s.username}
                  </Link>
                  <p className="truncate text-xs text-slate-500">{s.bio ?? 'No bio yet'}</p>
                </div>
                <button
                  onClick={() => onToggleFollow(s)}
                  className={cn(
                    'text-xs font-semibold',
                    followState[s.id]
                      ? 'text-slate-500 hover:text-rose-500'
                      : 'text-brand-600 hover:underline'
                  )}
                >
                  {followState[s.id] ? 'Following' : 'Follow'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5 text-xs text-slate-500">
          <p className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200">
            Litegram
          </p>
          <p className="mt-1">A lighter, brighter social space. Share your light.</p>
        </div>
      </aside>
    </div>
  );
}
