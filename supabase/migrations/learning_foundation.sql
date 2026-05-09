-- =============================================================================
-- learning_foundation.sql
-- =============================================================================
-- Purpose : Add data-quality and prediction-learning columns to race_results
--           and build-key columns to matchups.
--
-- Safety  : Uses ADD COLUMN IF NOT EXISTS throughout.
--           Constraint additions are wrapped in DO blocks that check
--           pg_constraint before executing, so this file is safe to re-run.
--
-- Run     : Execute manually in the Supabase SQL editor or via:
--               supabase db push
--           Do NOT auto-run from application code.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.  race_results  –  quality / learning columns
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.race_results
  ADD COLUMN IF NOT EXISTS quality_score          integer  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS learning_weight        numeric  DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS review_status          text     DEFAULT 'auto_accepted',
  ADD COLUMN IF NOT EXISTS hidden_from_learning   boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_from_leaderboard boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dispute_count          integer  DEFAULT 0;


-- quality_score  0 – 100
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'race_results_quality_score_check'
      AND conrelid = 'public.race_results'::regclass
  ) THEN
    ALTER TABLE public.race_results
      ADD CONSTRAINT race_results_quality_score_check
      CHECK (quality_score BETWEEN 0 AND 100);
  END IF;
END
$$;


-- learning_weight  0 – 10
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'race_results_learning_weight_check'
      AND conrelid = 'public.race_results'::regclass
  ) THEN
    ALTER TABLE public.race_results
      ADD CONSTRAINT race_results_learning_weight_check
      CHECK (learning_weight BETWEEN 0 AND 10);
  END IF;
END
$$;


-- review_status  allowed values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'race_results_review_status_check'
      AND conrelid = 'public.race_results'::regclass
  ) THEN
    ALTER TABLE public.race_results
      ADD CONSTRAINT race_results_review_status_check
      CHECK (review_status IN (
        'auto_accepted',
        'needs_review',
        'admin_verified',
        'disputed',
        'rejected'
      ));
  END IF;
END
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2.  matchups  –  build-key / version columns
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.matchups
  ADD COLUMN IF NOT EXISTS car_a_build_key      text,
  ADD COLUMN IF NOT EXISTS car_b_build_key      text,
  ADD COLUMN IF NOT EXISTS prediction_version   text DEFAULT 'v1';
