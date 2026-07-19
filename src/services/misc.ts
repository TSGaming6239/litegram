import { supabase } from '../lib/supabase';
import type { MoodTag, DailyPrompt } from '../types';

export async function fetchMoodTags(): Promise<MoodTag[]> {
  const { data, error } = await supabase
    .from('mood_tags')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as MoodTag[];
}

export async function fetchTodayPrompt(): Promise<DailyPrompt | null> {
  const { data, error } = await supabase
    .from('daily_prompts')
    .select('*')
    .order('day', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as DailyPrompt | null) ?? null;
}

export async function ensureTodayPrompt(): Promise<DailyPrompt | null> {
  const existing = await fetchTodayPrompt();
  if (existing) return existing;
  const prompts = [
    'Share something that made you smile today.',
    'Capture the quietest moment of your day.',
    'What color is your mood right now?',
    'Show us a tiny detail that caught your eye.',
    'Tell the story of an ordinary object nearby.',
    'Share a view from where you are right now.',
    'What is one small win from today?',
    'Capture light in an unexpected place.',
  ];
  const text = prompts[new Date().getDate() % prompts.length];
  const { data, error } = await supabase
    .from('daily_prompts')
    .insert({ prompt_text: text })
    .select()
    .single();
  if (error) {
    return fetchTodayPrompt();
  }
  return data as DailyPrompt;
}

export async function fetchTrendingPosts(
  currentUserId?: string
): Promise<{ id: string; image_url: string; caption: string | null }[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, image_url, caption')
    .order('created_at', { ascending: false })
    .limit(24);
  if (error) throw new Error(error.message);
  void currentUserId;
  return data ?? [];
}
