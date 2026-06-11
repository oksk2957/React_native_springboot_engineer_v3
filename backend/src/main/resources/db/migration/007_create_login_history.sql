-- ============================================================================
-- [2026-06-11 수정41] login_history 테이블 생성 — 로그인 출석 기록용
-- ============================================================================
-- 목적: 사용자가 로그인한 날짜를 기록하여 미니달력(잔디)에 표시
-- 구조: user_id + login_date UNIQUE 제약으로 하루 1회만 기록
-- 영향: UserService.loginWithSupabase()에서 로그인 시 UPSERT
-- ============================================================================

-- login_history 테이블 생성
CREATE TABLE IF NOT EXISTS public.login_history (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, login_date)  -- 하루 1회만 기록 (중복 방지)
);

-- 인덱스 추가 (월별 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_login_history_user_date
  ON public.login_history(user_id, login_date DESC);

-- 검증: 테이블 생성 확인
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'login_history'
ORDER BY ordinal_position;
