-- =====================================================================
-- RLS Policies & Triggers — EnStudy-Hub
-- =====================================================================
-- Apply AFTER `pnpm db:push` succeeds (tables must exist first).
-- Run in Supabase Dashboard → SQL Editor → New Query → paste → Run.
-- Idempotent: safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS).
-- =====================================================================

-- ---------- USER STATE: owner-only ----------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_owner" ON profiles;
CREATE POLICY "profiles_owner" ON profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_cards_owner" ON user_cards;
CREATE POLICY "user_cards_owner" ON user_cards
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_logs_owner" ON review_logs;
CREATE POLICY "review_logs_owner" ON review_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "study_sessions_owner" ON study_sessions;
CREATE POLICY "study_sessions_owner" ON study_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_stats_owner" ON user_stats;
CREATE POLICY "user_stats_owner" ON user_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_lessons_owner" ON user_lessons;
CREATE POLICY "user_lessons_owner" ON user_lessons
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- CONTENT: public read for official, owner write ----------

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collections_read" ON collections;
CREATE POLICY "collections_read" ON collections FOR SELECT
  USING (is_official = true OR owner_id = auth.uid());
DROP POLICY IF EXISTS "collections_write" ON collections;
CREATE POLICY "collections_write" ON collections FOR INSERT
  WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "collections_update" ON collections;
CREATE POLICY "collections_update" ON collections FOR UPDATE
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
DROP POLICY IF EXISTS "collections_delete" ON collections;
CREATE POLICY "collections_delete" ON collections FOR DELETE
  USING (owner_id = auth.uid());

-- MVP: topics/lessons/cards readable by all authenticated, writes admin-only.
-- Tighten with collection-join policies post-MVP.
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "topics_read_auth" ON topics;
CREATE POLICY "topics_read_auth" ON topics FOR SELECT TO authenticated USING (true);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lessons_read_auth" ON lessons;
CREATE POLICY "lessons_read_auth" ON lessons FOR SELECT TO authenticated USING (true);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cards_read_auth" ON cards;
CREATE POLICY "cards_read_auth" ON cards FOR SELECT TO authenticated USING (true);

-- ---------- AUTO-CREATE PROFILE + USER_STATS ON SIGNUP --------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- DONE. Verify with:
--   SELECT schemaname, tablename, policyname FROM pg_policies
--     WHERE schemaname = 'public' ORDER BY tablename;
-- =====================================================================
