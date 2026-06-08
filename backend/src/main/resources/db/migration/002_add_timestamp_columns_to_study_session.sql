-- ============================================================================
-- [2026-06-08] study_session 테이블에 created_at, updated_at 타임스탬프 컬럼 추가
-- ============================================================================
-- 원인: StudySession.java 엔티티에 created_at, updated_at 필드가 정의되어 있으나
--       Supabase DB의 study_session 테이블에 해당 컬럼이 존재하지 않아 로그인 시
--       "column ss1_0.created_at does not exist" 에러로 크래시 발생
-- 해결: ALTER TABLE로 누락된 타임스탬프 컬럼 추가 (NULL 불가, 기본값 NOW())
-- 영향도: UserService.loginWithSupabase() → studySessionRepository.findByUserId()
--         AnswerService.saveAndEvaluate() → session.touch() → updatedAt 업데이트
-- ============================================================================

-- study_session 테이블에 created_at, updated_at 컬럼 추가
ALTER TABLE public.study_session
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- 기존 레코드에 대해 현재 시간으로 초기화 (이미 NOT NULL DEFAULT NOW()로 자동 설정됨)
-- 추가 확인 쿼리
SELECT id, user_id, session_key, created_at, updated_at
FROM public.study_session
ORDER BY id DESC
LIMIT 10;
