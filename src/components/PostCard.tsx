import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  MapPin,
  Trash2,
  Link2,
  Pencil,
  Pin,
} from 'lucide-react';
import type { PostWithRelations, ReactionKind } from '../types';
import { Avatar } from './Avatar';
import { BirthdayBadge } from './BirthdayBadge';
import { timeAgo, formatCount } from '../utils/format';
import { cn } from '../utils/cn';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  toggleLike,
  toggleSave,
  setReaction,
  removeReaction,
  deletePost,
} from '../services/posts';

const REACTIONS: { kind: ReactionKind; emoji: string; label: string }[] = [
  { kind: 'love', emoji: '❤️', label: 'Love' },
  { kind: 'funny', emoji: '😂', label: 'Funny' },
  { kind: 'fire', emoji: '🔥', label: 'Fire' },
  { kind: 'wow', emoji: '😮', label: 'Wow' },
];

type Props = {
  post: PostWithRelations;
  onDeleted?: (id: string) => void;
  onUpdated?: (post: PostWithRelations) => void;
};

export function PostCard({ post, onDeleted }: Props) {
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(!!post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [saved, setSaved] = useState(!!post.saved_by_me);
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [myReaction, setMyReaction] = useState<ReactionKind | null>(
    post.my_reaction ?? null
  );
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionKind, number>>(
    post.reaction_counts ?? { love: 0, funny: 0, fire: 0, wow: 0 }
  );
  const [busy, setBusy] = useState(false);
  const [showHeart, setShowHeart] = useState(false);

  const isOwner = profile?.id === post.user_id;
  const author = post.profiles;

  const handleLike = async () => {
    if (!session) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(post.id, session.user.id, !next);
    } catch (e) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      toast((e as Error).message, 'error');
    }
  };

  const handleDoubleTap = async () => {
    if (!session) return;
    setShowHeart(true);
    window.setTimeout(() => setShowHeart(false), 700);
    if (liked) return;
    setLiked(true);
    setLikeCount((c) => c + 1);
    try {
      await toggleLike(post.id, session.user.id, false);
    } catch (e) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      toast((e as Error).message, 'error');
    }
  };

  const handleSave = async () => {
    if (!session) return;
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, session.user.id, !next);
      toast(next ? 'Saved to your collection.' : 'Removed from saved.', 'success');
    } catch (e) {
      setSaved(!next);
      toast((e as Error).message, 'error');
    }
  };

  const handleReact = async (kind: ReactionKind) => {
    if (!session) return;
    setShowReactions(false);
    const prev = myReaction;
    setMyReaction(kind);
    setReactionCounts((c) => {
      const next = { ...c };
      if (prev) next[prev] = Math.max(0, next[prev] - 1);
      next[kind] += 1;
      return next;
    });
    try {
      await setReaction(post.id, session.user.id, kind);
    } catch (e) {
      setMyReaction(prev);
      setReactionCounts(post.reaction_counts ?? reactionCounts);
      toast((e as Error).message, 'error');
    }
  };

  const handleRemoveReaction = async () => {
    if (!session || !myReaction) return;
    const prev = myReaction;
    setMyReaction(null);
    setReactionCounts((c) => ({ ...c, [prev]: Math.max(0, c[prev] - 1) }));
    try {
      await removeReaction(post.id, session.user.id);
    } catch (e) {
      setMyReaction(prev);
      setReactionCounts((c) => ({ ...c, [prev]: c[prev] + 1 }));
      toast((e as Error).message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post permanently?')) return;
    setBusy(true);
    try {
      await deletePost(post.id);
      toast('Post deleted.', 'success');
      onDeleted?.(post.id);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
      setShowMenu(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard.', 'success');
    } catch {
      toast('Could not copy link.', 'error');
    }
    setShowMenu(false);
  };

  return (
    <article className="card overflow-hidden animate-fade-in">
      <header className="flex items-center gap-3 p-4">
        <Link to={`/u/${author?.username ?? ''}`}>
          <Avatar src={author?.avatar_url} alt={author?.full_name ?? author?.username ?? 'User'} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/u/${author?.username ?? ''}`}
            className="flex items-center gap-2 truncate text-sm font-semibold hover:underline"
          >
            <span className="truncate">@{author?.username ?? 'unknown'}</span>
            <BirthdayBadge birthday={author?.birthday} />
          </Link>
          {post.location && (
            <p className="flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3 w-3" /> {post.location}
            </p>
          )}
        </div>
        <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
        <div className="relative">
          <button
            type="button"
            aria-label="Post options"
            onClick={() => setShowMenu((s) => !s)}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-soft animate-scale-in dark:border-slate-700 dark:bg-slate-900"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={handleShare}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Link2 className="h-4 w-4" /> Copy link
              </button>
              {isOwner && (
                <>
                  <Link
                    to={`/posts/${post.id}/edit`}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => setShowMenu(false)}
                  >
                    <Pencil className="h-4 w-4" /> Edit post
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div
        className="relative select-none"
        onDoubleClick={handleDoubleTap}
        role="button"
        tabIndex={0}
        aria-label="Double-tap to like"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.ctrlKey) handleDoubleTap();
        }}
      >
        <img
          src={post.image_url}
          alt={post.caption ?? 'Litegram post'}
          className="w-full max-h-[640px] object-cover"
          loading="lazy"
        />
        {post.mood_tags && (
          <span className="absolute left-3 top-3 chip glass-strong text-xs">
            <span aria-hidden>{post.mood_tags.emoji}</span>
            {post.mood_tags.label}
          </span>
        )}
        {post.pinned && (
          <span className="absolute right-3 top-3 chip glass-strong text-xs">
            <Pin className="h-3 w-3" /> Pinned
          </span>
        )}
        {showHeart && (
          <span
            className="pointer-events-none absolute inset-0 grid place-items-center"
            aria-hidden
          >
            <Heart
              className="h-24 w-24 text-white drop-shadow-lg"
              style={{
                animation: 'heart-pop 0.7s ease-out forwards',
              }}
            />
          </span>
        )}
        <style>{`
          @keyframes heart-pop {
            0% { transform: scale(0); opacity: 0; }
            30% { transform: scale(1.2); opacity: 1; }
            60% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
          }
        `}</style>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike' : 'Like'}
            className={cn(
              'rounded-full p-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800',
              liked && 'text-brand-500'
            )}
          >
            <Heart
              className={cn('h-6 w-6 transition-transform', liked && 'fill-brand-500 scale-110')}
            />
          </button>
          <Link
            to={`/post/${post.id}`}
            aria-label="View comments"
            className="rounded-full p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <MessageCircle className="h-6 w-6" />
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            <button
              type="button"
              aria-label="Quick reactions"
              className="rounded-full p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="text-lg leading-none">＋</span>
            </button>
            {showReactions && (
              <div className="absolute bottom-12 left-0 z-20 flex gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-soft animate-scale-in dark:border-slate-700 dark:bg-slate-900">
                {REACTIONS.map((r) => (
                  <button
                    key={r.kind}
                    type="button"
                    aria-label={r.label}
                    onClick={() => handleReact(r.kind)}
                    className="grid h-9 w-9 place-items-center rounded-full text-xl transition-transform hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleSave}
              aria-pressed={saved}
              aria-label={saved ? 'Remove from saved' : 'Save post'}
              className="rounded-full p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Bookmark className={cn('h-6 w-6', saved && 'fill-brand-500 text-brand-500')} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <span>{formatCount(likeCount)} likes</span>
          <span className="text-slate-300">·</span>
          <span>{formatCount(post.comment_count ?? 0)} comments</span>
        </div>

        {(myReaction ||
          Object.values(reactionCounts).some((n) => n > 0)) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {REACTIONS.map((r) => {
              const count = reactionCounts[r.kind];
              if (!count) return null;
              return (
                <span
                  key={r.kind}
                  className={cn(
                    'chip bg-slate-100 dark:bg-slate-800',
                    myReaction === r.kind && 'ring-1 ring-brand-400'
                  )}
                >
                  <span aria-hidden>{r.emoji}</span> {count}
                </span>
              );
            })}
            {myReaction && (
              <button
                onClick={handleRemoveReaction}
                className="text-xs text-slate-400 underline-offset-2 hover:underline"
              >
                remove
              </button>
            )}
          </div>
        )}

        {post.caption && (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-100">
            <Link to={`/u/${author?.username ?? ''}`} className="font-semibold hover:underline">
              @{author?.username}
            </Link>{' '}
            {post.caption}
          </p>
        )}

        {post.daily_prompts && (
          <p className="mt-2 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
            Daily prompt: {post.daily_prompts.prompt_text}
          </p>
        )}

        <Link
          to={`/post/${post.id}`}
          className="mt-2 block text-xs text-slate-400 hover:underline"
        >
          View all comments
        </Link>
      </div>
    </article>
  );
}
