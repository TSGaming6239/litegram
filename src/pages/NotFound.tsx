import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-cyan-50 px-6 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-300/40 blur-3xl dark:bg-brand-700/20" />
      <div className="relative z-10 text-center">
        <Logo className="mb-6 justify-center" />
        <p className="font-display text-7xl font-extrabold tracking-tight text-brand-500">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="btn-outline">
            <Compass className="h-4 w-4" /> Back home
          </Link>
          <Link to="/feed" className="btn-primary">
            Go to feed
          </Link>
        </div>
      </div>
    </div>
  );
}
