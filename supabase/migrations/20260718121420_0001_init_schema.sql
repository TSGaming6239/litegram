/*
# Litegram — Initial Schema

## Purpose
Litegram is a multi-user social media app (sign-in required). This migration
creates the full data model: profiles, posts, comments, likes, reactions,
follows, saved posts, notifications, achievements, mood tags, and daily
prompts. Storage buckets for avatars/covers/post images are also created.

## New Tables
1. `profiles` — public user profile data (one row per auth user)
   - id (uuid, PK, matches auth.users.id)
   - username (text, unique, not null)
   - full_name (text)
   - avatar_url, cover_url (text)
   - bio, website, location (text)
   - created_at (timestamptz)
2. `posts` — user posts with image + caption + optional mood/location/prompt
   - id, user_id, image_url, caption, mood, location, prompt_id
   - created_at
3. `post_images` — carousel images for posts (1..n)
   - id, post_id, image_url, position
4. `comments` — comments on posts
   - id, post_id, user_id, content, created_at
5. `likes` — simple likes on posts (one per user per post)
   - post_id, user_id (composite PK)
6. `reactions` — quick reactions (love, funny, fire, wow)
   - id, post_id, user_id, kind, created_at (unique per user/post/kind)
7. `follows` — follower/following relationship
   - follower_id, followee_id (composite PK)
8. `saved_posts` — bookmarks
   - user_id, post_id (composite PK)
9. `notifications` — likes, comments, follows events
   - id, user_id (recipient), actor_id, type, post_id, read, created_at
10. `achievements` — badge definitions (seeded)
    - id, key, label, description, icon
11. `user_achievements` — awarded badges
    - id, user_id, achievement_id, awarded_at
12. `mood_tags` — canonical list of mood tags
    - id, key, label, emoji
13. `daily_prompts` — one creative prompt per day
    - id, prompt_text, day (date unique)
14. `post_likes_count` / `post_comments_count` — kept as aggregates via RPC
    (No materialized count tables; counts derived from joins for simplicity.)

## Storage Buckets
- `avatars` — public profile pictures
- `covers` — public cover images
- `posts` — public post images

## Security (RLS)
- All tables have RLS enabled.
- Profiles are readable by anyone (authenticated + anon); writable only by owner.
- Posts/comments/etc readable by anyone authenticated; writable by owner.
- Notifications readable by recipient only.
- Achievements/mood_tags/daily_prompts readable by anyone authenticated.

## Notes
1. This migration is idempotent — safe to re-run.
2. Owner columns default to auth.uid() so client inserts omit user_id safely.
3. Email confirmation stays OFF (default).
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  cover_url text,
  bio text,
  website text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =========================================================
-- MOOD TAGS (seeded)
-- =========================================================
CREATE TABLE IF NOT EXISTS mood_tags (
  id smallint PRIMARY KEY,
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  emoji text NOT NULL
);
ALTER TABLE mood_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mood_tags_select_all" ON mood_tags;
CREATE POLICY "mood_tags_select_all" ON mood_tags FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO mood_tags (id, key, label, emoji) VALUES
  (1, 'happy', 'Happy', '😊'),
  (2, 'chill', 'Chill', '😎'),
  (3, 'motivated', 'Motivated', '💪'),
  (4, 'travel', 'Travel', '🌍'),
  (5, 'food', 'Food', '🍔'),
  (6, 'gaming', 'Gaming', '🎮'),
  (7, 'study', 'Study', '📚'),
  (8, 'thoughtful', 'Thoughtful', '🤔')
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- DAILY PROMPTS
-- =========================================================
CREATE TABLE IF NOT EXISTS daily_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text text NOT NULL,
  day date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE daily_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_prompts_select_all" ON daily_prompts;
CREATE POLICY "daily_prompts_select_all" ON daily_prompts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "daily_prompts_insert_authed" ON daily_prompts;
CREATE POLICY "daily_prompts_insert_authed" ON daily_prompts FOR INSERT
  TO authenticated WITH CHECK (true);

-- =========================================================
-- POSTS
-- =========================================================
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  mood_key text REFERENCES mood_tags(key) ON DELETE SET NULL,
  location text,
  prompt_id uuid REFERENCES daily_prompts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON posts;
CREATE POLICY "posts_select_all" ON posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON posts;
CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_update_own" ON posts;
CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_delete_own" ON posts;
CREATE POLICY "posts_delete_own" ON posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts (user_id);

-- =========================================================
-- POST IMAGES (carousel)
-- =========================================================
CREATE TABLE IF NOT EXISTS post_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  position smallint NOT NULL DEFAULT 0
);
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_images_select_all" ON post_images;
CREATE POLICY "post_images_select_all" ON post_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "post_images_insert_own" ON post_images;
CREATE POLICY "post_images_insert_own" ON post_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "post_images_delete_own" ON post_images;
CREATE POLICY "post_images_delete_own" ON post_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM posts p WHERE p.id = post_id AND p.user_id = auth.uid())
  );

-- =========================================================
-- COMMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON comments;
CREATE POLICY "comments_delete_own" ON comments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id, created_at);

-- =========================================================
-- LIKES
-- =========================================================
CREATE TABLE IF NOT EXISTS likes (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_all" ON likes;
CREATE POLICY "likes_select_all" ON likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert_own" ON likes;
CREATE POLICY "likes_insert_own" ON likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete_own" ON likes;
CREATE POLICY "likes_delete_own" ON likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- REACTIONS (quick reactions)
-- =========================================================
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id, kind)
);
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reactions_select_all" ON reactions;
CREATE POLICY "reactions_select_all" ON reactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reactions_insert_own" ON reactions;
CREATE POLICY "reactions_insert_own" ON reactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_delete_own" ON reactions;
CREATE POLICY "reactions_delete_own" ON reactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- FOLLOWS
-- =========================================================
CREATE TABLE IF NOT EXISTS follows (
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select_all" ON follows;
CREATE POLICY "follows_select_all" ON follows FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON follows;
CREATE POLICY "follows_insert_own" ON follows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_delete_own" ON follows FOR DELETE
  TO authenticated USING (auth.uid() = follower_id);

-- =========================================================
-- SAVED POSTS
-- =========================================================
CREATE TABLE IF NOT EXISTS saved_posts (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_select_own" ON saved_posts;
CREATE POLICY "saved_select_own" ON saved_posts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_insert_own" ON saved_posts;
CREATE POLICY "saved_insert_own" ON saved_posts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_delete_own" ON saved_posts;
CREATE POLICY "saved_delete_own" ON saved_posts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);

-- =========================================================
-- ACHIEVEMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS achievements (
  id smallint PRIMARY KEY,
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_select_all" ON achievements;
CREATE POLICY "achievements_select_all" ON achievements FOR SELECT
  TO anon, authenticated USING (true);

INSERT INTO achievements (id, key, label, description, icon) VALUES
  (1, 'first_post', 'First Post', 'Published your first post', 'sparkles'),
  (2, 'ten_posts', 'Creator', 'Published 10 posts', 'award'),
  (3, 'hundred_likes', 'Crowd Favorite', 'Earned 100 total likes', 'heart'),
  (4, 'seven_day_streak', 'On Fire', 'Posted on 7 different days', 'flame')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id smallint NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_select_all" ON user_achievements;
CREATE POLICY "user_achievements_select_all" ON user_achievements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_achievements_insert_own" ON user_achievements;
CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('posts', 'posts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('avatars', 'covers', 'posts'));

DROP POLICY IF EXISTS "avatars_authed_insert" ON storage.objects;
CREATE POLICY "avatars_authed_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars', 'covers', 'posts'));

DROP POLICY IF EXISTS "avatars_authed_update" ON storage.objects;
CREATE POLICY "avatars_authed_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars', 'covers', 'posts'));

DROP POLICY IF EXISTS "avatars_authed_delete" ON storage.objects;
CREATE POLICY "avatars_authed_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars', 'covers', 'posts'));
