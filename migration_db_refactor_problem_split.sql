-- DB 리팩토링: 객관식(problem) / 주관식(subjective_problems) / 프로그래밍(programming_language_problems) 분리
-- 및 user_answer·wrong_answer_bookmark·study_session 통합 키(problem_type + reference_id)
--
-- 실행 전 백업 필수. PostgreSQL 대상. 단일 실행을 가정합니다.
-- 애플리케이션 배포 전에 반드시 본 스크립트를 적용한 뒤 백엔드를 기동하세요 (ddl-auto=update 와 병행 시 컬럼 불일치 방지).
-- 프로그래밍 샘플 데이터는 migration_programming_problems.sql 을 이후에 실행합니다.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) 신규 테이블
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjective_problems (
	id bigserial NOT NULL,
	subject_id int8 NOT NULL,
	question text NOT NULL,
	answer text NOT NULL,
	explanation text NULL,
	difficulty int4 NULL,
	is_ai_generated bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT subjective_problems_pkey PRIMARY KEY (id),
	CONSTRAINT subjective_problems_difficulty_check CHECK (((difficulty >= 1) AND (difficulty <= 5))),
	CONSTRAINT subjective_problems_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS programming_language_problems (
	id bigserial NOT NULL,
	subject_id int8 NULL,
	prog_language text NOT NULL,
	question text NOT NULL,
	answer text NOT NULL,
	explanation text NULL,
	difficulty int4 NULL,
	is_ai_generated bool DEFAULT false NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT programming_language_problems_pkey PRIMARY KEY (id),
	CONSTRAINT programming_language_problems_difficulty_check CHECK (((difficulty IS NULL) OR ((difficulty >= 1) AND (difficulty <= 5)))),
	CONSTRAINT programming_language_problems_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_unified_statistics (
	id bigserial NOT NULL,
	user_id int8 NOT NULL,
	problem_type text NOT NULL,
	reference_id int8 NULL,
	total_attempted int4 DEFAULT 0 NOT NULL,
	correct_count int4 DEFAULT 0 NOT NULL,
	incorrect_count int4 DEFAULT 0 NOT NULL,
	last_studied_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT user_unified_statistics_pkey PRIMARY KEY (id),
	CONSTRAINT user_unified_statistics_problem_type_check CHECK ((problem_type = ANY (ARRAY['OBJECTIVE'::text, 'SUBJECTIVE'::text, 'PROGRAMMING_LANGUAGE'::text]))),
	CONSTRAINT user_unified_statistics_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_user_unified_statistics_branch
	ON user_unified_statistics (user_id, problem_type) WHERE reference_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_user_unified_statistics_item
	ON user_unified_statistics (user_id, problem_type, reference_id) WHERE reference_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) study_session: 줄기(선택)
-- ---------------------------------------------------------------------------
ALTER TABLE study_session ADD COLUMN IF NOT EXISTS problem_branch text NULL;
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'study_session_problem_branch_check'
	) THEN
		ALTER TABLE study_session
			ADD CONSTRAINT study_session_problem_branch_check
			CHECK (problem_branch IS NULL OR (problem_branch = ANY (ARRAY['OBJECTIVE'::text, 'SUBJECTIVE'::text, 'PROGRAMMING_LANGUAGE'::text])));
	END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) 주관식 행 복사 (구 problem.id → _migration_source_id)
-- ---------------------------------------------------------------------------
ALTER TABLE subjective_problems ADD COLUMN IF NOT EXISTS _migration_source_id bigint;

INSERT INTO subjective_problems (
	subject_id, question, answer, explanation, difficulty, is_ai_generated, created_at, updated_at, _migration_source_id
)
SELECT
	subject_id, question, answer, explanation, difficulty, is_ai_generated, created_at, updated_at, id
FROM problem
WHERE type = 'SUBJECTIVE';

-- ---------------------------------------------------------------------------
-- 4) user_answer: 컬럼 추가 후 problem 조인으로 유형·참조 채움
-- ---------------------------------------------------------------------------
ALTER TABLE user_answer ADD COLUMN IF NOT EXISTS problem_type text;
ALTER TABLE user_answer ADD COLUMN IF NOT EXISTS reference_id bigint;

