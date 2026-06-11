-- DEBUG: [수정52 2026-06-11] subjective_problems에 question_text 컬럼 추가
-- 원인: TheoryScreen 주관식 퀴즈를 실제 시험지 스타일(상세 지문 2~3줄 + 빈칸)로 변경
-- 기존 question 컬럼은 짧은 질문 한 줄만 저장 → 상세 지문을 담을 별도 컬럼 필요
-- 해결: question_text varchar(3000) 추가 (기존 question 컬럼은 호환성 유지)
ALTER TABLE public.subjective_problems
ADD COLUMN IF NOT EXISTS question_text varchar(3000);

-- 기존 레코드는 question_text가 NULL → 프론트엔드에서 frontText fallback 사용
