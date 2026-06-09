-- Migration 005: programming_language_problems에 option1~5 컬럼 추가
-- Date: 2026-06-09
-- Purpose: 코드탭에서 5지선다 객관식 지원 — 기존 테이블 구조 유지 + 컬럼만 추가
-- 원인: ProblemQueryMapper.xml이 pp.option1~5를 참조하지만 DB 스키마에 해당 컬럼 없음

-- option1~5 컬럼 추가 (NULL 허용)
ALTER TABLE programming_language_problems
ADD COLUMN IF NOT EXISTS option1 varchar(500),
ADD COLUMN IF NOT EXISTS option2 varchar(500),
ADD COLUMN IF NOT EXISTS option3 varchar(500),
ADD COLUMN IF NOT EXISTS option4 varchar(500),
ADD COLUMN IF NOT EXISTS option5 varchar(500);

-- programming_language 컬럼 추가 (JPA 엔티티와 동기화)
ALTER TABLE programming_language_problems
ADD COLUMN IF NOT EXISTS programming_language varchar(100);

-- is_ai_generated 컬럼 추가 (JPA 엔티티와 동기화)
ALTER TABLE programming_language_problems
ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false;

-- created_at, updated_at 컬럼 확인 (이미 존재하면 skip)
ALTER TABLE programming_language_problems
ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT CURRENT_TIMESTAMP;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_plp_subject_id ON programming_language_problems(subject_id);
CREATE INDEX IF NOT EXISTS idx_plp_prog_language ON programming_language_problems(prog_language);
