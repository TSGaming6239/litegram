import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateProfile } from '../services/profiles';
import { uploadImage } from '../services/storage';
import { isValidUsername } from '../utils/validation';

export default function EditProfile() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const avatarRef = useRef<HTMLInputElement | null>(null);
  const coverRef = useRef<HTMLInputElement | null>(null);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username);
    setFullName(profile.full_name ?? '');
    setBio(profile.bio ?? '');
    setWebsite(profile.website ?? '');
    setLocation(profile.location ?? '');
    setBirthday(profile.birthday ?? '');
    setAvatarUrl(profile.avatar_url);
    setCoverUrl(profile.cover_url);
  }, [profile]);

  if (!profile) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !profile) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage('avatars', f, profile.id);
      setAvatarUrl(url);
      await updateProfile(profile.id, { avatar_url: url });
      await refreshProfile();
      toast('Profile photo updated.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !profile) return;
    setUploadingCover(true);
    try {
      const url = await uploadImage('covers', f, profile.id);
      setCoverUrl(url);
      await updateProfile(profile.id, { cover_url: url });
      await refreshProfile();
      toast('Cover photo updated.', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!isValidUsername(username)) {
      toast('Username must be 3–20 chars: letters, numbers, dot, underscore.', 'error');
      return;
    }
    setBusy(true);
    try {
      await updateProfile(profile.id, {
        username,
        full_name: fullName,
        bio,
        website,
        location,
        birthday: birthday || null,
      });
      await refreshProfile();
      toast('Profile saved.', 'success');
      navigate(`/u/${username}`);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-2xl font-bold">Edit profile</h1>
      <form onSubmit={submit} className="card space-y-5 p-5">
        <div className="relative">
          <div
            className="h-32 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-400 to-accent-400 sm:h-40"
            style={
              coverUrl
                ? {
                    backgroundImage: `url(${coverUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="absolute right-3 top-3 chip glass-strong text-xs"
          >
            {uploadingCover ? <Spinner className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
            Change cover
          </button>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onCover}
          />
          <div className="-mt-10 flex justify-center">
            <div className="relative">
              <img
                src={avatarUrl ?? `https://ui-avatars.com/api/?name=${profile.username}`}
                alt={profile.username}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-900"
              />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                aria-label="Change avatar"
                className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-brand-500 text-white shadow-soft"
              >
                {uploadingAvatar ? <Spinner className="h-3.5 w-3.5 text-white" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={onAvatar}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bio">
            Bio
          </label>
          <textarea
            id="bio"
            rows={3}
            className="input resize-none"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
          />
          <p className="mt-1 text-right text-xs text-slate-400">{bio.length}/280</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="website">
              Website
            </label>
            <input
              id="website"
              className="input"
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="birthday">
            Birthday (optional)
          </label>
          <input
            id="birthday"
            type="date"
            className="input"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            We'll show a little 🎂 badge on your profile on your birthday.
          </p>
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
