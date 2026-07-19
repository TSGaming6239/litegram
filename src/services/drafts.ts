import { supabase } from '../lib/supabase';
import type { Draft } from '../types';

export async function listDrafts(userId: string): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Draft[];
}

export async function saveDraft(input: {
  image_url?: string | null;
  caption?: string | null;
  mood_key?: string | null;
  location?: string | null;
}): Promise<string> {
  const { data, error } = await supabase
    .from('drafts')
    .insert(input)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updateDraft(
  id: string,
  patch: {
    image_url?: string | null;
    caption?: string | null;
    mood_key?: string | null;
    location?: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('drafts')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteDraft(id: string): Promise<void> {
  const { error } = await supabase.from('drafts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getDraft(id: string): Promise<Draft | null> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Draft | null) ?? null;
}
