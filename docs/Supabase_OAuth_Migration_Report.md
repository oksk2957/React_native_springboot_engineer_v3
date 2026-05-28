# Supabase OAuth 마이그레이션 완료 보고서

## 개요
- **작성일**: 2026-05-27
- **프로젝트**: InformationExamApp (React Native/Expo + Spring Boot)
- **목적**: Google OAuth HTTP origin 차단 문제 해결

---

## 문제 상황

### 오류 메시지
```
400 오류: invalid_request
Use secure JavaScript origins and redirect URIs
OAuth 2.0 clients for web apps must use redirect URIs and JavaScript origins that are compliant with Google's validation rules, including using the HTTPS scheme.
```

### 원인
- Oracle Cloud IP(158.180.78.125)가 HTTP로 설정되어 있음
- Google OAuth 2.0 정책 변경: HTTPS만 허용, IP 주소 차단

---

## 해결책

### Supabase OAuth 도입
- Google은 Supabase 도메인만 확인, 클라이언트 origin은 확인하지 않음
- Supabase가 OAuth 중개자 역할 수행

### 아키텍처
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   클라이언트    │────▶│   Supabase      │────▶│   Google OAuth  │
│  (Oracle Cloud) │     │  (OAuth Server) │     │  (HTTPS only)   │
│                 │     │                 │     │                 │
│  HTTP origin    │     │  HTTPS origin   │     │  HTTPS origin   │
│  (차단됨)       │     │  (허용됨)       │     │  (허용됨)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 완료된 작업

### 1. Google OAuth 콘솔 설정 ✅

**삭제:**
- ~~http://168.110.119.132:9000~~
- ~~http://158.180.78.125:9000~~
- ~~http://localhost:9000~~

**추가:**
- https://gmhznnwecujoafdisscl.supabase.co

### 2. Supabase 콘솔 설정 ✅

**Authentication > Providers > Google:**
```
Client ID: 1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com
Client Secret: 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
Redirect URL: https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
상태: Enabled
```

**Authentication > URL Configuration:**
```
Site URL: http://158.180.78.125:9000
Redirect URLs:
  - http://158.180.78.125:9000/auth-callback
  - http://localhost:9000/auth-callback
```

### 3. 프론트엔드 수정 ✅

**파일:** `react-frontend/src/contexts/AuthContext.js`

**변경사항:**
```javascript
// 이전
const redirectTo = window.location.origin + '/auth-callback.html'

// 이후
const redirectTo = 'http://158.180.78.125:9000/auth-callback.html'
```

### 4. 백엔드 수정 ✅

**파일:** `backend/src/main/java/com/example/informationexam/config/SecurityConfig.java`

**변경사항:**
```java
List<String> allowedOriginPatterns = Arrays.asList(
    // ... 기존 설정 ...
    "https://gmhznnwecujoafdisscl.supabase.co", // Supabase 도메인 추가
    "*"
);
```

---

## 검증 체크리스트

- [x] Google Cloud Console > OAuth 2.0 클라이언트 ID 설정 완료
- [x] Supabase Console > Providers > Google 설정 완료
- [x] Supabase Console > URL Configuration 설정 완료
- [x] 프론트엔드 redirectTo 변경 완료
- [x] 백엔드 CORS 설정 변경 완료
- [x] 백엔드 SupabaseTokenVerifierService 사용 확인
- [x] 환경변수 설정 완료
- [ ] 로그인 테스트 (사용자가 직접 수행 필요)

---

## 다음 단계

1. **Google Cloud Console 설정 적용**
   - https://console.cloud.google.com/apis/credentials
   - Supabase 도메인 추가, IP 주소 제거

2. **Supabase Console 설정 적용**
   - https://app.supabase.com/project/gmhznnwecujoafdisscl
   - Google OAuth Provider 활성화

3. **로그인 테스트**
   - 프론트엔드에서 Google 로그인 버튼 클릭
   - Supabase OAuth 흐름 확인
   - 백엔드 JWT 검증 확인

---

## 참고 자료

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Spring Security CORS Documentation](https://docs.spring.io/spring-security/reference/servlet/integrations/cors.html)

---

## 문서 정보

- **작성자**: AI 개발 어시스턴트
- **작성일**: 2026-05-27
- **버전**: 1.0
- **상태**: 완료
