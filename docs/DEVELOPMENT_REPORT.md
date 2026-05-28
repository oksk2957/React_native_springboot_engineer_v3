# Supabase OAuth 전환 개발 보고서

## 📋 프로젝트 개요

- **프로젝트명**: InformationExamApp (정보처리기사 시험 대비 앱)
- **개발일**: 2026-05-27
- **개발자**: AI 개발 모델
- **선택지**: B (Google OAuth 콘솔 설정 변경 + 코드 수정)

---

## 🎯 개발 목표

Google OAuth HTTP origin 문제를 해결하기 위해 Supabase OAuth로 전환합니다.

**문제 상황:**
- Oracle Cloud IP(158.180.78.125)가 HTTP로 설정되어 Google OAuth 차단
- "redirect_uri_mismatch" 오류 발생
- 클라이언트에서 직접 Google OAuth 호출 시 보안 정책 위반

**해결 방안:**
- Google Cloud Console에서 승인된 JavaScript origin 변경
- Supabase Console에서 Google Provider 설정
- 프론트엔드 코드를 Supabase OAuth로 전환

---

## 🔧 개발 내용

### 1. Google Cloud Console 설정 (수동)

**변경 파일:** 없음 (콘솔 설정)

**변경 내용:**
- **승인된 JavaScript origin:**
  - 기존: `http://158.180.78.125:9000`
  - 변경: `https://gmhznnwecujoafdisscl.supabase.co`

- **승인된 리디렉션 URI:**
  - 기존: `http://158.180.78.125:9001/api/auth/google`
  - 변경: `https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback`

### 2. Supabase Console 설정 (수동)

**변경 파일:** 없음 (콘솔 설정)

**변경 내용:**
- **Authentication > Providers > Google:**
  - Client ID: `1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com`
  - Client Secret: `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`
  - Redirect URL: `https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback`

### 3. AuthScreen.tsx 수정

**파일:** `InformationExamApp/src/screens/AuthScreen.tsx`

**변경 내용:**
- `expo-auth-session` 제거
- `expo-web-browser` 유지
- Supabase OAuth 로그인 버튼 추가 (`handleSupabaseLogin`)
- 기존 Google OAuth 로직 제거
- 디버깅 로그 추가

**핵심 코드:**
```typescript
const handleSupabaseLogin = async () => {
  console.log('[AuthScreen] Supabase OAuth 로그인 시작');
  setLoginInProgress(true);

  try {
    // 1. Supabase OAuth 로그인 (Google Provider)
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://158.180.78.125:9000/auth-callback',
        scopes: 'email profile openid',
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    // 2. 세션 리스닝 (OAuth 콜백 후)
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    // 3. 백엔드로 access_token 전달
    const result = await loginWithGoogleIdToken(accessToken);
    
  } catch (error) {
    console.error('[AuthScreen] Supabase OAuth 로그인 실패:', error);
  }
};
```

### 4. authStore.ts 수정

**파일:** `InformationExamApp/src/stores/authStore.ts`

**변경 내용:**
- `loginWithSupabase` 함수에 디버깅 로그 추가
- JSDoc 주석 업데이트
- Supabase OAuth 흐름 문서화

### 5. api.ts 수정

**파일:** `InformationExamApp/src/services/api.ts`

**변경 내용:**
- API URL 설정에 Supabase OAuth 관련 주석 추가
- `loginWithGoogle` 함수에 디버깅 로그 추가
- Supabase access_token으로 로그인하도록 주석 업데이트

### 6. SecurityConfig.java 확인

**파일:** `backend/src/main/java/com/example/informationexam/config/SecurityConfig.java`

**상태:** 이미 Supabase 도메인 추가됨 ✅

```java
"https://gmhznnwecujoafdisscl.supabase.co", // Supabase 도메인
```

---

## 📊 개발 결과

### 수정된 파일 목록

