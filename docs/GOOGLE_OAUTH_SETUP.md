# Google OAuth 콘솔 설정 가이드 (선택지 B)

## 📋 개요
Google OAuth HTTP origin 문제를 해결하기 위해 Google Cloud Console에서 승인된 JavaScript origin을 Supabase 도메인으로 변경합니다.

---

## 🔧 1단계: Google Cloud Console 설정

### 1.1 Google Cloud Console 접속
- URL: https://console.cloud.google.com/
- 계정: okskycar1@gmail.com

### 1.2 OAuth 2.0 클라이언트 ID 설정
1. **API 및 서비스** > **사용자 인증 정보** 이동
2. **OAuth 2.0 클라이언트 ID** 선택: `1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com`
3. **승인된 JavaScript origin** 섹션 수정:

**기존 (문제):**
```
http://168.110.119.132:9000
http://158.180.78.125:9000
```

**변경 후 (해결):**
```
https://gmhznnwecujoafdisscl.supabase.co
```

### 1.3 승인된 리디렉션 URI 설정
**기존:**
```
http://168.110.119.132:9001/api/auth/google
http://158.180.78.125:9001/api/auth/google
```

**변경 후:**
```
https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback
```

---

## 🔧 2단계: Supabase Console 설정

### 2.1 Supabase Console 접속
- URL: https://supabase.com/dashboard
- 프로젝트: gmhznnwecujoafdisscl

### 2.2 Authentication > Providers > Google 설정
1. **Google Provider** 활성화
2. **Client ID** 입력: `1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com`
3. **Client Secret** 입력: `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`
4. **Redirect URL**: `https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback`
5. **저장** 클릭

---

## 🔧 3단계: 코드 수정 (자동화)

### 3.1 AuthScreen.tsx 수정
- Supabase OAuth 로그인 버튼 추가
- 기존 Google OAuth 버튼 주석 처리

### 3.2 authStore.ts 수정
- Supabase OAuth 로그인 로직 개선
- 세션 관리 개선

### 3.3 api.ts 수정
- API URL 설정 확인
- 디버깅 로그 추가

---

## ✅ 검증 방법

### 4.1 로그인 테스트
1. 앱 실행
2. Google 로그인 버튼 클릭
3. Supabase OAuth 페이지로 리디렉션 확인
4. Google 계정 선택
5. 로그인 성공 확인

### 4.2 백엔드 로그 확인
```bash
tail -f backend/app.log
```

### 4.3 프론트엔드 로그 확인
```bash
cd InformationExamApp && npm start
```

---

## 📝 참고사항

- **변경 전 반드시 백업 수행**
- **Google Cloud Console 변경 후 5-10분 소요**
- **Supabase Console 변경 후 즉시 적용**
- **테스트 시 시크릕 모드 사용 권장**

---

## 🐛 디버깅

### 문제: "redirect_uri_mismatch" 오류
**원인:** Google Cloud Console의 리디렉션 URI 불일치
**해결:** Supabase 콜백 URL 정확히 입력 확인

### 문제: "invalid_client" 오류
**원인:** Client ID/Secret 불일치
**해결:** Google Cloud Console과 Supabase Console 값 일치 확인

### 문제: CORS 오류
**원인:** SecurityConfig.java의 CORS 설정 미포함
**해결:** Supabase 도메인이 CORS allowed origins에 포함되어 있는지 확인

---

**작성일:** 2026-05-27
**작성자:** AI 개발 모델
**버전:** 1.0