-- DEBUG: [2026-06-09] 미완료46 - 프로그래밍 5지선다 퀴즈 구현
-- 원인: programming_language_problems 테이블에 option1~5 컬럼 부재
-- 해결: option1~5 컬럼 추가하여 5지선다 퀴즈 지원
-- 영향: 코드탭에서 프로그래밍 문제를 5지선다 형태로 풀 수 있음

ALTER TABLE programming_language_problems
ADD COLUMN option1 VARCHAR(500),
ADD COLUMN option2 VARCHAR(500),
ADD COLUMN option3 VARCHAR(500),
ADD COLUMN option4 VARCHAR(500),
ADD COLUMN option5 VARCHAR(500);

COMMENT ON COLUMN programming_language_problems.option1 IS '5지선다 보기 1';
COMMENT ON COLUMN programming_language_problems.option2 IS '5지선다 보기 2';
COMMENT ON COLUMN programming_language_problems.option3 IS '5지선다 보기 3';
COMMENT ON COLUMN programming_language_problems.option4 IS '5지선다 보기 4';
COMMENT ON COLUMN programming_language_problems.option5 IS '5지선다 보기 5';
