import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Bell, Check } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
} from '../services/notifications';
import { timeAgo } from '../utils/format';
import type { NotificationWithActor } from '../types';

export default function Notifications() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<NotificationWithActor[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!profile) return;
    fetchNotifications(profile.id)
      .then(setItems)
      .catch((e) => toast((e as Error).message, 'error'))
      .finally(() => setLoading(false));
  }, [profile, toast]);

  const markAll = async () => {
    if (!profile) return;
    setMarking(true);
    try {
      await markAllNotificationsRead(profile.id);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setMarking(false);
    }
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-500" />
          <h1 className="font-display text-xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="chip bg-brand-500 text-white">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAll}
            disabled={marking}
            className="btn-ghost text-sm"
          >
            {marking ? <Spinner className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            Mark all read
          </button>
        )}
      </header>

      {loading ? (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="skeleton h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-6 w-6" />}
          title="No notifications yet"
          description="Likes, comments, and new follows will show up here."
        />
      ) : (
        <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((n) => {
            const icon = iconFor(n.type);
            const actor = n.actor;
            return (
              <li
                key={n.id}
                className={`flex items-center gap-3 p-3 transition-colors ${
                  !n.read ? 'bg-brand-50/60 dark:bg-brand-900/20' : ''
                }`}
              >
                <Link to={actor ? `/u/${actor.username}` : '#'} aria-label={actor?.username}>
                  <Avatar src={actor?.avatar_url} alt={actor?.username ?? 'User'} size={40} />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {actor && (
                      <Link
                        to={`/u/${actor.username}`}
                        className="font-semibold hover:underline"
                      >
                        @{actor.username}
                      </Link>
                    )}{' '}
                    <span className="text-slate-600 dark:text-slate-300">
                      {labelFor(n.type)}
                    </span>{' '}
                    <span className="text-slate-400">· {timeAgo(n.created_at)}</span>
                  </p>
                </div>
                {n.posts && (
                  <Link
                    to={`/post/${n.posts.id}`}
                    aria-label="View post"
                    className="h-12 w-12 overflow-hidden rounded-lg"
                  >
                    <img
                      src={n.posts.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </Link>
                )}
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-900/40">
                  {icon}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function iconFor(type: string) {
  switch (type) {
    case 'like':
      return <Heart className="h-4 w-4" />;
    case 'comment':
      return <MessageCircle className="h-4 w-4" />;
    case 'follow':
      return <UserPlus className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function labelFor(type: string) {
  switch (type) {
    case 'like':
      return 'liked your post.';
    case 'comment':
      return 'commented on your post.';
    case 'follow':
      return 'started following you.';
    default:
      return 'sent a notification.';
  }
}
