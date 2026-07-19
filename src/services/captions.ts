import { supabase } from '../lib/supabase';

export async function suggestCaptions(
  mood: string,
  topic: string,
  seed?: string
): Promise<string[]> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-captions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };
  const session = (await supabase.auth.getSession()).data.session;
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mood, topic, seed: seed ?? `${Date.now()}` }),
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  const data = await res.json();
  if (!Array.isArray(data?.captions)) {
    throw new Error('Unexpected response from caption service.');
  }
  return data.captions as string[];
}
