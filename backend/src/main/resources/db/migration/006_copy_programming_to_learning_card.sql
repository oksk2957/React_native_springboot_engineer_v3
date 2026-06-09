-- Migration 006: programming_language_problems 데이터를 learning_card로 복사
-- Date: 2026-06-09 수정계획안18
-- Purpose: 기존 programming_language_problems 테이블은 유지하면서 learning_card에도 데이터 추가
-- 전략: 이론탭(learning_card)과 코드탭(programming_language_problems)을 통합 조회 가능하게 함
-- 주의: front_text 중복 방지를 위해 NOT EXISTS 조건 추가

INSERT INTO learning_card (subject_id, front_text, back_text, answer_text, explanation, card_type, option1, option2, option3, option4, option5, created_at, updated_at)
SELECT
    pp.subject_id,
    pp.question AS front_text,
    pp.answer AS back_text,
    NULL AS answer_text,
    pp.explanation,
    CASE WHEN pp.option1 IS NOT NULL AND pp.option1 != '' THEN 'SUBJECTIVE' ELSE 'FLASHCARD' END AS card_type,
    pp.option1,
    pp.option2,
    pp.option3,
    pp.option4,
    pp.option5,
    COALESCE(pp.created_at, CURRENT_TIMESTAMP),
    COALESCE(pp.updated_at, CURRENT_TIMESTAMP)
FROM programming_language_problems pp
WHERE NOT EXISTS (
    SELECT 1 FROM learning_card lc
    WHERE lc.front_text = pp.question
      AND lc.subject_id = pp.subject_id
);
