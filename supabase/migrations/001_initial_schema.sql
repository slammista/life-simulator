-- ============================================================
--  Life Simulator 2D — Supabase Initial Schema
--  Run this in: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Saves table ─────────────────────────────────────────────────
-- One save slot per authenticated user.
-- save_data holds the full serialized GameState JSONB.
CREATE TABLE IF NOT EXISTS public.saves (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  save_data    JSONB       NOT NULL,
  save_version TEXT        NOT NULL DEFAULT '1.0',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT saves_user_unique UNIQUE (user_id)
);

-- Index for fast single-user lookup
CREATE INDEX IF NOT EXISTS idx_saves_user_id ON public.saves (user_id);

-- Auto-update updated_at on every row write
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS saves_updated_at ON public.saves;
CREATE TRIGGER saves_updated_at
  BEFORE UPDATE ON public.saves
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Leaderboard table ───────────────────────────────────────────
-- One entry per user per category — upsert on conflict.
CREATE TABLE IF NOT EXISTS public.leaderboard (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT        NOT NULL DEFAULT 'Anonymous',
  category     TEXT        NOT NULL CHECK (category IN ('longevity','wealth','happiness','karma','ribbons')),
  score        INTEGER     NOT NULL DEFAULT 0,
  age_reached  INTEGER,
  ribbons_count INTEGER     DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leaderboard_user_category_unique UNIQUE (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_category_score ON public.leaderboard (category, score DESC);

DROP TRIGGER IF EXISTS leaderboard_updated_at ON public.leaderboard;
CREATE TRIGGER leaderboard_updated_at
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS — Row Level Security ────────────────────────────────────

ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Saves: each user can only see and write their own row
DROP POLICY IF EXISTS "saves_select_own"  ON public.saves;
DROP POLICY IF EXISTS "saves_insert_own"  ON public.saves;
DROP POLICY IF EXISTS "saves_update_own"  ON public.saves;
DROP POLICY IF EXISTS "saves_delete_own"  ON public.saves;

CREATE POLICY "saves_select_own"  ON public.saves
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saves_insert_own"  ON public.saves
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saves_update_own"  ON public.saves
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "saves_delete_own"  ON public.saves
  FOR DELETE USING (auth.uid() = user_id);

-- Leaderboard: everyone can read, only owner can write own row
DROP POLICY IF EXISTS "leaderboard_select_all"  ON public.leaderboard;
DROP POLICY IF EXISTS "leaderboard_insert_own"  ON public.leaderboard;
DROP POLICY IF EXISTS "leaderboard_update_own"  ON public.leaderboard;

CREATE POLICY "leaderboard_select_all" ON public.leaderboard
  FOR SELECT USING (true);

CREATE POLICY "leaderboard_insert_own" ON public.leaderboard
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leaderboard_update_own" ON public.leaderboard
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── Verification query ──────────────────────────────────────────
-- Run this to confirm everything is set up correctly:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- SELECT policyname, tablename, cmd FROM pg_policies WHERE schemaname = 'public';
