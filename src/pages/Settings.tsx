import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Bell, Shield, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Settings() {
  const { signOut, profile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const navigate = useNavigate();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Signed out.', 'success');
      navigate('/');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <User className="h-4 w-4 text-brand-500" /> Account
        </h2>
        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-slate-500">Username:</span>{' '}
            <strong>@{profile?.username}</strong>
          </p>
          <Link to="/profile/edit" className="btn-outline text-sm">
            Edit profile
          </Link>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Appearance
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose how Litegram looks to you.
        </p>
        <div className="mt-3 inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
          <button
            onClick={() => setTheme('light')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              theme === 'light'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              theme === 'dark'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300'
            }`}
          >
            Dark
          </button>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          Accent color
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              { key: 'brand', label: 'Rose' },
              { key: 'blue', label: 'Blue' },
              { key: 'green', label: 'Green' },
              { key: 'orange', label: 'Orange' },
              { key: 'rose', label: 'Pink' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setAccent(opt.key)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                accent === opt.key
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <span
                className="h-3.5 w-3.5 rounded-full"
                style={{ background: `var(--brand-${opt.key === 'brand' ? '500' : '500'})` }}
                // color updates live via CSS variables
              />
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Your accent is saved on this device. Pick one to match your vibe.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <Bell className="h-4 w-4 text-brand-500" /> Notifications
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Realtime notifications for likes, comments, and follows are enabled.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <Shield className="h-4 w-4 text-brand-500" /> Privacy
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Your posts are visible to everyone on Litegram. Saved posts are private
          to you.
        </p>
      </section>

      <section className="card border-rose-200 p-5 dark:border-rose-800">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-rose-600">
          <LogOut className="h-4 w-4" /> Session
        </h2>
        <button
          onClick={() => setConfirmSignOut(true)}
          className="btn-outline mt-3 text-sm text-rose-600"
        >
          Sign out
        </button>
      </section>

      <ConfirmDialog
        open={confirmSignOut}
        title="Sign out of Litegram?"
        description="You'll need to sign in again to return to your feed."
        confirmLabel="Sign out"
        danger
        onConfirm={handleSignOut}
        onClose={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
