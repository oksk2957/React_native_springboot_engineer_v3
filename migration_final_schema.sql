-- =============================================================================
-- Final Migration Script: 정보처리기사 시험 데이터베이스 최종 구조
-- 
-- 목적: 기존 problem 테이블을 OBJECTIVE/SUBJECTIVE/PROGRAMMING_LANGUAGE 3개로 분리
--       user_answer, wrong_answer_bookmark를 problem_type + reference_id 구조로 변경
--       users 테이블에 password, username 필드 추가
--
-- 실행 전 반드시 백업 수행
-- PostgreSQL 대상
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. users 테이블 업데이트 (password, username 추가)
-- =============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) DEFAULT 'unknown';
UPDATE users SET username = COALESCE(nickname, SPLIT_PART(email, '@', 1)) WHERE username = 'unknown';

-- =============================================================================
-- 2. 새 테이블 생성
-- =============================================================================

-- 2-1. 주관식 문제 테이블
CREATE TABLE IF NOT EXISTS subjective_problems (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    question VARCHAR(1000) NOT NULL,
    answer VARCHAR(500) NOT NULL,
    explanation VARCHAR(2000),
    difficulty INTEGER,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW(),
    CONSTRAINT subjective_problems_difficulty_check CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);

-- 2-2. 프로그래밍 언어 문제 테이블
CREATE TABLE IF NOT EXISTS programming_language_problems (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT REFERENCES subject(id) ON DELETE SET NULL,
    prog_language VARCHAR(64) NOT NULL,
    question VARCHAR(1000) NOT NULL,
    answer VARCHAR(500) NOT NULL,
    explanation VARCHAR(2000),
    difficulty INTEGER,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP(6) DEFAULT NOW(),
    updated_at TIMESTAMP(6) DEFAULT NOW(),
    CONSTRAINT programming_language_problems_difficulty_check CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5))
);

