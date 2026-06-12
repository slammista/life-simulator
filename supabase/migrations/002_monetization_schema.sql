-- ============================================================
--  Life Simulator 2D — Monetization & User Management Schema
--  Extends initial schema with accounts, purchases, and entitlements
-- ============================================================

-- ─── Users Profile Table ────────────────────────────────────
-- Extends Supabase auth.users with game-specific fields
CREATE TABLE IF NOT EXISTS public.users (
  id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT        UNIQUE NOT NULL,
  google_id             TEXT        UNIQUE,
  apple_id              TEXT        UNIQUE,
  gems_balance          INTEGER     DEFAULT 0,
  has_no_ads            BOOLEAN     DEFAULT FALSE,
  has_god_mode          BOOLEAN     DEFAULT FALSE,
  migrated_from_local   BOOLEAN     DEFAULT FALSE,
  last_gem_sync         TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON public.users (google_id);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON public.users (apple_id);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Purchases Table ────────────────────────────────────────
-- Track all transactions (gems, no-ads, god-mode)
CREATE TABLE IF NOT EXISTS public.purchases (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_session_id        TEXT        UNIQUE,
  stripe_payment_intent_id TEXT,
  product_type             TEXT        NOT NULL,
  amount_cents             INTEGER     NOT NULL,
  currency                 TEXT        DEFAULT 'EUR',
  status                   TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ,
  metadata                 JSONB
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON public.purchases (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases (status);

DROP TRIGGER IF EXISTS purchases_updated_at ON public.purchases;
CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Entitlements Table ─────────────────────────────────────
-- Track permanent and temporary unlocks (cosmetics, features)
CREATE TABLE IF NOT EXISTS public.entitlements (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entitlement_type   TEXT        NOT NULL,
  granted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at         TIMESTAMPTZ,
  metadata           JSONB
);

CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements (user_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_type ON public.entitlements (entitlement_type);
CREATE INDEX IF NOT EXISTS idx_entitlements_expires ON public.entitlements (expires_at);

-- ─── Past Lives Table (Personal Leaderboard) ────────────────
-- Track completed games per user (not global competitive)
CREATE TABLE IF NOT EXISTS public.past_lives (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  life_number           INTEGER     NOT NULL,
  final_age             INTEGER     NOT NULL,
  final_money           BIGINT      NOT NULL,
  final_gems            INTEGER     NOT NULL,
  trophies_earned       INTEGER     DEFAULT 0,
  achievements_bitmask  BIGINT      DEFAULT 0,
  ended_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT past_lives_user_life_unique UNIQUE (user_id, life_number)
);

CREATE INDEX IF NOT EXISTS idx_past_lives_user_id ON public.past_lives (user_id);
CREATE INDEX IF NOT EXISTS idx_past_lives_user_ended ON public.past_lives (user_id, ended_at DESC);
CREATE INDEX IF NOT EXISTS idx_past_lives_trophies ON public.past_lives (user_id, trophies_earned DESC);

-- ─── RLS — Row Level Security ────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_lives ENABLE ROW LEVEL SECURITY;

-- Users: each user can only read/write their own row
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Purchases: users can read own; only backend (service_role) can write
DROP POLICY IF EXISTS "purchases_select_own" ON public.purchases;

CREATE POLICY "purchases_select_own" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Entitlements: users can read own; only backend can write
DROP POLICY IF EXISTS "entitlements_select_own" ON public.entitlements;

CREATE POLICY "entitlements_select_own" ON public.entitlements
  FOR SELECT USING (auth.uid() = user_id);

-- Past Lives: users can read own; only backend increments on game-over
DROP POLICY IF EXISTS "past_lives_select_own" ON public.past_lives;

CREATE POLICY "past_lives_select_own" ON public.past_lives
  FOR SELECT USING (auth.uid() = user_id);

-- ─── Helper Function: Get user with entitlements ──────────────
-- Called by Edge Functions to check permissions
CREATE OR REPLACE FUNCTION public.get_user_with_entitlements(user_id UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  gems_balance INTEGER,
  has_no_ads BOOLEAN,
  has_god_mode BOOLEAN,
  entitlements TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.gems_balance,
    u.has_no_ads,
    u.has_god_mode,
    COALESCE(array_agg(DISTINCT e.entitlement_type) FILTER (WHERE e.expires_at IS NULL OR e.expires_at > NOW()), ARRAY[]::TEXT[])
  FROM public.users u
  LEFT JOIN public.entitlements e ON e.user_id = u.id
  WHERE u.id = user_id
  GROUP BY u.id, u.email, u.gems_balance, u.has_no_ads, u.has_god_mode;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── Verification query ──────────────────────────────────────
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'users%' OR tablename LIKE 'purchases%' OR tablename LIKE 'entitlements%' OR tablename LIKE 'past_lives%';
