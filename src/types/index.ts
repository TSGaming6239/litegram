import type { Database } from '../lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type MoodTag = Database['public']['Tables']['mood_tags']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type UserAchievement =
  Database['public']['Tables']['user_achievements']['Row'];
export type DailyPrompt = Database['public']['Tables']['daily_prompts']['Row'];
export type NotificationRow =
  Database['public']['Tables']['notifications']['Row'];
export type Reaction = Database['public']['Tables']['reactions']['Row'];

export type ReactionKind = 'love' | 'funny' | 'fire' | 'wow';

export type PostWithRelations = Post & {
  profiles:
    | (Pick<Profile, 'id' | 'username' | 'avatar_url' | 'full_name'> & {
        birthday?: string | null;
      })
    | null;
  post_images: { id: string; image_url: string; position: number }[];
  mood_tags?: MoodTag | null;
  daily_prompts?: Pick<DailyPrompt, 'id' | 'prompt_text'> | null;
  like_count?: number;
  comment_count?: number;
  reaction_counts?: Record<ReactionKind, number>;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
  my_reaction?: ReactionKind | null;
};

export type Draft = Database['public']['Tables']['drafts']['Row'];

export type NotificationWithActor = NotificationRow & {
  actor: Pick<Profile, 'id' | 'username' | 'avatar_url'> | null;
  posts: Pick<Post, 'id' | 'image_url'> | null;
};

export type AuthUser = {
  id: string;
  email: string;
};