-- =============================================================================
-- 3. study_session 테이블 업데이트 (problem_branch 추가)
-- =============================================================================
ALTER TABLE study_session ADD COLUMN IF NOT EXISTS problem_branch VARCHAR(32);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'study_session_problem_branch_check'
    ) THEN
        ALTER TABLE study_session
            ADD CONSTRAINT study_session_problem_branch_check
            CHECK (problem_branch IS NULL OR problem_branch IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'));
    END IF;
END $$;

-- =============================================================================
-- 4. 문제 데이터 마이그레이션
-- =============================================================================

-- 4-1. 마이그레이션 임시 컬럼 추가
ALTER TABLE subjective_problems ADD COLUMN IF NOT EXISTS _migration_source_id BIGINT;

-- 4-2. SUBJECTIVE 문제 이동
INSERT INTO subjective_problems (subject_id, question, answer, explanation, difficulty, is_ai_generated, created_at, updated_at, _migration_source_id)
SELECT 
    subject_id, 
    question, 
    answer, 
    explanation, 
    difficulty, 
    is_ai_generated, 
    created_at, 
    updated_at, 
    id
FROM problem 
WHERE type = 'SUBJECTIVE';

-- 4-3. problem 테이블에서 SUBJECTIVE 삭제
DELETE FROM problem WHERE type = 'SUBJECTIVE';

-- 4-4. problem 테이블 CHECK 제한 변경 (OBJECTIVE만 허용)
ALTER TABLE problem DROP CONSTRAINT IF EXISTS problem_type_check;
ALTER TABLE problem ADD CONSTRAINT problem_type_check CHECK (type = 'OBJECTIVE');

-- =============================================================================
-- 5. user_answer 테이블 구조 변경
-- ==============================================================================

-- 5-1. 새 컬럼 추가
ALTER TABLE user_answer ADD COLUMN IF NOT EXISTS problem_type VARCHAR(32);
ALTER TABLE user_answer ADD COLUMN IF NOT EXISTS reference_id BIGINT;

-- 5-2. problem 테이블과 조인하여 problem_type, reference_id 채우기
UPDATE user_answer ua
SET 
    problem_type = CASE 
        WHEN p.type = 'SUBJECTIVE' THEN 'SUBJECTIVE'
        WHEN sp.id IS NOT NULL THEN 'SUBJECTIVE'
        ELSE 'OBJECTIVE'
    END,
    reference_id = ua.problem_id
FROM problem p
LEFT JOIN subjective_problems sp ON sp._migration_source_id = ua.problem_id
WHERE ua.problem_id = p.id
  AND ua.problem_type IS NULL;

-- 5-3. subjective_problems 참조 업데이트
UPDATE user_answer ua
SET 
    problem_type = 'SUBJECTIVE',
    reference_id = sp.id
FROM subjective_problems sp
WHERE sp._migration_source_id = ua.problem_id
  AND ua.problem_type IS NULL;

-- 5-4. 외래키 및 제약조건 제거
ALTER TABLE user_answer DROP CONSTRAINT IF EXISTS user_answer_session_id_problem_id_key;
ALTER TABLE user_answer DROP CONSTRAINT IF EXISTS user_answer_problem_id_fkey;
ALTER TABLE user_answer ALTER COLUMN session_id DROP NOT NULL;

-- 5-5. problem_id 컬럼 제거
ALTER TABLE user_answer DROP COLUMN IF EXISTS problem_id;

-- 5-6. 새 컬럼 NOT NULL 설정 및 CHECK 제약 추가
ALTER TABLE user_answer ALTER COLUMN problem_type SET NOT NULL;
ALTER TABLE user_answer ALTER COLUMN reference_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_answer_problem_type_check'
    ) THEN
        ALTER TABLE user_answer
            ADD CONSTRAINT user_answer_problem_type_check
            CHECK (problem_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'));
    END IF;
END $$;

-- 5-7. 고유 제약조건 변경
ALTER TABLE user_answer DROP CONSTRAINT IF EXISTS user_answer_user_branch_ref_key;
ALTER TABLE user_answer
    ADD CONSTRAINT user_answer_user_branch_ref_key UNIQUE (user_id, problem_type, reference_id);

-- =============================================================================
-- 6. wrong_answer_bookmark 테이블 구조 변경
-- =============================================================================

-- 6-1. 새 컬럼 추가
ALTER TABLE wrong_answer_bookmark ADD COLUMN IF NOT EXISTS problem_type VARCHAR(32);
ALTER TABLE wrong_answer_bookmark ADD COLUMN IF NOT EXISTS reference_id BIGINT;

-- 6-2. problem 테이블과 조인하여 problem_type, reference_id 채우기
UPDATE wrong_answer_bookmark wb
SET 
    problem_type = CASE 
        WHEN p.type = 'SUBJECTIVE' THEN 'SUBJECTIVE'
        WHEN sp.id IS NOT NULL THEN 'SUBJECTIVE'
        ELSE 'OBJECTIVE'
    END,
    reference_id = wb.problem_id
FROM problem p
LEFT JOIN subjective_problems sp ON sp._migration_source_id = wb.problem_id
WHERE wb.problem_id = p.id
  AND wb.problem_type IS NULL;

-- 6-3. subjective_problems 참조 업데이트
UPDATE wrong_answer_bookmark wb
SET 
    problem_type = 'SUBJECTIVE',
    reference_id = sp.id
FROM subjective_problems sp
WHERE sp._migration_source_id = wb.problem_id
  AND wb.problem_type IS NULL;

-- 6-4. 외래키 및 제약조건 제거
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_user_id_problem_id_key;
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_problem_id_fkey;

-- 6-5. problem_id 컬럼 제거
ALTER TABLE wrong_answer_bookmark DROP COLUMN IF EXISTS problem_id;

-- 6-6. 새 컬럼 NOT NULL 설정 및 CHECK 제약 추가
ALTER TABLE wrong_answer_bookmark ALTER COLUMN problem_type SET NOT NULL;
ALTER TABLE wrong_answer_bookmark ALTER COLUMN reference_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'wrong_answer_bookmark_problem_type_check'
    ) THEN
        ALTER TABLE wrong_answer_bookmark
            ADD CONSTRAINT wrong_answer_bookmark_problem_type_check
            CHECK (problem_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'));
    END IF;
END $$;

-- 6-7. 고유 제약조건 변경
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_user_branch_ref_key;
ALTER TABLE wrong_answer_bookmark
    ADD CONSTRAINT wrong_answer_bookmark_user_branch_ref_key UNIQUE (user_id, problem_type, reference_id);

-- =============================================================================
-- 7. 임시 마이그레이션 컬럼 정리
-- =============================================================================
ALTER TABLE subjective_problems DROP COLUMN IF EXISTS _migration_source_id;

-- =============================================================================
-- 8. 인덱스 생성 (성능 최적화)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_problem_subject_id ON problem (subject_id);
CREATE INDEX IF NOT EXISTS idx_subjective_problems_subject_id ON subjective_problems (subject_id);
CREATE INDEX IF NOT EXISTS idx_programming_language_problems_subject_id ON programming_language_problems (subject_id);
CREATE INDEX IF NOT EXISTS idx_programming_language_problems_language ON programming_language_problems (prog_language);
CREATE INDEX IF NOT EXISTS idx_user_answer_user_id ON user_answer (user_id);
CREATE INDEX IF NOT EXISTS idx_user_answer_problem_type ON user_answer (problem_type);
CREATE INDEX IF NOT EXISTS idx_wrong_answer_bookmark_user_id ON wrong_answer_bookmark (user_id);

-- =============================================================================
-- 9. 트리거 함수 업데이트
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- =============================================================================
-- 마이그레이션 완료 후 검증 쿼리
-- =============================================================================
-- SELECT 'problem' as table_name, COUNT(*) as row_count FROM problem
-- UNION ALL
-- SELECT 'subjective_problems', COUNT(*) FROM subjective_problems
-- UNION ALL
-- SELECT 'programming_language_problems', COUNT(*) FROM programming_language_problems
-- UNION ALL
-- SELECT 'user_answer', COUNT(*) FROM user_answer;