-- ============================================================================
-- [필수] Supabase 대시보드에서 실행할 SQL
-- ============================================================================
-- 경로: Supabase Dashboard → SQL Editor → New Query → 아래 SQL 붙여넣기 → Run
-- ============================================================================

-- 1. subjective_problems 테이블에 option1~5 컬럼 추가
ALTER TABLE public.subjective_problems
ADD COLUMN IF NOT EXISTS option1 varchar(500),
ADD COLUMN IF NOT EXISTS option2 varchar(500),
ADD COLUMN IF NOT EXISTS option3 varchar(500),
ADD COLUMN IF NOT EXISTS option4 varchar(500),
ADD COLUMN IF NOT EXISTS option5 varchar(500);

-- 2. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'subjective_problems'
ORDER BY ordinal_position;

-- 3. (선택) 테스트 데이터 삽입 - option1~5가 있는 주관식 문제 2개
INSERT INTO public.subjective_problems (subject_id, question, answer, explanation, difficulty, is_ai_generated, created_at, option1, option2, option3, option4, option5)
VALUES (
  (SELECT id FROM public.subject WHERE name = '운영체제' LIMIT 1),
  '프로세스와 스레드의 차이점을 설명하시오.',
  '1',
  '프로세스는 독립된 실행 단위이고, 스레드는 프로세스 내의 경량 실행 단위입니다.',
  2,
  false,
  NOW(),
  '프로세스는 독립된 메모리 공간을 가지지만 스레드는 공유한다',
  '프로세스는 느리지만 스레드는 빠르다',
  '프로세스는 자원을 공유하지만 스레드는 독립적이다',
  '프로세스와 스레드는 동일한 개념이다',
  '스레드는 메모리를 사용하지 않는다'
);

-- 4. (선택) 현재 과목별 문제 개수 확인
SELECT
  s.name AS subject_name,
  COUNT(DISTINCT p.id) AS objective_count,
  COUNT(DISTINCT sp.id) AS subjective_count,
  COUNT(DISTINCT lp.id) AS programming_count
FROM public.subject s
LEFT JOIN public.problem p ON s.id = p.subject_id AND p.type = 'OBJECTIVE'
LEFT JOIN public.subjective_problems sp ON s.id = sp.subject_id
LEFT JOIN public.programming_language_problems lp ON LOWER(lp.prog_language) = LOWER(s.name)
GROUP BY s.name
ORDER BY s.id;
