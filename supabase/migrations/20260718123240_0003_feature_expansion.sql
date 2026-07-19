/*
# Litegram — Feature expansion

## Purpose
Add columns and tables for the second wave of Litegram features:
pinned posts, drafts, birthday, accent color, and daily login streak.

## New Tables
1. `drafts` — unfinished posts saved by a user
   - id, user_id, image_url, caption, mood_key, location, created_at, updated_at

## Modified Tables
1. `profiles`
   - `birthday` date (nullable) — used only for the birthday badge
   - `accent_color` text (default 'brand') — theme accent preference
2. `posts`
   - `pinned` boolean (default false) — pinned to profile (max 3 enforced in app)

## Security
- `drafts` is owner-only (SELECT/INSERT/UPDATE/DELETE).
- New `profiles` columns inherit existing profile policies.
- New `posts.pinned` column inherits existing post policies; pinning is
  owner-only via the existing UPDATE policy (which checks auth.uid() = user_id).

## Notes
- Idempotent — safe to re-run.
- No data loss; only additive changes.
*/

-- =========================================================
-- profiles: birthday + accent_color
-- =========================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT 'brand';

-- =========================================================
-- posts: pinned flag
-- =========================================================
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS posts_pinned_user_idx ON posts (user_id, pinned);

-- =========================================================
-- drafts
-- =========================================================
CREATE TABLE IF NOT EXISTS drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text,
  caption text,
  mood_key text REFERENCES mood_tags(key) ON DELETE SET NULL,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "drafts_select_own" ON drafts;
CREATE POLICY "drafts_select_own" ON drafts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "drafts_insert_own" ON drafts;
CREATE POLICY "drafts_insert_own" ON drafts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "drafts_update_own" ON drafts;
CREATE POLICY "drafts_update_own" ON drafts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "drafts_delete_own" ON drafts;
CREATE POLICY "drafts_delete_own" ON drafts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- =========================================================
-- login streak: track in profiles to avoid a new table
-- =========================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login_date date;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_streak int NOT NULL DEFAULT 0;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS longest_streak int NOT NULL DEFAULT 0;

-- =========================================================
-- achievements: streak badges
-- =========================================================
INSERT INTO achievements (id, key, label, description, icon) VALUES
  (5, 'streak_3', '3-Day Streak', 'Logged in 3 days in a row', 'calendar'),
  (6, 'streak_7', '7-Day Streak', 'Logged in 7 days in a row', 'flame'),
  (7, 'streak_30', '30-Day Streak', 'Logged in 30 days in a row', 'trophy'),
  (8, 'birthday', 'Birthday Set', 'Added a birthday to your profile', 'cake')
ON CONFLICT (id) DO NOTHING;
