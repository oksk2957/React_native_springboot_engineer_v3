-- 2026-06-09 StudySession 엔티티-DB 스키마 불일치 해결
--
-- 문제: Java StudySession 엔티티는 session_key, google_id, created_at, updated_at 필드를 가지지만
--       DB 테이블에는 이 컬럼들이 존재하지 않아 Hibernate INSERT 시 500 에러 발생
--
-- 해결: DB에 누락된 컬럼 추가 및 NOT NULL 제약 조정
--
-- 영향:
-- - /api/auth/google 로그인 시 StudySession INSERT 성공
-- - public.users INSERT 후속 처리 가능

-- 1. session_key 추가 (UNIQUE 제약)
ALTER TABLE study_session
ADD COLUMN IF NOT EXISTS session_key VARCHAR(255) UNIQUE;

-- 2. google_id 추가
ALTER TABLE study_session
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);

-- 3. created_at 추가
ALTER TABLE study_session
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4. updated_at 추가
ALTER TABLE study_session
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 5. subject_id NOT NULL 제약 제거 (Java에서 사용하지 않음)
ALTER TABLE study_session
ALTER COLUMN subject_id DROP NOT NULL;

-- 6. session_type NOT NULL 제약 제거 (Java에서 사용하지 않음)
ALTER TABLE study_session
ALTER COLUMN session_type DROP NOT NULL;

-- 검증: 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'study_session'
ORDER BY ordinal_position;
