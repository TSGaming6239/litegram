import { Link } from 'react-router-dom';
import {
  Sparkles,
  Heart,
  Bell,
  Image as ImageIcon,
  Compass,
  Smile,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

const features = [
  {
    icon: <Smile className="h-5 w-5" />,
    title: 'Mood Tags',
    description: 'Tag every post with how it felt — happy, chill, motivated, and more.',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'AI Caption Ideas',
    description: 'Stuck on words? Generate creative caption suggestions instantly.',
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: 'Daily Prompts',
    description: 'A fresh creative challenge every day to spark your next post.',
  },
  {
    icon: <Heart className="h-5 w-5" />,
    title: 'Quick Reactions',
    description: 'Go beyond likes — love, laugh, fire, and wow your friends.',
  },
  {
    icon: <Compass className="h-5 w-5" />,
    title: 'Discover & Explore',
    description: 'Find trending posts, popular creators, and new voices.',
  },
  {
    icon: <ImageIcon className="h-5 w-5" />,
    title: 'Save Collections',
    description: 'Bookmark posts you love and revisit them anytime.',
  },
];

export default function Landing() {
  const { session } = useAuth();
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-rose-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-300/40 blur-3xl dark:bg-brand-700/20" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent-300/40 blur-3xl dark:bg-accent-700/20" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link to="/feed" className="btn-primary">
              Open app <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <span className="chip glass-strong mx-auto text-xs text-brand-700 dark:text-brand-200">
          <Sparkles className="h-3.5 w-3.5" /> A lighter, brighter social space
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
          Share your light,{' '}
          <span className="bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
            one moment at a time
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
          Litegram is a premium social space for sharing moments, moods, and
          stories — without the noise. Beautiful by design, calm by default.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-primary text-base">
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/explore" className="btn-outline text-base">
            Explore the feed
          </Link>
        </div>

        <div className="relative mx-auto mt-14 max-w-4xl">
          <div className="card overflow-hidden p-0 shadow-glow">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-brand-100 to-accent-100 dark:from-slate-800 dark:to-slate-900"
                  style={{
                    backgroundImage: `url(https://images.pexels.com/photos/${
                      [1108099, 20787, 3225517, 1190297, 414619, 1108572][i - 1]
                    }/pexels-photo-${
                      [1108099, 20787, 3225517, 1190297, 414619, 1108572][i - 1]
                    }.jpeg?auto=compress&cs=tinysrgb&w=400)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6 transition-transform hover:-translate-y-1">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-500">
                {f.icon}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-200/70 px-6 py-8 text-center text-sm text-slate-500 dark:border-slate-800">
        <Logo size={22} className="mb-3 justify-center" />
        <p>Litegram — share your light. Built with React, Vite, and Supabase.</p>
      </footer>
    </div>
  );
}
