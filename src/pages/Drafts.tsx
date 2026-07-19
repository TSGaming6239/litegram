import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Trash2, Send, Pencil } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  listDrafts,
  deleteDraft,
  updateDraft,
} from '../services/drafts';
import { createPost } from '../services/posts';
import { awardAchievements } from '../services/profiles';
import { fetchMoodTags } from '../services/misc';
import { timeAgo } from '../utils/format';
import type { Draft, MoodTag } from '../types';

export default function Drafts() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [moods, setMoods] = useState<MoodTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [d, m] = await Promise.all([
        listDrafts(profile.id),
        fetchMoodTags().catch(() => []),
      ]);
      setDrafts(d);
      setMoods(m);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this draft?')) return;
    setBusyId(id);
    try {
      await deleteDraft(id);
      setDrafts((d) => d.filter((x) => x.id !== id));
      toast('Draft deleted.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const onPublish = async (draft: Draft) => {
    if (!profile || !draft.image_url) {
      toast('This draft has no image. Edit it to add one.', 'error');
      return;
    }
    if (!draft.caption?.trim()) {
      toast('Add a caption before publishing.', 'error');
      return;
    }
    setBusyId(draft.id);
    try {
      const id = await createPost({
        imageUrl: draft.image_url,
        caption: draft.caption.trim(),
        moodKey: draft.mood_key,
        location: draft.location?.trim() || undefined,
      });
      await awardAchievements(profile.id);
      await deleteDraft(draft.id);
      toast('Draft published!', 'success');
      navigate(`/post/${id}`);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const onEditField = async (
    draft: Draft,
    field: 'caption' | 'mood_key' | 'location',
    value: string | null
  ) => {
    setBusyId(draft.id);
    try {
      await updateDraft(draft.id, { [field]: value });
      setDrafts((d) =>
        d.map((x) => ({ ...x, [field]: value, updated_at: new Date().toISOString() }))
      );
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-brand-500" />
        <h1 className="font-display text-2xl font-bold">Drafts</h1>
      </header>

      {drafts.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No drafts yet"
          description="Save a post in progress from the composer and it'll appear here."
          action={
            <Link to="/posts/new" className="btn-primary">
              Create a post
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {drafts.map((d) => (
            <li key={d.id} className="card overflow-hidden">
              <div className="flex gap-3 p-4">
                {d.image_url ? (
                  <img
                    src={d.image_url}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <textarea
                    rows={2}
                    className="input resize-none text-sm"
                    placeholder="Caption…"
                    value={d.caption ?? ''}
                    onChange={(e) => onEditField(d, 'caption', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className="input text-sm"
                      value={d.mood_key ?? ''}
                      onChange={(e) =>
                        onEditField(d, 'mood_key', e.target.value || null)
                      }
                    >
                      <option value="">No mood</option>
                      {moods.map((m) => (
                        <option key={m.key} value={m.key}>
                          {m.emoji} {m.label}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input text-sm"
                      placeholder="Location"
                      value={d.location ?? ''}
                      onChange={(e) => onEditField(d, 'location', e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Updated {timeAgo(d.updated_at)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 p-3 dark:border-slate-800">
                <button
                  onClick={() => onDelete(d.id)}
                  disabled={busyId === d.id}
                  className="btn-ghost text-sm text-rose-600"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
                <Link to="/posts/new" className="btn-secondary text-sm">
                  <Pencil className="h-4 w-4" /> New post
                </Link>
                <button
                  onClick={() => onPublish(d)}
                  disabled={busyId === d.id}
                  className="btn-primary text-sm"
                >
                  {busyId === d.id ? (
                    <Spinner className="h-4 w-4 text-white" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Publish
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
