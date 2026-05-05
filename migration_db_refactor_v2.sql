-- =============================================================================
-- DB 리팩토링 v2: 문제 테이블 분리 + 단일 통계 테이블 통합
-- - 객관식(problem) / 주관식(subjective_problems) / 프로그래밍(programming_language_problems) 분리
-- - 통계: user_unified_statistics 단일 테이블 (problem_type + reference_id)
-- - 마이페이지: 3개 줄기별 통계 조회
-- =============================================================================
-- PostgreSQL 대상. 실행 전 백업 필수.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. 신규 테이블 생성
-- =============================================================================

-- 1-1. 프로그래밍 문제 테이블 (단일 테이블 + language 필드)
CREATE TABLE IF NOT EXISTS programming_language_problems (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT REFERENCES subject(id) ON DELETE SET NULL,
    prog_language VARCHAR(50) NOT NULL,  -- Java, Python, C, JavaScript 등
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5)),
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1-2. 주관식 문제 테이블
CREATE TABLE IF NOT EXISTS subjective_problems (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    difficulty INTEGER CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5)),
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1-3. 통합 통계 테이블 (문제 유형별 + 과목별 통합 관리)
CREATE TABLE IF NOT EXISTS user_statistics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_type VARCHAR(50) NOT NULL,  -- 'OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'
    subject_id BIGINT REFERENCES subject(id) ON DELETE CASCADE,
    total_attempted INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    last_studied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 문제 유형 CHECK
    CONSTRAINT user_statistics_problem_type_check 
        CHECK (problem_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE')),
    -- 문제 유형별 고유 제약 (user_id + problem_type + subject_id 조합)
    CONSTRAINT user_statistics_unique_key UNIQUE (user_id, problem_type, subject_id)
);

-- =============================================================================
-- 2. 기존 테이블 수정
-- =============================================================================

-- 2-1. problem 테이블: SUBJECTIVE 타입 제거 (OBJECTIVE만 허용)
DELETE FROM problem WHERE type = 'SUBJECTIVE';

ALTER TABLE problem DROP CONSTRAINT IF EXISTS problem_type_check;
ALTER TABLE problem 
    ADD CONSTRAINT problem_type_check CHECK (type = 'OBJECTIVE');

-- 2-2. study_session: problem_branch 추가
ALTER TABLE study_session ADD COLUMN IF NOT EXISTS problem_branch VARCHAR(50);
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
-- 3. 기존 데이터 마이그레이션
-- =============================================================================

-- 3-1. problem의 SUBJECTIVE → subjective_problems 마이그레이션
ALTER TABLE subjective_problems ADD COLUMN IF NOT EXISTS _migration_source_id BIGINT;

INSERT INTO subjective_problems (subject_id, question, answer, explanation, difficulty, is_ai_generated, created_at, updated_at, _migration_source_id)
SELECT subject_id, question, answer, explanation, difficulty, is_ai_generated, created_at, updated_at, id
FROM problem WHERE type = 'SUBJECTIVE';

-- 3-2. user_answer 마이그레이션 (problem_type + reference_id 추가)
ALTER TABLE user_answer ADD COLUMN IF NOT EXISTS problem_type VARCHAR(50);
ALTER TABLE user_answer ADD COLUMN IF NOT EXISTS reference_id BIGINT;

-- problem 테이블 JOIN하여 problem_type 설정
UPDATE user_answer ua
SET problem_type = 'OBJECTIVE', reference_id = p.id
FROM problem p
WHERE ua.problem_id = p.id
  AND ua.problem_type IS NULL;

-- subjective_problems 마이그레이션 소스로 UPDATE
UPDATE user_answer ua
SET problem_type = 'SUBJECTIVE', reference_id = sp.id
FROM subjective_problems sp
WHERE sp._migration_source_id = ua.problem_id
  AND ua.problem_type IS NULL;

-- 3-3. user_answer 테이블 구조 변경
ALTER TABLE user_answer ALTER COLUMN session_id DROP NOT NULL;

ALTER TABLE user_answer DROP CONSTRAINT IF EXISTS user_answer_session_id_problem_id_key;
ALTER TABLE user_answer DROP CONSTRAINT IF EXISTS user_answer_user_branch_ref_key;
ALTER TABLE user_answer DROP CONSTRAINT IF EXISTS user_answer_problem_type_check;
ALTER TABLE user_answer DROP CONSTRAINT IF EXISTS user_answer_problem_id_fkey;
ALTER TABLE user_answer DROP COLUMN IF EXISTS problem_id;

ALTER TABLE user_answer ALTER COLUMN problem_type SET NOT NULL;
ALTER TABLE user_answer ALTER COLUMN reference_id SET NOT NULL;