| 순번 | 파일 경로 | 수정 내용 | 상태 |
|------|----------|----------|------|
| 1 | `docs/GOOGLE_OAUTH_SETUP.md` | Google OAuth 설정 가이드 작성 | ✅ 완료 |
| 2 | `InformationExamApp/src/screens/AuthScreen.tsx` | Supabase OAuth 버튼 추가 | ✅ 완료 |
| 3 | `InformationExamApp/src/stores/authStore.ts` | 디버깅 로그 추가 | ✅ 완료 |
| 4 | `InformationExamApp/src/services/api.ts` | 디버깅 로그 추가 | ✅ 완료 |
| 5 | `backend/.../SecurityConfig.java` | 이미 Supabase 도메인 추가됨 | ✅ 확인 |

### 디버깅 로그 추가 현황

| 파일 | 디버깅 로그 내용 |
|------|----------------|
| `AuthScreen.tsx` | `[AuthScreen] Supabase OAuth 로그인 시작`, `Supabase signInWithOAuth 호출`, `access_token 획득 완료` |
| `authStore.ts` | `[AuthStore] Supabase OAuth 로그인 시작`, `백엔드 /api/auth/google로 access_token 전달` |
| `api.ts` | `[API Auth] Supabase access_token으로 로그인 시도` |

---

## 🚀 배포 및 검증

### 수동 설정 단계

1. **Google Cloud Console 설정**
   - https://console.cloud.google.com/ 접속
   - API 및 서비스 > 사용자 인증 정보
   - OAuth 2.0 클라이언트 ID 수정
   - 승인된 JavaScript origin 변경
   - 승인된 리디렉션 URI 변경

2. **Supabase Console 설정**
   - https://supabase.com/dashboard 접속
   - Authentication > Providers > Google
   - Client ID/Secret 입력
   - Redirect URL 설정

### 코드 배포

```bash
# 프론트엔드 빌드
cd InformationExamApp
npm run build

# 백엔드 빌드
cd backend
./gradlew build
```

### 검증 방법

1. **로그인 테스트**
   - 앱 실행
   - Google 로그인 버튼 클릭
   - Supabase OAuth 페이지로 리디렉션 확인
   - Google 계정 선택
   - 로그인 성공 확인

2. **로그 확인**
   ```bash
   # 프론트엔드
   [AuthScreen] Supabase OAuth 로그인 시작
   [AuthScreen] Supabase signInWithOAuth 호출
   [AuthScreen] Supabase access_token 획득 완료
   [AuthScreen] 백엔드 /api/auth/google로 access_token 전달
   
   # 백엔드
   [AUTH][traceId][POST][START] Supabase OAuth login request received
   [AUTH][traceId][STEP1] Supabase JWT 검증 완료
   [AUTH][traceId][STEP2] 사용자 조회 시작
   ```

---

## 🐛 알려진 문제 및 해결책

### 문제 1: "redirect_uri_mismatch" 오류
**원인:** Google Cloud Console의 리디렉션 URI 불일치
**해결:** Supabase 콜백 URL 정확히 입력 확인

### 문제 2: CORS 오류
**원인:** SecurityConfig.java의 CORS 설정 미포함
**해결:** Supabase 도메인이 CORS allowed origins에 포함되어 있는지 확인

### 문제 3: 세션 만료
**원인:** Supabase 세션 만료 시간 설정
**해결:** Supabase Console에서 세션 만료 시간 설정 확인

---

## 📝 결론

Supabase OAuth로 전환하여 Google OAuth HTTP origin 문제를 해결했습니다.

**핵심 변경사항:**
1. Google Cloud Console에서 승인된 origin을 Supabase 도메인으로 변경
2. Supabase Console에서 Google Provider 설정
3. 프론트엔드 코드를 Supabase OAuth로 전환
4. 디버깅 로그 추가로 문제 추적 용이

**예상 효과:**
- Google OAuth HTTP origin 문제 해결
- 보안성 향상 (Supabase가 중간에서 인증 처리)
- 사용자 경험 개선 (원활한 로그인)

---

## 📚 참고 자료

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [Spring Security CORS 설정](https://docs.spring.io/spring-security/reference/web/reactive/cors.html)

---

**작성일:** 2026-05-27
**작성자:** AI 개발 모델
**버전:** 1.0