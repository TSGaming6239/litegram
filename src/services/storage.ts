import { supabase } from '../lib/supabase';

export async function uploadImage(
  bucket: 'avatars' | 'covers' | 'posts',
  file: File,
  folder = ''
): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${folder}${folder ? '/' : ''}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
