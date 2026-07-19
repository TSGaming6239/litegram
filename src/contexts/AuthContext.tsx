import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load profile', error.message);
      return;
    }
    setProfile(data as Profile | null);
    await updateLoginStreak(userId);
  }, []);

async function updateLoginStreak(userId: string) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const { data: p } = await supabase
    .from('profiles')
    .select('last_login_date, login_streak, longest_streak')
    .eq('id', userId)
    .maybeSingle();
  if (!p) return;
  const last = p.last_login_date as string | null;
  if (last === todayStr) return;
  let newStreak = 1;
  if (last) {
    const lastDate = new Date(last + 'T00:00:00Z');
    const diffDays =
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 1 && diffDays < 2) newStreak = (p.login_streak ?? 0) + 1;
    else newStreak = 1;
  }
  const longest = Math.max(p.longest_streak ?? 0, newStreak);
  await supabase
    .from('profiles')
    .update({
      last_login_date: todayStr,
      login_streak: newStreak,
      longest_streak: longest,
    })
    .eq('id', userId);
  // Award streak badges
  const streakAchievements: Record<number, number> = {
    3: 5,
    7: 6,
    30: 7,
  };
  const achId = streakAchievements[newStreak];
  if (achId) {
    await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_id: achId });
  }
}

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      const userId = data.session?.user.id;
      if (userId) {
        loadProfile(userId).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      (async () => {
        if (event === 'SIGNED_OUT' || !sess) {
          setSession(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setSession(sess);
        if (sess.user.id) {
          await loadProfile(sess.user.id);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username: string) => {
      const cleanUsername = username.trim();
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();
      if (existing) {
        throw new Error('That username is already taken.');
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: cleanUsername } },
      });
      if (error) throw new Error(error.message);
      if (data.session) {
        setSession(data.session);
        await loadProfile(data.session.user.id);
      }
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
