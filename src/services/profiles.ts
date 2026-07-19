import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Profile | null) ?? null;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Profile | null) ?? null;
}

export async function updateProfile(
  id: string,
  patch: Partial<Pick<Profile, 'username' | 'full_name' | 'avatar_url' | 'cover_url' | 'bio' | 'website' | 'location' | 'birthday' | 'accent_color'>>
): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getProfileStats(userId: string): Promise<{
  posts: number;
  followers: number;
  following: number;
}> {
  const [postsQ, followersQ, followingQ] = await Promise.all([
    supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('followee_id', userId),
    supabase
      .from('follows')
      .select('followee_id', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ]);
  if (postsQ.error) throw new Error(postsQ.error.message);
  if (followersQ.error) throw new Error(followersQ.error.message);
  if (followingQ.error) throw new Error(followingQ.error.message);
  return {
    posts: postsQ.count ?? 0,
    followers: followersQ.count ?? 0,
    following: followingQ.count ?? 0,
  };
}

export async function isFollowing(
  followerId: string,
  followeeId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export async function follow(followerId: string, followeeId: string): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, followee_id: followeeId });
  if (error) throw new Error(error.message);
  await supabase.from('notifications').insert({
    user_id: followeeId,
    actor_id: followerId,
    type: 'follow',
  });
}

export async function unfollow(
  followerId: string,
  followeeId: string
): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId);
  if (error) throw new Error(error.message);
}

export async function getFollowers(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(*)')
    .eq('followee_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => d.profiles as unknown as Profile);
}

export async function getFollowing(userId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_followee_id_fkey(*)')
    .eq('follower_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => d.profiles as unknown as Profile);
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function getSuggestedProfiles(
  currentUserId: string,
  limit = 6
): Promise<Profile[]> {
  const { data: followingIds, error: fErr } = await supabase
    .from('follows')
    .select('followee_id')
    .eq('follower_id', currentUserId);
  if (fErr) throw new Error(fErr.message);
  const exclude = [currentUserId, ...(followingIds ?? []).map((f) => f.followee_id)];
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'in', `(${exclude.map((id) => `'${id}'`).join(',')})`)
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function getUserPosts(userId: string): Promise<
  { id: string; image_url: string; caption: string | null; created_at: string; pinned: boolean }[]
> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, image_url, caption, created_at, pinned')
    .eq('user_id', userId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function computeProfileCompletion(
  profile: { avatar_url: string | null; cover_url: string | null; bio: string | null; website: string | null; location: string | null; birthday: string | null } | null,
  hasFirstPost: boolean
): { percent: number; missing: string[] } {
  if (!profile) return { percent: 0, missing: ['profile'] };
  const checks: { label: string; ok: boolean }[] = [
    { label: 'Profile picture', ok: !!profile.avatar_url },
    { label: 'Cover photo', ok: !!profile.cover_url },
    { label: 'Bio', ok: !!profile.bio && profile.bio.trim().length > 0 },
    { label: 'Birthday', ok: !!profile.birthday },
    { label: 'Website', ok: !!profile.website },
    { label: 'Location', ok: !!profile.location },
    { label: 'First post', ok: hasFirstPost },
  ];
  const done = checks.filter((c) => c.ok).length;
  const percent = Math.round((done / checks.length) * 100);
  const missing = checks.filter((c) => !c.ok).map((c) => c.label);
  return { percent, missing };
}

export async function getSavedPosts(userId: string) {
  const { data, error } = await supabase
    .from('saved_posts')
    .select(
      'post_id, posts!inner(id, image_url, caption, created_at, user_id, profiles!posts_user_id_fkey(id, username, avatar_url))'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Array<{
    posts: {
      id: string;
      image_url: string;
      caption: string | null;
      created_at: string;
      user_id: string;
      profiles: { id: string; username: string; avatar_url: string | null };
    };
  }>).map((s) => s.posts);
}

export async function awardAchievements(
  userId: string
): Promise<{ achievement_id: number; key: string; label: string; icon: string }[]> {
  const { data, error } = await supabase.rpc('award_achievements', {
    p_user_id: userId,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as {
    achievement_id: number;
    key: string;
    label: string;
    icon: string;
  }[];
}

export async function getUserAchievements(userId: string) {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(
      'achievement_id, awarded_at, achievements!inner(id, key, label, description, icon)'
    )
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    ...d,
    achievement: d.achievements as unknown as {
      id: number;
      key: string;
      label: string;
      description: string;
      icon: string;
    },
  }));
}
