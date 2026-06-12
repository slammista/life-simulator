-- ============================================================
--  Helper Functions for Monetization System
-- ============================================================

-- ─── Atomic Gem Increment ────────────────────────────────────
-- Safe way to increment gems without race conditions
CREATE OR REPLACE FUNCTION public.increment_user_gems(
  user_id UUID,
  amount INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  UPDATE public.users
  SET gems_balance = gems_balance + amount
  WHERE id = user_id
  RETURNING gems_balance INTO new_balance;

  RETURN COALESCE(new_balance, 0);
END;
$$ LANGUAGE plpgsql STRICT;

-- ─── Get User Leaderboard ────────────────────────────────────
-- Get past lives sorted by trophies (personal leaderboard)
CREATE OR REPLACE FUNCTION public.get_user_leaderboard(user_id UUID)
RETURNS TABLE (
  life_number INTEGER,
  final_age INTEGER,
  final_money BIGINT,
  final_gems INTEGER,
  trophies_earned INTEGER,
  ended_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.life_number,
    pl.final_age,
    pl.final_money,
    pl.final_gems,
    pl.trophies_earned,
    pl.ended_at
  FROM public.past_lives pl
  WHERE pl.user_id = $1
  ORDER BY pl.trophies_earned DESC, pl.ended_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ─── Get Global Leaderboard (Top 100 by trophies) ────────────
CREATE OR REPLACE FUNCTION public.get_global_leaderboard()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  total_trophies INTEGER,
  total_lives INTEGER,
  avg_final_money NUMERIC,
  best_age INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pl.user_id,
    u.email,
    SUM(pl.trophies_earned)::INTEGER as total_trophies,
    COUNT(DISTINCT pl.life_number)::INTEGER as total_lives,
    AVG(pl.final_money)::NUMERIC as avg_final_money,
    MAX(pl.final_age)::INTEGER as best_age
  FROM public.past_lives pl
  JOIN public.users u ON pl.user_id = u.id
  GROUP BY pl.user_id, u.email
  ORDER BY total_trophies DESC, total_lives DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;