UPDATE user_answer ua
SET
	problem_type = CASE WHEN p.type = 'SUBJECTIVE' THEN 'SUBJECTIVE' ELSE 'OBJECTIVE' END,
	reference_id = ua.problem_id
FROM problem p
WHERE ua.problem_id = p.id
  AND ua.problem_type IS NULL;

UPDATE user_answer ua
SET reference_id = sp.id
FROM subjective_problems sp
WHERE ua.problem_type = 'SUBJECTIVE'
  AND sp._migration_source_id = ua.reference_id;

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
	CHECK (problem_type = ANY (ARRAY['OBJECTIVE'::text, 'SUBJECTIVE'::text, 'PROGRAMMING_LANGUAGE'::text]));
ALTER TABLE user_answer
	ADD CONSTRAINT user_answer_user_branch_ref_key UNIQUE (user_id, problem_type, reference_id);

-- ---------------------------------------------------------------------------
-- 5) wrong_answer_bookmark
-- ---------------------------------------------------------------------------
ALTER TABLE wrong_answer_bookmark ADD COLUMN IF NOT EXISTS problem_type text;
ALTER TABLE wrong_answer_bookmark ADD COLUMN IF NOT EXISTS reference_id bigint;

UPDATE wrong_answer_bookmark b
SET
	problem_type = CASE WHEN p.type = 'SUBJECTIVE' THEN 'SUBJECTIVE' ELSE 'OBJECTIVE' END,
	reference_id = b.problem_id
FROM problem p
WHERE b.problem_id = p.id
  AND b.problem_type IS NULL;

UPDATE wrong_answer_bookmark b
SET reference_id = sp.id
FROM subjective_problems sp
WHERE b.problem_type = 'SUBJECTIVE'
  AND sp._migration_source_id = b.reference_id;

ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_user_id_problem_id_key;
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_user_branch_ref_key;
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_problem_type_check;
ALTER TABLE wrong_answer_bookmark DROP CONSTRAINT IF EXISTS wrong_answer_bookmark_problem_id_fkey;

ALTER TABLE wrong_answer_bookmark DROP COLUMN IF EXISTS problem_id;

ALTER TABLE wrong_answer_bookmark ALTER COLUMN problem_type SET NOT NULL;
ALTER TABLE wrong_answer_bookmark ALTER COLUMN reference_id SET NOT NULL;

ALTER TABLE wrong_answer_bookmark
	ADD CONSTRAINT wrong_answer_bookmark_problem_type_check
	CHECK (problem_type = ANY (ARRAY['OBJECTIVE'::text, 'SUBJECTIVE'::text, 'PROGRAMMING_LANGUAGE'::text]));
ALTER TABLE wrong_answer_bookmark
	ADD CONSTRAINT wrong_answer_bookmark_user_branch_ref_key UNIQUE (user_id, problem_type, reference_id);

-- ---------------------------------------------------------------------------
-- 6) problem 에서 SUBJECTIVE 삭제 + CHECK
-- ---------------------------------------------------------------------------
DELETE FROM problem WHERE type = 'SUBJECTIVE';

ALTER TABLE problem DROP CONSTRAINT IF EXISTS problem_type_check;
ALTER TABLE problem
	ADD CONSTRAINT problem_type_check CHECK (type = 'OBJECTIVE'::text);

-- ---------------------------------------------------------------------------
-- 7) 주관식 임시 컬럼 제거
-- ---------------------------------------------------------------------------
ALTER TABLE subjective_problems DROP COLUMN IF EXISTS _migration_source_id;

-- ---------------------------------------------------------------------------
-- 8) 통계 테이블 줄기별 롤업 (기존 행이 있으면 먼저 삭제 후 재적재)
-- ---------------------------------------------------------------------------
DELETE FROM user_unified_statistics WHERE reference_id IS NULL;

INSERT INTO user_unified_statistics (user_id, problem_type, reference_id, total_attempted, correct_count, incorrect_count, last_studied_at)
SELECT
	user_id,
	problem_type,
	NULL::bigint,
	COUNT(*)::int,
	SUM(CASE WHEN is_correct THEN 1 ELSE 0 END)::int,
	SUM(CASE WHEN NOT is_correct THEN 1 ELSE 0 END)::int,
	MAX(submitted_at)
FROM user_answer
GROUP BY user_id, problem_type;

COMMIT;
