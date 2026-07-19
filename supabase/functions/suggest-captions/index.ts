import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mood = (body?.mood as string) || 'happy';
    const topic = (body?.topic as string) || '';
    const seed = (body?.seed as string) || `${Date.now()}`;

    const captions = generateCaptions(mood, topic, seed);
    return new Response(JSON.stringify({ captions }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateCaptions(mood: string, topic: string, seed: string): string[] {
  const moodMap: Record<string, { emoji: string; tone: string }> = {
    happy: { emoji: '😊', tone: 'bright, joyful' },
    chill: { emoji: '😎', tone: 'laid-back, easygoing' },
    motivated: { emoji: '💪', tone: 'driven, energized' },
    travel: { emoji: '🌍', tone: 'adventurous, curious' },
    food: { emoji: '🍔', tone: 'hungry, indulgent' },
    gaming: { emoji: '🎮', tone: 'playful, focused' },
    study: { emoji: '📚', tone: 'thoughtful, dedicated' },
    thoughtful: { emoji: '🤔', tone: 'reflective, calm' },
  };
  const m = moodMap[mood] ?? moodMap.happy;
  const t = topic.trim();

  const templates = [
    `${m.emoji} ${t ? `${capitalize(t)} — ` : ''}captured exactly how it felt.`,
    `${m.emoji} A little moment worth keeping.`,
    `${m.emoji} ${t ? capitalize(t) + ', ' : ''}but make it ${m.tone}.`,
    `${m.emoji} Today's ${t ? t : 'moment'} hits different.`,
    `${m.emoji} Slow it down. ${t ? capitalize(t) : 'This'} deserves a second look.`,
    `${m.emoji} ${t ? capitalize(t) + ' ' : ''}in its purest form.`,
    `${m.emoji} No caption needed, but here we are.`,
    `${m.emoji} Saving this one for later — ${t || 'me'}.`,
  ];

  const rng = mulberry32(hashString(seed));
  const shuffled = [...templates].sort(() => rng() - 0.5);
  return shuffled.slice(0, 5);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
