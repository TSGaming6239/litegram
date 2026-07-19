import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { getSavedPosts } from '../services/profiles';

type SavedItem = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  user_id: string;
  profiles: { id: string; username: string; avatar_url: string | null };
};

export default function Saved() {
  const { profile } = useAuth();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    getSavedPosts(profile.id)
      .then((data) => setItems(data as SavedItem[]))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-brand-500" />
        <h1 className="font-display text-xl font-bold">Saved posts</h1>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-6 w-6" />}
          title="Nothing saved yet"
          description="Tap the bookmark icon on any post to keep it here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/post/${p.id}`}
              className="group relative aspect-square overflow-hidden rounded-2xl"
            >
              <img
                src={p.image_url}
                alt={p.caption ?? 'Saved post'}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-slate-950/70 to-transparent p-3 text-white">
                <span className="text-xs font-medium">@{p.profiles.username}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
