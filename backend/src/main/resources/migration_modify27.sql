-- 수정27: 코드탭 DB 마이그레이션 SQL
-- 목적: 기존 문제의 subject_id 연결
-- 변경: 공통개념 탭 클릭 시 전체 문제(c, java, python)에서 랜덤 샘플링

-- 1. 기존 30개 문제의 subject_id를 프로그래밍언어(id=7)로 업데이트
UPDATE programming_language_problems
SET subject_id = 7
WHERE subject_id IS NULL;

-- 2. 검증 쿼리
SELECT prog_language, COUNT(*) as total,
       SUM(CASE WHEN option1 IS NOT NULL THEN 1 ELSE 0 END) as subjective_count,
       COUNT(DISTINCT subject_id) as subject_count
FROM programming_language_problems
GROUP BY prog_language
ORDER BY prog_language;

-- 전체 통계
SELECT
  COUNT(*) as total_problems,
  SUM(CASE WHEN option1 IS NOT NULL THEN 1 ELSE 0 END) as total_subjective,
  COUNT(DISTINCT subject_id) as subjects_with_problems
FROM programming_language_problems;
