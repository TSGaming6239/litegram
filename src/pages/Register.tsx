import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { isValidEmail, isValidUsername, passwordStrength } from '../utils/validation';
import { Spinner } from '../components/Spinner';
import { cn } from '../utils/cn';

export default function Register() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});

  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!isValidUsername(username))
      next.username = '3–20 chars: letters, numbers, dot, underscore.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email.';
    if (password.length < 6) next.password = 'At least 6 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await signUp(email, password, username);
      toast('Account created. Welcome to Litegram!', 'success');
      navigate('/feed');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join Litegram in seconds — it's free.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="username"
              type="text"
              autoComplete="username"
              className="input pl-9"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={!!errors.username}
            />
          </div>
          {errors.username && (
            <p className="mt-1 text-xs text-rose-500">{errors.username}</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="input pl-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pl-9 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {password && (
            <div className="mt-2 flex items-center gap-1.5">
              {['weak', 'medium', 'strong'].map((lvl) => (
                <span
                  key={lvl}
                  className={cn(
                    'h-1.5 flex-1 rounded-full',
                    strength === 'weak' && lvl === 'weak' && 'bg-rose-500',
                    strength === 'medium' &&
                      (lvl === 'weak' || lvl === 'medium') &&
                      'bg-amber-500',
                    strength === 'strong' && 'bg-emerald-500',
                    !(
                      (strength === 'weak' && lvl === 'weak') ||
                      (strength === 'medium' &&
                        (lvl === 'weak' || lvl === 'medium')) ||
                      strength === 'strong'
                    ) && 'bg-slate-200 dark:bg-slate-800'
                  )}
                />
              ))}
              <span className="text-xs text-slate-500">{strength}</span>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-xs text-rose-500">{errors.password}</p>
          )}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? <Spinner className="h-4 w-4 text-white" /> : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
