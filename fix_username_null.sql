-- Hibernate username NOT NULL 오류 해결 스크립트
-- Supabase 콘솔에서 실행하세요

-- 1. username 컬럼 추가 (없으면)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. NULL 값 확인
SELECT COUNT(*) FROM users WHERE username IS NULL;

-- 3. NULL 값 수정 (id를 활용한 고유 username 생성)
UPDATE users SET username = 'user_' || id::text WHERE username IS NULL;

-- 4. NOT NULL 제약조건 적용
ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- 5. 수정 확인
SELECT COUNT(*) FROM users WHERE username IS NULL;