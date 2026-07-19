import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin,
  Link as LinkIcon,
  CalendarDays,
  Pencil,
  Award,
  Grid3x3,
  UserMinus,
  UserPlus,
  Pin,
  Flame,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { BirthdayBadge } from '../components/BirthdayBadge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getProfileByUsername,
  getProfileStats,
  getUserPosts,
  getUserAchievements,
  getFollowers,
  getFollowing,
  follow,
  unfollow,
  isFollowing,
  computeProfileCompletion,
} from '../services/profiles';
import { setPostPinned } from '../services/posts';
import { formatDate } from '../utils/format';
import type { Profile as ProfileType } from '../types';
import { cn } from '../utils/cn';

const ACHIEVEMENT_ICONS: Record<string, string> = {
  sparkles: '✨',
  award: '🏅',
  heart: '❤️',
  flame: '🔥',
  calendar: '📅',
  trophy: '🏆',
  cake: '🎂',
};

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { profile: me } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<ProfileType | null>(null);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [posts, setPosts] = useState<
    {
      id: string;
      image_url: string;
      caption: string | null;
      created_at: string;
      pinned: boolean;
    }[]
  >([]);
  const [achievements, setAchievements] = useState<
    {
      achievement_id: number;
      awarded_at: string;
      achievement: {
        id: number;
        key: string;
        label: string;
        description: string;
        icon: string;
      };
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [busyFollow, setBusyFollow] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<ProfileType[]>([]);
  const [followingList, setFollowingList] = useState<ProfileType[]>([]);

  const load = useCallback(async () => {
    if (!username) return;
    try {
      const u = await getProfileByUsername(username);
      if (!u) {
        setUser(null);
        return;
      }
      setUser(u);
      const [s, p, a] = await Promise.all([
        getProfileStats(u.id),
        getUserPosts(u.id),
        getUserAchievements(u.id).catch(() => []),
      ]);
      setStats(s);
      setPosts(p);
      setAchievements(a as typeof achievements);
      if (me && me.id !== u.id) {
        const f = await isFollowing(me.id, u.id).catch(() => false);
        setFollowing(f);
      }
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }, [username, me, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const onFollow = async () => {
    if (!me || !user) return;
    setBusyFollow(true);
    const prev = following;
    setFollowing(!prev);
    setStats((s) => ({ ...s, followers: s.followers + (prev ? -1 : 1) }));
    try {
      if (prev) await unfollow(me.id, user.id);
      else await follow(me.id, user.id);
    } catch (e) {
      setFollowing(prev);
      setStats((s) => ({ ...s, followers: s.followers + (prev ? 1 : -1) }));
      toast((e as Error).message, 'error');
    } finally {
      setBusyFollow(false);
    }
  };

  const onTogglePin = async (postId: string, pinned: boolean) => {
    try {
      await setPostPinned(postId, pinned);
      toast(pinned ? 'Post pinned to your profile.' : 'Post unpinned.', 'success');
      await load();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const openFollowers = async () => {
    if (!user) return;
    setFollowers(await getFollowers(user.id).catch(() => []));
    setShowFollowers(true);
  };
  const openFollowing = async () => {
    if (!user) return;
    setFollowingList(await getFollowing(user.id).catch(() => []));
    setShowFollowing(true);
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        title="User not found"
        description="This account doesn't exist or was removed."
        action={
          <Link to="/feed" className="btn-primary">
            Back to feed
          </Link>
        }
      />
    );
  }

  const isMe = me?.id === user.id;
  const completion = computeProfileCompletion(user, stats.posts > 0);

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div
          className="h-40 w-full bg-gradient-to-r from-brand-400 to-accent-400 sm:h-56"
          style={
            user.cover_url
              ? {
                  backgroundImage: `url(${user.cover_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
        <div className="px-5 pb-5">
          <div className="-mt-12 flex items-end justify-between sm:-mt-14">
            <Avatar
              src={user.avatar_url}
              alt={user.username}
              size={96}
              ring
              className="ring-4 ring-white dark:ring-slate-900"
            />
            <div className="mb-1 flex gap-2">
              {isMe ? (
                <>
                  <Link to="/profile/edit" className="btn-outline text-sm">
                    <Pencil className="h-4 w-4" /> Edit profile
                  </Link>
                  <Link to="/settings" className="btn-secondary text-sm">
                    Settings
                  </Link>
                </>
              ) : (
                <button
                  onClick={onFollow}
                  disabled={busyFollow}
                  className={cn(
                    'text-sm',
                    following ? 'btn-secondary' : 'btn-primary'
                  )}
                >
                  {following ? (
                    <>
                      <UserMinus className="h-4 w-4" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" /> Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold">
                {user.full_name ?? user.username}
              </h1>
              <BirthdayBadge birthday={user.birthday} />
              {user.login_streak > 1 && (
                <span
                  className="chip bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200"
                  title="Daily login streak"
                >
                  <Flame className="h-3 w-3" /> {user.login_streak}-day streak
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">@{user.username}</p>
            {user.bio && (
              <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                {user.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {user.location}
                </span>
              )}
              {user.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 text-brand-600 hover:underline"
                >
                  <LinkIcon className="h-3.5 w-3.5" />{' '}
                  {user.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> Joined{' '}
                {formatDate(user.created_at)}
              </span>
            </div>
            <div className="mt-4 flex gap-5 text-sm">
              <button onClick={openFollowers} className="hover:underline">
                <strong>{stats.followers}</strong>{' '}
                <span className="text-slate-500">followers</span>
              </button>
              <button onClick={openFollowing} className="hover:underline">
                <strong>{stats.following}</strong>{' '}
                <span className="text-slate-500">following</span>
              </button>
              <span>
                <strong>{stats.posts}</strong>{' '}
                <span className="text-slate-500">posts</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {isMe && completion.percent < 100 && (
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">
              Profile completion — {completion.percent}%
            </h2>
            <Link to="/profile/edit" className="text-xs font-semibold text-brand-600 hover:underline">
              Complete it
            </Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          {completion.missing.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Missing: {completion.missing.join(' · ')}
            </p>
          )}
        </section>
      )}

      {achievements.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
            <Award className="h-4 w-4 text-brand-500" /> Achievements
          </h2>
          <div className="flex flex-wrap gap-3">
            {achievements.map((a) => (
              <div
                key={a.achievement_id}
                className="flex items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-sm dark:bg-brand-900/30"
                title={a.achievement.description}
              >
                <span className="text-lg" aria-hidden>
                  {ACHIEVEMENT_ICONS[a.achievement.icon] ?? '🏅'}
                </span>
                <div>
                  <p className="font-semibold">{a.achievement.label}</p>
                  <p className="text-xs text-slate-500">
                    {a.achievement.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold">
          <Grid3x3 className="h-4 w-4" /> Posts
        </h2>
        {posts.length === 0 ? (
          <EmptyState
            title={isMe ? "You haven't posted yet" : 'No posts yet'}
            description={
              isMe ? 'Share your first moment to get started.' : undefined
            }
            action={
              isMe ? (
                <Link to="/posts/new" className="btn-primary">
                  Create a post
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded-2xl"
              >
                <Link to={`/post/${p.id}`}>
                  <img
                    src={p.image_url}
                    alt={p.caption ?? 'Post'}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                {p.pinned && (
                  <span className="absolute left-2 top-2 chip glass-strong text-xs">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                {isMe && (
                  <button
                    onClick={() => onTogglePin(p.id, !p.pinned)}
                    className="absolute right-2 top-2 chip glass-strong text-xs opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={p.pinned ? 'Unpin post' : 'Pin post'}
                    title={p.pinned ? 'Unpin' : 'Pin to profile'}
                  >
                    <Pin
                      className={cn('h-3 w-3', p.pinned && 'fill-brand-500 text-brand-500')}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={showFollowers}
        onClose={() => setShowFollowers(false)}
        title="Followers"
      >
        <UserList users={followers} onPick={() => setShowFollowers(false)} />
      </Modal>
      <Modal
        open={showFollowing}
        onClose={() => setShowFollowing(false)}
        title="Following"
      >
        <UserList users={followingList} onPick={() => setShowFollowing(false)} />
      </Modal>
    </div>
  );
}

function UserList({
  users,
  onPick,
}: {
  users: ProfileType[];
  onPick: () => void;
}) {
  if (users.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">No one here yet.</p>
    );
  }
  return (
    <ul className="max-h-80 space-y-2 overflow-y-auto">
      {users.map((u) => (
        <li key={u.id}>
          <Link
            to={`/u/${u.username}`}
            onClick={onPick}
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <Avatar src={u.avatar_url} alt={u.username} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">@{u.username}</p>
              <p className="truncate text-xs text-slate-500">
                {u.bio ?? 'Litegram member'}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
