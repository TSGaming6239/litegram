import { supabase } from '../lib/supabase';
import type { PostWithRelations, ReactionKind } from '../types';

const REACTION_KINDS: ReactionKind[] = ['love', 'funny', 'fire', 'wow'];

type FeedOptions = {
  page?: number;
  pageSize?: number;
  moodKey?: string | null;
  followingOnly?: boolean;
  currentUserId?: string;
};

const PAGE_SIZE = 8;

export async function fetchFeed({
  page = 0,
  pageSize = PAGE_SIZE,
  moodKey,
  followingOnly,
  currentUserId,
}: FeedOptions): Promise<PostWithRelations[]> {
  let query = supabase
    .from('posts')
    .select(
      `
      *,
      profiles!posts_user_id_fkey ( id, username, avatar_url, full_name, birthday ),
      post_images ( id, image_url, position ),
      mood_tags ( id, key, label, emoji ),
      daily_prompts ( id, prompt_text )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (moodKey) query = query.eq('mood_key', moodKey);

  if (followingOnly && currentUserId) {
    const { data: followingIds, error: fErr } = await supabase
      .from('follows')
      .select('followee_id')
      .eq('follower_id', currentUserId);
    if (fErr) throw new Error(fErr.message);
    const ids = (followingIds ?? []).map((f) => f.followee_id);
    if (ids.length === 0) return [];
    query = query.in('user_id', ids);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) return [];

  const posts = data as unknown as PostWithRelations[];

  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);

  const [likes, comments, reactions, saved] = await Promise.all([
    supabase.from('likes').select('post_id, user_id').in('post_id', postIds),
    supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds),
    supabase
      .from('reactions')
      .select('post_id, user_id, kind')
      .in('post_id', postIds),
    currentUserId
      ? supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (likes.error) throw new Error(likes.error.message);
  if (comments.error) throw new Error(comments.error.message);
  if (reactions.error) throw new Error(reactions.error.message);

  const likeMap = new Map<string, { count: number; mine: boolean }>();
  for (const l of likes.data ?? []) {
    const cur = likeMap.get(l.post_id) ?? { count: 0, mine: false };
    cur.count += 1;
    if (l.user_id === currentUserId) cur.mine = true;
    likeMap.set(l.post_id, cur);
  }

  const commentMap = new Map<string, number>();
  for (const c of comments.data ?? []) {
    commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1);
  }

  const reactionMap = new Map<
    string,
    { counts: Record<ReactionKind, number>; mine: ReactionKind | null }
  >();
  for (const r of reactions.data ?? []) {
    const entry =
      reactionMap.get(r.post_id) ??
      ({
        counts: { love: 0, funny: 0, fire: 0, wow: 0 } as Record<
          ReactionKind,
          number
        >,
        mine: null,
      });
    const kind = r.kind as ReactionKind;
    if (REACTION_KINDS.includes(kind)) entry.counts[kind] += 1;
    if (r.user_id === currentUserId) entry.mine = kind;
    reactionMap.set(r.post_id, entry);
  }

  const savedSet = new Set<string>(
    (saved.data ?? []).map((s: { post_id: string }) => s.post_id)
  );

  return posts.map((p) => ({
    ...p,
    like_count: likeMap.get(p.id)?.count ?? 0,
    liked_by_me: likeMap.get(p.id)?.mine ?? false,
    comment_count: commentMap.get(p.id) ?? 0,
    reaction_counts: reactionMap.get(p.id)?.counts ?? {
      love: 0,
      funny: 0,
      fire: 0,
      wow: 0,
    },
    my_reaction: reactionMap.get(p.id)?.mine ?? null,
    saved_by_me: savedSet.has(p.id),
  }));
}

export async function fetchPostById(
  id: string,
  currentUserId?: string
): Promise<PostWithRelations | null> {
  const [list] = await fetchFeed({
    page: 0,
    pageSize: 1,
    currentUserId,
  });
  void list;
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      profiles!posts_user_id_fkey ( id, username, avatar_url, full_name, birthday ),
      post_images ( id, image_url, position ),
      mood_tags ( id, key, label, emoji ),
      daily_prompts ( id, prompt_text )
    `
    )
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const post = data as unknown as PostWithRelations;
  const [likes, comments, reactions, saved] = await Promise.all([
    supabase.from('likes').select('user_id').eq('post_id', id),
    supabase.from('comments').select('id').eq('post_id', id),
    supabase.from('reactions').select('user_id, kind').eq('post_id', id),
    currentUserId
      ? supabase
          .from('saved_posts')
          .select('post_id')
          .eq('user_id', currentUserId)
          .eq('post_id', id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (likes.error) throw new Error(likes.error.message);
  if (reactions.error) throw new Error(reactions.error.message);

  const counts: Record<ReactionKind, number> = {
    love: 0,
    funny: 0,
    fire: 0,
    wow: 0,
  };
  let myReaction: ReactionKind | null = null;
  for (const r of (reactions.data ?? []) as { user_id: string; kind: string }[]) {
    const k = r.kind as ReactionKind;
    if (REACTION_KINDS.includes(k)) counts[k] += 1;
    if (r.user_id === currentUserId) myReaction = k;
  }

  return {
    ...post,
    like_count: likes.data?.length ?? 0,
    liked_by_me:
      (likes.data ?? []).some((l) => l.user_id === currentUserId) ?? false,
    comment_count: comments.data?.length ?? 0,
    reaction_counts: counts,
    my_reaction: myReaction,
    saved_by_me: !!saved.data,
  };
}

export async function createPost(input: {
  imageUrl: string;
  caption?: string;
  moodKey?: string | null;
  location?: string;
  promptId?: string | null;
}): Promise<string> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      image_url: input.imageUrl,
      caption: input.caption ?? null,
      mood_key: input.moodKey ?? null,
      location: input.location ?? null,
      prompt_id: input.promptId ?? null,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function updatePost(
  id: string,
  patch: { caption?: string; mood_key?: string | null; location?: string }
): Promise<void> {
  const { error } = await supabase.from('posts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setPostPinned(
  postId: string,
  pinned: boolean
): Promise<void> {
  if (pinned) {
    const { count, error: cErr } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .eq('pinned', true);
    if (cErr) throw new Error(cErr.message);
    if ((count ?? 0) >= 3) {
      throw new Error('You can pin up to 3 posts. Unpin one first.');
    }
  }
  const { error } = await supabase
    .from('posts')
    .update({ pinned })
    .eq('id', postId);
  if (error) throw new Error(error.message);
}

export async function toggleLike(
  postId: string,
  userId: string,
  liked: boolean
): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from('likes')
    .insert({ post_id: postId });
  if (error) throw new Error(error.message);
  await notify(postId, userId, 'like');
}

export async function setReaction(
  postId: string,
  userId: string,
  kind: ReactionKind
): Promise<void> {
  const { error: delErr } = await supabase
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);
  if (delErr) throw new Error(delErr.message);
  const { error: insErr } = await supabase
    .from('reactions')
    .insert({ post_id: postId, kind });
  if (insErr) throw new Error(insErr.message);
}

export async function removeReaction(
  postId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function toggleSave(
  postId: string,
  userId: string,
  saved: boolean
): Promise<void> {
  if (saved) {
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return;
  }
  const { error } = await supabase
    .from('saved_posts')
    .insert({ post_id: postId });
  if (error) throw new Error(error.message);
}

export async function addComment(
  postId: string,
  content: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content });
  if (error) throw new Error(error.message);
  await notify(postId, userId, 'comment');
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);
  if (error) throw new Error(error.message);
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id, post_id, user_id, content, created_at, profiles!comments_user_id_fkey(id, username, avatar_url)'
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Array<{
    id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: { id: string; username: string; avatar_url: string | null } | null;
  }>;
}

async function notify(
  postId: string,
  actorId: string,
  type: 'like' | 'comment'
): Promise<void> {
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle();
  if (!post || post.user_id === actorId) return;
  await supabase.from('notifications').insert({
    user_id: post.user_id,
    actor_id: actorId,
    type,
    post_id: postId,
  });
}
