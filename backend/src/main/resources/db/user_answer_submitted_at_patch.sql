-- Purpose: Align user_answer timestamp column to submitted_at (B option)
-- Safe to run multiple times in PostgreSQL.

BEGIN;

-- 1) Add submitted_at if missing
ALTER TABLE public.user_answer
ADD COLUMN IF NOT EXISTS submitted_at timestamp;

-- 2) Backfill submitted_at from created_at if created_at exists and submitted_at is null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_answer'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE '
      UPDATE public.user_answer
      SET submitted_at = created_at
      WHERE submitted_at IS NULL
    ';
  END IF;
END $$;

-- 3) Set default + NOT NULL for submitted_at
ALTER TABLE public.user_answer
ALTER COLUMN submitted_at SET DEFAULT CURRENT_TIMESTAMP;

UPDATE public.user_answer
SET submitted_at = CURRENT_TIMESTAMP
WHERE submitted_at IS NULL;

ALTER TABLE public.user_answer
ALTER COLUMN submitted_at SET NOT NULL;

COMMIT;
