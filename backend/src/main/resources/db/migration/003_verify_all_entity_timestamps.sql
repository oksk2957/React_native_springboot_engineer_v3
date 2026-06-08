-- ============================================================================
-- [2026-06-08] 모든 엔티티의 created_at, updated_at 컬럼 존재 여부 일괄 검증
-- ============================================================================
-- 원인: StudySession 외 6개 엔티티(User, Subject, Problem 등)도 동일 필드 보유
--       DB 스키마와의 불일치로 런타임 에러 발생 가능성 사전 차단
-- 해결: information_schema.columns에서 모든 엔티티의 타임스탬프 컬럼 조회
-- ============================================================================

-- created_at, updated_at 컬럼이 필요한 엔티티 테이블 목록
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

-- 누락된 테이블 확인 (위의 결과에 없는 테이블이 있으면 추가 ALTER TABLE 필요)
-- 예: study_session이 결과에 없으면 002 마이그레이션을 실행해야 함
