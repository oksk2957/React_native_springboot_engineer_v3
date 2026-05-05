-- 1. 스키마 초기화 (기존 테이블, 시퀀스, 함수 전부 싹 다 삭제)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public AUTHORIZATION pg_database_owner;

-- 2. 사용자(User) & 인증(Auth) 테이블
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT NOT NULL UNIQUE,
    nickname TEXT,
    username VARCHAR(255) DEFAULT 'unknown' NOT NULL,
    password VARCHAR(255),
    -- FREE_USER: 7일 무료(기본값), PAID_USER: 결제 유저, ADMIN: 관리자
    role TEXT DEFAULT 'FREE_USER' NOT NULL, 
    free_trial_started_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_started_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT users_role_check CHECK (role IN ('FREE_USER', 'PAID_USER', 'ADMIN'))
);

-- 3. 과목(Subject) 테이블
CREATE TABLE subject (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ★ 홈 화면 매핑을 위한 완벽한 기초 데이터 삽입 (필수)
INSERT INTO subject (id, name) VALUES 
(1, '운영체제'),
(2, '네트워크'),
(3, '데이터베이스'),
(4, '소프트웨어공학'),
(5, '정보보안'),
(6, '애플리케이션'),
(7, '프로그래밍언어');

-- 4. 문제(Problem) 테이블 - 객관식 전용
CREATE TABLE problem (
    id BIGSERIAL PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    explanation TEXT,
    type TEXT DEFAULT 'OBJECTIVE' NOT NULL,
    difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
    option1 TEXT,
    option2 TEXT,
    option3 TEXT,
    option4 TEXT,
    option5 TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT problem_type_check CHECK (type = 'OBJECTIVE')
);

-- 5. 주관식 문제 테이블
CREATE TABLE subjective_problems (
    id BIGSERIAL PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES subject(id) ON DELETE CASCADE,
    question VARCHAR(1000) NOT NULL,
    answer VARCHAR(500) NOT NULL,
    explanation VARCHAR(2000),
    difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 프로그래밍 언어 문제 테이블 (C언어, Java, Python 전용)
CREATE TABLE programming_language_problems (
    id BIGSERIAL PRIMARY KEY,
    prog_language VARCHAR(64) NOT NULL, -- 'C언어', 'java', 'python'
    question VARCHAR(1000) NOT NULL,
    answer VARCHAR(500) NOT NULL,
    explanation VARCHAR(2000),
    difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 학습 세션(Study Session)
CREATE TABLE study_session (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subject(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    status TEXT DEFAULT 'IN_PROGRESS' NOT NULL,
    total_questions INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    incorrect_count INT DEFAULT 0,
    problem_branch VARCHAR(32) NOT NULL, -- 'OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT study_session_status_check CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ABANDONED'))
);

-- 8. 사용자 제출 답안(User Answer)
CREATE TABLE user_answer (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id BIGINT NOT NULL REFERENCES study_session(id) ON DELETE CASCADE,
    problem_id BIGINT NOT NULL, 
    problem_type VARCHAR(32) NOT NULL, -- 'OBJECTIVE', 'SUBJECTIVE', 'PROGRAMMING_LANGUAGE'
    submitted_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    reference_id BIGINT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT user_answer_session_id_problem_id_type_key UNIQUE (session_id, problem_id, problem_type)
);

-- 9. 오답 노트(Wrong Answer Bookmark)
CREATE TABLE wrong_answer_bookmark (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id BIGINT NOT NULL,
    problem_type VARCHAR(32) NOT NULL DEFAULT 'OBJECTIVE',
    bookmarked_at TIMESTAMPTZ DEFAULT NOW(),
    review_count INT DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    CONSTRAINT wrong_answer_bookmark_unique UNIQUE (user_id, problem_id, problem_type)
);

-- 10. 답변 검증용 순수 ANSI SQL VIEW (PL/pgSQL 프로시저 대체)
CREATE VIEW v_validate_answer AS
SELECT 
    id AS problem_id,
    CAST('PROGRAMMING_LANGUAGE' AS VARCHAR) AS problem_type,
    answer AS correct_answer,
    explanation
FROM programming_language_problems
UNION ALL
SELECT 
    id AS problem_id,
    CAST('SUBJECTIVE' AS VARCHAR) AS problem_type,
    answer AS correct_answer,
    explanation
FROM subjective_problems
UNION ALL
SELECT 
    id AS problem_id,
    CAST('OBJECTIVE' AS VARCHAR) AS problem_type,
    answer AS correct_answer,
    explanation
FROM problem;

-- 11. 통계 처리를 위한 VIEW 생성 (사용자 요청: INNER JOIN 적용 및 3가지 줄기 완벽 분리)
CREATE VIEW v_user_statistics AS
-- 1가지: 객관식만 통계
SELECT 
    u.id AS user_id,
    CAST('OBJECTIVE' AS VARCHAR) AS problem_type,
    (SELECT COUNT(*) FROM problem) AS total_problems,
    COUNT(DISTINCT CASE WHEN ua.is_correct = true THEN ua.problem_id END) AS solved_problems,
    COUNT(CASE WHEN ua.is_correct = true THEN 1 END) AS correct_count,
    COUNT(CASE WHEN ua.is_correct = false THEN 1 END) AS incorrect_count
FROM users u
INNER JOIN user_answer ua ON u.id = ua.user_id AND ua.problem_type = 'OBJECTIVE'
GROUP BY u.id

UNION ALL

-- 1가지: 주관식만 통계
SELECT 
    u.id AS user_id,
    CAST('SUBJECTIVE' AS VARCHAR) AS problem_type,
    (SELECT COUNT(*) FROM subjective_problems) AS total_problems,
    COUNT(DISTINCT CASE WHEN ua.is_correct = true THEN ua.problem_id END) AS solved_problems,
    COUNT(CASE WHEN ua.is_correct = true THEN 1 END) AS correct_count,
    COUNT(CASE WHEN ua.is_correct = false THEN 1 END) AS incorrect_count
FROM users u
INNER JOIN user_answer ua ON u.id = ua.user_id AND ua.problem_type = 'SUBJECTIVE'
GROUP BY u.id

UNION ALL

-- 1가지: 프로그래밍 언어 통계
SELECT 
    u.id AS user_id,
    CAST('PROGRAMMING_LANGUAGE' AS VARCHAR) AS problem_type,
    (SELECT COUNT(*) FROM programming_language_problems) AS total_problems,
    COUNT(DISTINCT CASE WHEN ua.is_correct = true THEN ua.problem_id END) AS solved_problems,
    COUNT(CASE WHEN ua.is_correct = true THEN 1 END) AS correct_count,
    COUNT(CASE WHEN ua.is_correct = false THEN 1 END) AS incorrect_count
FROM users u
INNER JOIN user_answer ua ON u.id = ua.user_id AND ua.problem_type = 'PROGRAMMING_LANGUAGE'
GROUP BY u.id;
