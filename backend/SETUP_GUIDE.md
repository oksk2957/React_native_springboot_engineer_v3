# ============================================================================
# 정처기앱 전체 설정 가이드
# ============================================================================
# 작성일: 2026-06-07
# 목적: Phase 0~4 전체 자동 설정
# ============================================================================

## 📋 사전 준비물

### 1. Supabase 계정 정보 (필수)
- **Supabase URL**: https://gmhznnwecujoafdisscl.supabase.co
- **Supabase anon key**: Dashboard → Settings → API → Project API keys → anon public
- **JWT Secret**: Dashboard → Settings → API → JWT Settings → JWT Secret
  - ⚠️ **중요**: anon key가 아닙니다!
  - ⚠️ **중요**: 매우 긴 문자열입니다 (Base64 인코딩됨)

### 2. Google OAuth (선택)
- **Google Client ID**: Google Cloud Console → APIs & Services → Credentials
- **Google Client Secret**: 위와 동일

---

## 🚀 빠른 시작 (자동화 스크립트 사용)

### 방법 1: PowerShell 자동화 (권장)

```powershell
# 1. 백엔드 폴더로 이동
cd backend

# 2. 전체 설정 스크립트 실행
.\setup-all.ps1
```

**스크립트가 자동으로 수행하는 작업:**
1. ✅ .env 파일 생성 (템플릿에서 복사)
2. ✅ 환경변수 입력 안내
3. ✅ DB 스키마 수정 (option1~5 컬럼 추가)
4. ✅ 기존 프로세스 종료
5. ✅ 백엔드 시작

---

### 방법 2: 수동 설정

#### 1단계: .env 파일 생성

```powershell
cd backend
copy .env.template .env
notepad .env
```

**.env 파일 내용:**
```env
# Supabase Configuration
SUPABASE_URL=https://gmhznnwecujoafdisscl.supabase.co
SUPABASE_KEY=여기에_anon_key_입력
SUPABASE_JWT_SECRET=여기에_JWT_Secret_입력

# Database
DB_URL=jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:6543/postgres?external_id=gmhznnwecujoafdisscl&prepareThreshold=0&options=-c%20client_encoding%3Dutf8&sslmode=require
DB_USERNAME=postgres.gmhznnwecujoafdisscl
DB_PASSWORD=wjdcjrlgkqrur

# JWT Configuration
JWT_SECRET=여기에_JWT_Secret_입력
JWT_TOKEN_VALIDITY=43200
JWT_REFRESH_VALIDITY=86400

# Google OAuth (선택)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

#### 2단계: DB 스키마 수정

**Supabase Dashboard → SQL Editor → New Query**

```sql
-- subjective_problems 테이블에 option1~5 컬럼 추가
ALTER TABLE public.subjective_problems
ADD COLUMN IF NOT EXISTS option1 varchar(500),
ADD COLUMN IF NOT EXISTS option2 varchar(500),
ADD COLUMN IF NOT EXISTS option3 varchar(500),
ADD COLUMN IF NOT EXISTS option4 varchar(500),
ADD COLUMN IF NOT EXISTS option5 varchar(500);

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subjective_problems'
ORDER BY ordinal_position;
```

#### 3단계: 백엔드 재시작

```powershell
cd backend
.\restart-backend.bat
```

또는 수동:
```powershell
# 기존 프로세스 종료
netstat -ano | findstr :9001
taskkill /PID [찾은_PID] /F

# 백엔드 시작
./mvnw.cmd spring-boot:run
```

#### 4단계: 프론트엔드 시작

```powershell
cd InformationExamApp
npm start
```

---

## ✅ 검증 체크리스트

### 백엔드 검증
```bash
# 헬스 체크
curl http://localhost:9001/api/health

# 과목 목록 조회
curl http://localhost:9001/api/subjects

# 객관식 문제 랜덤 조회
curl http://localhost:9001/api/problems/random/objective
```

### 프론트엔드 검증
1. 앱 실행 후 로그인
2. 통계 탭 → 데이터 표시 확인
3. 오답 탭 → 오답 목록 확인
4. 이론 탭 → 이론 카드 로드 확인

---

## 🔧 문제 해결

### 문제 1: JWT 검증 실패
```
ERROR SupabaseTokenVerifierService - Signed JWT rejected
```
**원인**: JWT Secret이 잘못됨
**해결**: 
1. Supabase Dashboard → Settings → API → JWT Settings
2. **JWT Secret** 복사 (anon key 아님!)
3. .env 파일의 `SUPABASE_JWT_SECRET`과 `JWT_SECRET`에粘贴

### 문제 2: DB 연결 실패
```
Connection refused: aws-1-ap-south-1.pooler.supabase.com:6543
```
**원인**: 네트워크 문제 또는 Supabase 프로젝트 비활성화
**해결**:
1. Supabase Dashboard에서 프로젝트 활성화 확인
2. 방화벽 설정 확인

### 문제 3: option1~5 컬럼 오류
```
ERROR: column sp.option1 does not exist
```
**원인**: DB 스키마 수정 미실행
**해결**: 2단계 SQL 실행

---

## 📁 생성된 파일 목록

```
backend/
├── .env.template          # 환경변수 템플릿
├── .env                   # 실제 환경변수 (Git에 커밋되지 않음)
├── setup-all.ps1          # 전체 자동 설정 스크립트
├── setup-supabase.ps1     # Supabase 전용 설정 스크립트
├── restart-backend.bat    # 백엔드 재시작 스크립트
├── RUN_ON_SUPABASE.sql    # 수동 SQL 실행 파일
└── server.log             # 실행 로그
```

---

## 🎯 완료 후 예상 결과

| API | 수정 전 | 수정 후 |
|-----|---------|---------|
| GET /api/statistics | solvedProblems: 0 | 실제 풀이 수 |
| GET /api/wrong-answers | [] | 실제 오답 목록 |
| GET /api/subjects | 500 에러 | 과목 목록 반환 |
| GET /api/problems/random/objective | null 포함 | 정상 문제 반환 |
| GET /api/problems/theory?category=운영체제 | SQL 에러 | 이론 카드 반환 |

---

## 📞 지원

문제 발생 시:
1. `server.log` 파일 확인
2. `Get-Content server.log -Wait`으로 실시간 로그 확인
3. Supabase Dashboard → Database → Logs 확인

---

**작성일**: 2026-06-07
**버전**: 1.0
