import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapPin, Smile } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchPostById, updatePost } from '../services/posts';
import { fetchMoodTags } from '../services/misc';
import type { MoodTag, PostWithRelations } from '../types';

export default function EditPost() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostWithRelations | null>(null);
  const [moods, setMoods] = useState<MoodTag[]>([]);
  const [caption, setCaption] = useState('');
  const [moodKey, setMoodKey] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMoodTags().then(setMoods).catch(() => undefined);
    if (!id || !session) return;
    fetchPostById(id, session.user.id)
      .then((p) => {
        setPost(p);
        setCaption(p?.caption ?? '');
        setMoodKey(p?.mood_key ?? null);
        setLocation(p?.location ?? '');
      })
      .catch((e) => toast((e as Error).message, 'error'))
      .finally(() => setLoading(false));
  }, [id, session, toast]);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!post) {
    return <p className="text-sm text-slate-500">Post not found.</p>;
  }

  if (post.user_id !== session?.user.id) {
    return <p className="text-sm text-rose-500">You can only edit your own posts.</p>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setBusy(true);
    try {
      await updatePost(id, {
        caption: caption.trim(),
        mood_key: moodKey,
        location: location.trim(),
      });
      toast('Post updated.', 'success');
      navigate(`/post/${id}`);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-2xl font-bold">Edit post</h1>
      <form onSubmit={submit} className="card space-y-5 p-5">
        <img
          src={post.image_url}
          alt={post.caption ?? 'Post'}
          className="max-h-80 w-full rounded-2xl object-cover"
        />
        <div>
          <label className="label" htmlFor="caption">
            Caption
          </label>
          <textarea
            id="caption"
            rows={3}
            className="input resize-none"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mood">
              <Smile className="mr-1 inline h-3.5 w-3.5" /> Mood
            </label>
            <select
              id="mood"
              className="input"
              value={moodKey ?? ''}
              onChange={(e) => setMoodKey(e.target.value || null)}
            >
              <option value="">No mood</option>
              {moods.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.emoji} {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="location">
              <MapPin className="mr-1 inline h-3.5 w-3.5" /> Location
            </label>
            <input
              id="location"
              type="text"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
