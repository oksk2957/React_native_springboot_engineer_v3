# Supabase OAuth 전환 가이드

## 개요

이 문서는 Google OAuth HTTP origin 차단 문제를 해결하기 위해 Supabase OAuth로 전환하는 방법을 설명합니다.

## 문제 상황

- Oracle Cloud IP(158.180.78.125)가 HTTP로 설정되어 Google OAuth 차단
- Google OAuth 2.0 정책: HTTPS만 허용, IP 주소 차단

## 해결책

Supabase OAuth를 사용하여 Google OAuth 문제 해결
- Google은 Supabase 도메인만 확인, 클라이언트 origin은 확인하지 않음

## 1. Google OAuth 콘솔 설정

### 1.1 Google Cloud Console 접속
- URL: https://console.cloud.google.com/apis/credentials

### 1.2 OAuth 2.0 클라이언트 ID 설정

**클라이언트 ID:** `1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com`

**수정사항:**

#### 삭제 (HTTP IP 주소 - 차단됨):
```
승인된 JavaScript origin:
- ~~http://168.110.119.132:9000~~
- ~~http://158.180.78.125:9000~~
- ~~http://localhost:9000~~

승인된 리디렉션 URI:
- ~~http://168.110.119.132:9001/api/auth/google~~
- ~~http://158.180.78.125:9001/api/auth/google~~
```

#### 추가 (Supabase 도메인 - HTTPS):
```
승인된 JavaScript origin:
- https://gmhznnwecujoafdisscl.supabase.co

승인된 리디렉션 URI:
- https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
```

**최종 설정:**
```
클라이언트 ID: 1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com
클라이언트 보안 비밀번호: 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

승인된 JavaScript origin:
- https://gmhznnwecujoafdisscl.supabase.co

승인된 리디렉션 URI:
- https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
```

---

## 2. Supabase 콘솔 설정

### 2.1 Supabase 프로젝트 접속
- URL: https://app.supabase.com/project/gmhznnwecujoafdisscl

### 2.2 Authentication > Providers > Google 설정

**URL:** https://app.supabase.com/project/gmhznnwecujoafdisscl/auth/providers

**설정값:**
```
Client ID (Google에서 발급):
1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com

Client Secret (Google에서 발급):
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

Redirect URL (자동 생성):
https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
```

**상태:** Enabled (활성화)

### 2.3 Authentication > URL Configuration 설정

**URL:** https://app.supabase.com/project/gmhznnwecujoafdisscl/auth/url-configuration

**Site URL:**
```
http://158.180.78.125:9000
```

**Redirect URLs:**
```
http://158.180.78.125:9000/auth-callback
http://localhost:9000/auth-callback
http://localhost:3000/auth-callback
exp://172.30.1.8:9100/--/auth-callback
```

---

## 3. 코드 변경사항

### 3.1 백엔드 (Spring Boot)

#### 변경된 파일:
1. `backend/src/main/java/com/example/informationexam/service/SupabaseTokenVerifierService.java` (신규)
2. `backend/src/main/java/com/example/informationexam/service/UserService.java`
3. `backend/src/main/java/com/example/informationexam/controller/GoogleAuthController.java`
4. `backend/src/main/java/com/example/informationexam/config/SecurityConfig.java`

#### 주요 변경사항:
- `SupabaseTokenVerifierService`: Supabase JWT 검증 서비스 추가
- `UserService`: `loginWithSupabase()` 메서드 추가
- `GoogleAuthController`: `/api/auth/google` 엔드포인트에서 Supabase JWT 수신
- `SecurityConfig`: Supabase 도메인 CORS 허용 추가

### 3.2 프론트엔드 (React Native/Expo)

#### 변경된 파일:
1. `InformationExamApp/src/stores/authStore.ts`
2. `InformationExamApp/src/screens/Auth/AuthScreen.tsx`