ALTER TABLE user_answer
    ADD CONSTRAINT user_answer_problem_type_check 
    CHECK (problem_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'));
ALTER TABLE user_answer
    ADD CONSTRAINT user_answer_user_branch_ref_key UNIQUE (user_id, problem_type, reference_id);

-- 3-4. wrong_answer_bookmark 마이그레이션
ALTER TABLE wrong_answer_bookmark ADD COLUMN IF NOT EXISTS problem_type VARCHAR(50);
ALTER TABLE wrong_answer_bookmark ADD COLUMN IF NOT EXISTS reference_id BIGINT;

UPDATE wrong_answer_bookmark wb
SET problem_type = 'OBJECTIVE', reference_id = p.id
FROM problem p
WHERE wb.problem_id = p.id
  AND wb.problem_type IS NULL;

UPDATE wrong_answer_bookmark wb
SET problem_type = 'SUBJECTIVE', reference_id = sp.id
FROM subjective_problems sp
WHERE sp._migration_source_id = wb.problem_id
  AND wb.problem_type IS NULL;

ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_user_id_problem_id_key;
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_user_branch_ref_key;
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_problem_type_check;
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_problem_id_fkey;
ALTER TABLE wrong_answer_bookmark DROP COLUMN IF EXISTS problem_id;

ALTER TABLE wrong_answer_bookmark ALTER COLUMN problem_type SET NOT NULL;
ALTER TABLE wrong_answer_bookmark ALTER COLUMN reference_id SET NOT NULL;

ALTER TABLE wrong_answer_bookmark
    ADD CONSTRAINT wrong_answer_bookmark_problem_type_check 
    CHECK (problem_type IN ('OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'));
ALTER TABLE wrong_answer_bookmark
    ADD CONSTRAINT wrong_answer_bookmark_user_branch_ref_key UNIQUE (user_id, problem_type, reference_id);

-- 3-5. 임시 마이그레이션 컬럼 정리
ALTER TABLE subjective_problems DROP COLUMN IF EXISTS _migration_source_id;

-- =============================================================================
-- 4. 통합 통계 테이블 데이터 동기화
-- =============================================================================

-- 기존 통계 데이터 정리 (subject_id가 있는 기존 데이터는 problem_type='OBJECTIVE'로 업데이트)
UPDATE user_statistics SET problem_type = 'OBJECTIVE' WHERE problem_type IS NULL;

-- user_answer 기반 통계 INSERT/UPDATE (과목별)
INSERT INTO user_statistics (user_id, problem_type, subject_id, total_attempted, correct_count, incorrect_count, last_studied_at)
SELECT 
    ua.user_id,
    ua.problem_type,
    COALESCE(
        (SELECT subject_id FROM problem WHERE id = ua.reference_id AND ua.problem_type = 'OBJECTIVE'),
        (SELECT subject_id FROM subjective_problems WHERE id = ua.reference_id AND ua.problem_type = 'SUBJECTIVE'),
        (SELECT subject_id FROM programming_language_problems WHERE id = ua.reference_id AND ua.problem_type = 'PROGRAMMING_LANGUAGE')
    ) AS subject_id,
    COUNT(*) AS total_attempted,
    SUM(CASE WHEN ua.is_correct THEN 1 ELSE 0 END) AS correct_count,
    SUM(CASE WHEN NOT ua.is_correct THEN 1 ELSE 0 END) AS incorrect_count,
    MAX(ua.submitted_at) AS last_studied_at
FROM user_answer ua
WHERE ua.problem_type = 'OBJECTIVE'
GROUP BY ua.user_id, ua.problem_type, 
    (SELECT subject_id FROM problem WHERE id = ua.reference_id)
ON CONFLICT (user_id, problem_type, subject_id) 
DO UPDATE SET
    total_attempted = EXCLUDED.total_attempted,
    correct_count = EXCLUDED.correct_count,
    incorrect_count = EXCLUDED.incorrect_count,
    last_studied_at = EXCLUDED.last_studied_at;

-- =============================================================================
-- 5. 필요 시 인덱스 생성
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_statistics_user_type ON user_statistics (user_id, problem_type);
CREATE INDEX IF NOT EXISTS idx_user_answer_problem_type ON user_answer (problem_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_programming_problems_language ON programming_language_problems (prog_language);

COMMIT;

-- =============================================================================
-- 마이페이지 통계 조회 쿼리 모음
-- =============================================================================

-- 1. 전체 요약 통계
-- SELECT 
--     COUNT(*) AS total_solved,
--     SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS total_correct,
--     ROUND(SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100, 1) AS accuracy_rate
-- FROM user_answer WHERE user_id = :userId;

-- 2. 3개 줄기별 통계
-- SELECT 
--     problem_type,
--     total_attempted,
--     correct_count,
--     incorrect_count,
--     CASE WHEN total_attempted > 0 
--          THEN ROUND(correct_count::NUMERIC / total_attempted * 100, 1) 
--          ELSE 0 END AS accuracy_rate
-- FROM user_statistics 
-- WHERE user_id = :userId
-- ORDER BY CASE problem_type 
--     WHEN 'OBJECTIVE' THEN 1 
--     WHEN 'SUBJECTIVE' THEN 2 
--     WHEN 'PROGRAMMING_LANGUAGE' THEN 3 END;

-- 3. 과목별 + 줄기별 상세 통계
-- SELECT 
--     s.name AS subject_name,
--     us.problem_type,
--     us.total_attempted,
--     us.correct_count,
--     us.incorrect_count
-- FROM user_statistics us
-- JOIN subject s ON us.subject_id = s.id
-- WHERE us.user_id = :userId
-- ORDER BY s.name, CASE us.problem_type WHEN 'OBJECTIVE' THEN 1 WHEN 'SUBJECTIVE' THEN 2 WHEN 'PROGRAMMING_LANGUAGE' THEN 3 END;