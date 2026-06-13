-- Reward log table for persistent idempotency and rate limiting.
-- Replaces the in-memory Map used in ad-reward and webhook-stripe edge functions.
-- Survives function redeploys and works across multiple instances.

CREATE TABLE IF NOT EXISTS public.reward_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_id   TEXT        NOT NULL,
  reward_type TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reward_log_unique UNIQUE (user_id, reward_id)
);

CREATE INDEX IF NOT EXISTS idx_reward_log_user_type_date
  ON public.reward_log (user_id, reward_type, created_at DESC);

-- RLS: users can read their own log; only backend can write.
ALTER TABLE public.reward_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reward log" ON public.reward_log;
CREATE POLICY "Users can view own reward log"
  ON public.reward_log FOR SELECT
  USING (auth.uid() = user_id);

-- Checks if a reward was already claimed and inserts it if not.
-- Returns TRUE when the reward is newly claimed, FALSE when it's a duplicate.
-- ATOMIC: uses INSERT ON CONFLICT to prevent race conditions.
CREATE OR REPLACE FUNCTION public.claim_reward_idempotent(
  p_user_id    UUID,
  p_reward_id  TEXT,
  p_reward_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.reward_log (user_id, reward_id, reward_type)
  VALUES (p_user_id, p_reward_id, p_reward_type)
  ON CONFLICT (user_id, reward_id) DO NOTHING;

  RETURN FOUND;
END;
$$;

-- Count how many rewards of a given type the user has claimed today (UTC).
CREATE OR REPLACE FUNCTION public.count_rewards_today(
  p_user_id    UUID,
  p_reward_type TEXT
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM   public.reward_log
  WHERE  user_id     = p_user_id
    AND  reward_type = p_reward_type
    AND  created_at >= CURRENT_DATE::TIMESTAMPTZ
    AND  created_at <  (CURRENT_DATE + 1)::TIMESTAMPTZ;
$$;