#### 주요 변경사항:
- `authStore.ts`: `loginWithSupabase()` 메서드 추가
- `AuthScreen.tsx`: Supabase OAuth 로그인 버튼 연결

### 3.3 React Frontend

#### 변경된 파일:
1. `react-frontend/src/contexts/AuthContext.js`
2. `react-frontend/src/lib/supabase.js`

#### 주요 변경사항:
- `AuthContext.js`: Supabase OAuth 로그인, 백엔드 JWT 검증
- `supabase.js`: PKCE Flow 설정

---

## 4. 인증 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                     클라이언트 (Expo/React)                  │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   Google 로그인   │  │  Supabase OAuth │                   │
│  │   버튼 클릭      │──▶│  signInWithOAuth│                   │
│  └─────────────────┘  └────────┬────────┘                   │
│                                │                             │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (OAuth Server)                    │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Google OAuth   │  │  Session/JWT    │                   │
│  │  인증 처리      │──▶│  발급           │                   │
│  └─────────────────┘  └────────┬────────┘                   │
│                                │                             │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Oracle Cloud (Spring Boot)                  │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │  Supabase JWT   │  │  API 서비스    │                   │
│  │  검증           │──▶│  제공           │                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. 환경 변수

### 백엔드 (`backend/.env` 또는 `application.properties`)
```properties
# Supabase 설정
supabase.url=https://gmhznnwecujoafdisscl.supabase.co

# Google OAuth (기존 설정 유지)
spring.security.oauth2.client.registration.google.client-id=1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com
spring.security.oauth2.client.registration.google.client-secret=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

# 프론트엔드 Origin
frontend.origin=http://158.180.78.125:9000
```

### 프론트엔드 (React Native/Expo)
```
# .env 파일
EXPO_PUBLIC_SUPABASE_URL=https://gmhznnwecujoafdisscl.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtaHpubndlY3Vqb2FmZGlzc2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MjU4OTMsImV4cCI6MjA5MjIwMTg5M30.jaQObjuWjEoPI8ni-5MqHuBTuxQVCx3y1uPAb809eKc
```

### React Frontend
```
# .env 파일
REACT_APP_API_BASE_URL=http://158.180.78.125:9001/api
REACT_APP_FRONTEND_URL=http://158.180.78.125:9000
```

---

## 6. 테스트 방법

### 6.1 로컬 테스트
1. 백엔드 실행: `cd backend && ./gradlew bootRun`
2. 프론트엔드 실행: `cd InformationExamApp && npm start`
3. Google 로그인 버튼 클릭
4. Supabase OAuth 로그인 확인

### 6.2 배포 테스트
1. Oracle Cloud 서버에 배포
2. 프론트엔드 URL 접속: `http://158.180.78.125:9000`
3. Google 로그인 버튼 클릭
4. Supabase OAuth 로그인 확인

---

## 7. 문제 해결

### 7.1 CORS 오류
- `SecurityConfig.java`에서 Supabase 도메인 허용 확인
- `allowedOriginPatterns`에 `https://gmhznnwecujoafdisscl.supabase.co` 추가

### 7.2 JWT 검증 실패
- `SupabaseTokenVerifierService`에서 JWKS URL 확인
- Supabase 프로젝트 설정에서 JWT Secret 확인

### 7.3 OAuth 콜백 실패
- Supabase 콘솔에서 Redirect URL 설정 확인
- Google Cloud Console에서 승인된 리디렉션 URI 확인

---

## 8. 보안 고려사항

1. **Client Secret 관리**: Google Client Secret은 환경변수로 관리
2. **JWT 만료 시간**: Supabase JWT는 1시간 후 만료, 자동 갱신 설정
3. **CORS 설정**: 프로덕션 환경에서 `*` 대신 구체적인 origin 설정
4. **HTTPS**: 프로덕션 환경에서 HTTPS 사용

---

## 9. 참고 자료

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Spring Security CORS Configuration](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)
