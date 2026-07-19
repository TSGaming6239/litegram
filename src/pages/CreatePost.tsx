import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Sparkles, MapPin, Smile, Check, Save } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { EmojiPicker } from '../components/EmojiPicker';
import { Confetti } from '../components/Confetti';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { uploadImage } from '../services/storage';
import { createPost } from '../services/posts';
import { fetchMoodTags, ensureTodayPrompt } from '../services/misc';
import { awardAchievements, getProfileStats } from '../services/profiles';
import { saveDraft } from '../services/drafts';
import type { MoodTag, DailyPrompt } from '../types';
import { cn } from '../utils/cn';
import { suggestCaptions } from '../services/captions';

const FIRST_POST_KEY = 'litegram-first-post-celebrated';

export default function CreatePost() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const captionRef = useRef<HTMLTextAreaElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [moodKey, setMoodKey] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [moods, setMoods] = useState<MoodTag[]>([]);
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);
  const [attachPrompt, setAttachPrompt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    fetchMoodTags().then(setMoods).catch(() => undefined);
    ensureTodayPrompt().then(setPrompt).catch(() => undefined);
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast('Please choose an image file.', 'error');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast('Image must be under 8 MB.', 'error');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const insertEmoji = (emoji: string) => {
    const el = captionRef.current;
    if (!el) {
      setCaption((c) => c + emoji);
      return;
    }
    const start = el.selectionStart ?? caption.length;
    const end = el.selectionEnd ?? caption.length;
    const next = caption.slice(0, start) + emoji + caption.slice(end);
    setCaption(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const onSuggest = async () => {
    setSuggesting(true);
    try {
      const topic = location || caption.split('\n')[0] || '';
      const mood = moodKey ?? 'happy';
      const list = await suggestCaptions(mood, topic, caption || undefined);
      setSuggestions(list);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSuggesting(false);
    }
  };

  const onSaveDraft = async () => {
    if (!profile) return;
    if (!file && !caption.trim() && !location.trim() && !moodKey) {
      toast('Nothing to save yet.', 'info');
      return;
    }
    setSavingDraft(true);
    try {
      let imageUrl: string | null = null;
      if (file) imageUrl = await uploadImage('posts', file, profile.id);
      await saveDraft({
        image_url: imageUrl,
        caption: caption.trim() || null,
        mood_key: moodKey,
        location: location.trim() || null,
      });
      toast('Draft saved. You can finish it later.', 'success');
      navigate('/posts/drafts');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSavingDraft(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !profile) return;
    if (!caption.trim()) {
      toast('Add a caption to share your moment.', 'error');
      return;
    }
    setBusy(true);
    try {
      const beforeStats = await getProfileStats(profile.id);
      const url = await uploadImage('posts', file, profile.id);
      const id = await createPost({
        imageUrl: url,
        caption: caption.trim(),
        moodKey,
        location: location.trim() || undefined,
        promptId: attachPrompt && prompt ? prompt.id : undefined,
      });
      await awardAchievements(profile.id);
      const celebrated = localStorage.getItem(FIRST_POST_KEY) === '1';
      if (beforeStats.posts === 0 && !celebrated) {
        localStorage.setItem(FIRST_POST_KEY, '1');
        setCelebrate(true);
        toast('Your first post is live — congratulations!', 'success');
        window.setTimeout(() => navigate(`/post/${id}`), 1800);
      } else {
        toast('Posted! Your light is shining.', 'success');
        navigate(`/post/${id}`);
      }
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Confetti run={celebrate} onDone={() => setCelebrate(false)} />
      <h1 className="mb-4 font-display text-2xl font-bold">Create a post</h1>
      <form onSubmit={submit} className="card space-y-5 p-5">
        <label
          htmlFor="file"
          className="group flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50/40 dark:border-slate-700 dark:bg-slate-900/40"
        >
          {preview ? (
            <img
              src={preview}
              alt="Selected preview"
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <>
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm font-medium">
                Click to upload an image (max 8 MB)
              </span>
            </>
          )}
          <input
            id="file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onPick}
          />
        </label>

        <div>
          <label className="label" htmlFor="caption">
            Caption
          </label>
          <div className="relative">
            <textarea
              id="caption"
              ref={captionRef}
              rows={3}
              className="input resize-none pr-12"
              placeholder="Write a caption…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="absolute right-2 top-2">
              <EmojiPicker onPick={insertEmoji} />
            </div>
          </div>
          <button
            type="button"
            onClick={onSuggest}
            disabled={suggesting}
            className="btn-outline mt-2 text-sm"
          >
            {suggesting ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Suggest captions
          </button>
          {suggestions.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setCaption(s);
                      setSuggestions([]);
                    }}
                    className="flex w-full items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-left text-sm hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800"
                  >
                    <Check className="mt-0.5 h-4 w-4 text-brand-500" />
                    <span>{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
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
              placeholder="Where was this?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {prompt && (
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-colors',
              attachPrompt
                ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-900/20'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={attachPrompt}
              onChange={(e) => setAttachPrompt(e.target.checked)}
            />
            <Sparkles className="mt-0.5 h-4 w-4 text-brand-500" />
            <div>
              <p className="text-sm font-semibold">Today's prompt</p>
              <p className="text-xs text-slate-500">{prompt.prompt_text}</p>
            </div>
          </label>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft}
            className="btn-outline"
          >
            {savingDraft ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save draft
          </button>
          <button type="submit" className="btn-primary" disabled={busy || !file}>
            {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Share post'}
          </button>
        </div>
      </form>
    </div>
  );
}
