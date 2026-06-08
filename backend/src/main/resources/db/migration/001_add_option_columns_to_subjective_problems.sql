-- ============================================================================
-- [2026-06-07] subjective_problems 테이블에 option1~5 컬럼 추가
-- ============================================================================
-- 원인: ProblemQueryMapper.xml의 selectTheoryCardsByCategory 쿼리가
--       sp.option1~5를 SELECT하지만 DB 스키마에 해당 컬럼이 없음
-- 해결: ALTER TABLE로 option1~5 컬럼 추가
-- ============================================================================

-- option1~5 컬럼 추가 (NULL 허용, 기본값 없음)
ALTER TABLE public.subjective_problems
ADD COLUMN IF NOT EXISTS option1 varchar(500),
ADD COLUMN IF NOT EXISTS option2 varchar(500),
ADD COLUMN IF NOT EXISTS option3 varchar(500),
ADD COLUMN IF NOT EXISTS option4 varchar(500),
ADD COLUMN IF NOT EXISTS option5 varchar(500);

-- 확인 쿼리
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subjective_problems'
ORDER BY ordinal_position;
