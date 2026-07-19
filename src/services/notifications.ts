import { supabase } from '../lib/supabase';
import type { NotificationWithActor } from '../types';

export async function fetchNotifications(
  userId: string
): Promise<NotificationWithActor[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(
      'id, user_id, actor_id, type, post_id, read, created_at, actor:profiles!notifications_actor_id_fkey(id, username, avatar_url), posts(id, image_url)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as NotificationWithActor[];
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw new Error(error.message);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
