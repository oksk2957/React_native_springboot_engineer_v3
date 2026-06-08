-- ============================================================================
-- [2026-06-08] Supabase DB 마이그레이션 통합 파일
-- ============================================================================
-- 실행 방법:
-- 1. Supabase Dashboard → SQL Editor → New Query
-- 2. 이 파일 전체를 복사해서 붙여넣기
-- 3. Run 버튼 클릭
-- ============================================================================

-- ============================================================================
-- STEP 1: subjective_problems 테이블에 option1~5 컬럼 추가
-- ============================================================================
-- 원인: ProblemQueryMapper.xml의 selectTheoryCardsByCategory 쿼리가
--       sp.option1~5를 SELECT하지만 DB 스키마에 해당 컬럼이 없음
-- ============================================================================
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

-- ============================================================================
-- STEP 2: study_session 테이블에 created_at, updated_at 컬럼 추가
-- ============================================================================
-- 원인: StudySession.java 엔티티에 created_at, updated_at 필드가 정의되어 있으나
--       Supabase DB의 study_session 테이블에 해당 컬럼이 존재하지 않아 로그인 시
--       "column ss1_0.created_at does not exist" 에러로 크래시 발생
-- ============================================================================
ALTER TABLE public.study_session
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- 확인 쿼리
SELECT id, user_id, session_key, created_at, updated_at
FROM public.study_session
ORDER BY id DESC
LIMIT 10;

-- ============================================================================
-- STEP 3: 모든 엔티티의 타임스탬프 컬럼 존재 여부 일괄 검증
-- ============================================================================
-- 원인: StudySession 외 6개 엔티티(User, Subject, Problem 등)도 동일 필드 보유
--       DB 스키마와의 불일치로 런타임 에러 발생 가능성 사전 차단
-- ============================================================================
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'study_session',           -- StudySession.java
    'users',                   -- User.java
    'subjects',                -- Subject.java
    'problems',                -- Problem.java
    'subjective_problems',     -- SubjectiveProblem.java
    'programming_language_problems', -- ProgrammingLanguageProblem.java
    'user_statistics',         -- UserStatistics.java
    'user_answers'             -- UserAnswer.java (추정)
  )
  AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;

-- ============================================================================
-- STEP 4: 과목별 문제 개수 확인 (최종 검증)
-- ============================================================================
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

-- ============================================================================
-- 완료 메시지
-- ============================================================================
SELECT '✅ DB 마이그레이션 완료! 백엔드를 재시작하세요.' AS status;
