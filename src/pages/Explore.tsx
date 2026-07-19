import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Flame, Star } from 'lucide-react';
import { fetchTrendingPosts } from '../services/misc';
import { getSuggestedProfiles } from '../services/profiles';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import type { Profile } from '../types';

export default function Explore() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<
    { id: string; image_url: string; caption: string | null }[]
  >([]);
  const [creators, setCreators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, c] = await Promise.all([
          fetchTrendingPosts(profile?.id),
          profile
            ? getSuggestedProfiles(profile.id, 8)
            : Promise.resolve([] as Profile[]),
        ]);
        setPosts(p);
        setCreators(c);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profile]);

  return (
    <div className="space-y-8">
      <header className="card flex items-center gap-3 p-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
          <Compass className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">Explore</h1>
          <p className="text-sm text-slate-500">
            Trending posts, popular creators, and a random discover feed.
          </p>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-brand-500" />
          <h2 className="font-display text-lg font-semibold">Popular creators</h2>
        </div>
        {creators.length === 0 ? (
          <EmptyState title="No creators to show yet" />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {creators.map((c) => (
              <Link
                key={c.id}
                to={`/u/${c.username}`}
                className="card flex flex-col items-center gap-2 p-4 text-center transition-transform hover:-translate-y-1"
              >
                <Avatar src={c.avatar_url} alt={c.username} size={56} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">@{c.username}</p>
                  <p className="truncate text-xs text-slate-500">
                    {c.bio ?? 'No bio yet'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Flame className="h-4 w-4 text-brand-500" />
          <h2 className="font-display text-lg font-semibold">Trending posts</h2>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton aspect-square rounded-2xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState title="No posts to explore yet" />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((p) => (
              <Link
                key={p.id}
                to={`/post/${p.id}`}
                className="group relative aspect-square overflow-hidden rounded-2xl"
              >
                <img
                  src={p.image_url}
                  alt={p.caption ?? 'Litegram post'}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
