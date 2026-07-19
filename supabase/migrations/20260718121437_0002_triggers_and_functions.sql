/*
# Litegram — Triggers & Functions

## Purpose
1. Auto-create a `profiles` row whenever a new auth.users row is inserted,
   so sign-up produces a profile without client action.
2. Provide an RPC `award_achievements(p_user_id)` that checks and inserts
   any newly-earned achievements for a user. Called from the client after
   posting / liking.

## Notes
- `handle_new_user` reads username/email from raw_user_meta_data if present,
  otherwise derives from email.
- Safe to re-run.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username text;
BEGIN
  v_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (new.id, v_username, v_username)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.award_achievements(p_user_id uuid)
RETURNS TABLE (achievement_id smallint, key text, label text, icon text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_count int;
  v_total_likes int;
  v_post_days int;
BEGIN
  SELECT count(*) INTO v_post_count FROM posts WHERE user_id = p_user_id;
  SELECT count(*) INTO v_total_likes
    FROM likes l JOIN posts p ON p.id = l.post_id
    WHERE p.user_id = p_user_id;
  SELECT count(DISTINCT date_trunc('day', created_at)) INTO v_post_days
    FROM posts WHERE user_id = p_user_id;

  IF v_post_count >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 1) ON CONFLICT DO NOTHING;
  END IF;
  IF v_post_count >= 10 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 2) ON CONFLICT DO NOTHING;
  END IF;
  IF v_total_likes >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 3) ON CONFLICT DO NOTHING;
  END IF;
  IF v_post_days >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    VALUES (p_user_id, 4) ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
    SELECT ua.achievement_id, a.key, a.label, a.icon
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id;
END;
$$;
