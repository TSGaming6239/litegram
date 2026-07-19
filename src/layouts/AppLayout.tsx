import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Search,
  Bell,
  Bookmark,
  Plus,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { Avatar } from '../components/Avatar';
import { ThemeToggle } from '../components/ThemeToggle';
import { BirthdayBadge } from '../components/BirthdayBadge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { unreadNotificationCount } from '../services/notifications';
import { cn } from '../utils/cn';

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
  { to: '/explore', label: 'Explore', icon: <Compass className="h-5 w-5" /> },
  { to: '/search', label: 'Search', icon: <Search className="h-5 w-5" /> },
  { to: '/notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  { to: '/saved', label: 'Saved', icon: <Bookmark className="h-5 w-5" /> },
  { to: '/posts/new', label: 'Create', icon: <Plus className="h-5 w-5" /> },
  { to: '/posts/drafts', label: 'Drafts', icon: <FileText className="h-5 w-5" /> },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    let active = true;
    const load = () =>
      unreadNotificationCount(profile.id).then((c) => active && setUnread(c));
    load();
    const t = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, [profile, location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast('Signed out.', 'success');
      navigate('/login');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 glass-strong border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <button
            type="button"
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
            onClick={() => setMobileOpen((s) => !s)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="hidden md:block">
            <Logo />
          </Link>
          <Link to="/" className="md:hidden">
            <Logo size={24} />
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavItemLink key={item.to} item={item} unread={unread} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <ThemeToggle />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((s) => !s)}
                aria-label="Account menu"
                className="rounded-full p-1 hover:ring-2 hover:ring-brand-400"
              >
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.username ?? 'You'}
                  size={32}
                />
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-soft animate-scale-in dark:border-slate-700 dark:bg-slate-900"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-4 py-2">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold">
                      @{profile?.username}
                      <BirthdayBadge birthday={profile?.birthday} />
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {profile?.full_name}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <MenuLink to={`/u/${profile?.username ?? ''}`}>
                    <User className="h-4 w-4" /> Profile
                  </MenuLink>
                  <MenuLink to="/settings">
                    <Settings className="h-4 w-4" /> Settings
                  </MenuLink>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800">
            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item) => (
                <NavItemLink
                  key={item.to}
                  item={item}
                  unread={unread}
                  compact
                />
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavItemLink({
  item,
  unread,
  compact,
}: {
  item: NavItem;
  unread: number;
  compact?: boolean;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors',
          compact && 'flex-col text-xs px-2',
          isActive
            ? 'bg-brand-500 text-white'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        )
      }
    >
      <span className="relative">
        {item.icon}
        {item.to === '/notifications' && unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </span>
      <span className={cn(compact && 'sr-only sm:not-sr-only')}>{item.label}</span>
    </NavLink>
  );
}

function MenuLink({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}
