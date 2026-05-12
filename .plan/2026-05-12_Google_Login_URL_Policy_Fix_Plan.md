# Google 로그인 버튼 작동 불능 진단 및 해결 계획서 (URL 규칙 반영)

## 1. 현재 상황 및 사용자 제보 분석
- **현상**: Google 로그인 버튼 작동 불능.
- **사용자 제보**: 과거 `localhost:9000`을 Redirect URI로 사용했을 때 Google에서 정책 위반(규칙 어긋남)으로 차단했던 경험이 있음.
- **분석**: 
  - 현재 `InformationExamApp`은 `http://localhost:9000/auth-callback`을 웹 리다이렉트 주소로 사용 중.
  - Google은 웹 클라이언트 ID 사용 시 특정 보안 규칙을 요구하며, 특히 모바일 환경(WebView 등)에서 웹용 클라이언트 ID를 사용하는 것을 차단함.
  - `InformationExamApp` 코드 내에 Android/iOS용 Client ID가 비어 있음 (`GOOGLE_ANDROID_CLIENT_ID = ''`).

## 2. 가설 및 예상 원인

### 가설 1: Google OAuth 리다이렉트 정책 위반
1.  **Web Client ID 오용**: 모바일 앱에서 웹용 클라이언트 ID를 사용하여 인증을 시도할 경우 Google에서 `disallowed_useragent` 에러를 띄우거나 차단함.
2.  **리다이렉트 URI 미등록**: `http://localhost:9000/auth-callback`이 Google Cloud Console의 "승인된 리다이렉션 URI"에 등록되어 있지 않음.
3.  **Supabase 설정 불일치**: Supabase 콘솔의 "Site URL" 또는 "Redirect URLs" 설정에 `http://localhost:9000`이 누락됨.

### 가설 2: Client ID 및 기기별 설정 누락
1.  **Android/iOS Client ID 부재**: 네이티브 환경인 Expo Go나 빌드 앱에서 작동하려면 전용 Client ID가 필수이나 현재 누락됨.
2.  **SHA-1 지문 미등록**: 안드로이드의 경우 Google Cloud Console에 디버그/릴리즈 SHA-1 키 지문이 등록되어야 함.

## 3. 상세 진단 및 해결 단계

### 단계 1: Google Cloud Console 및 Supabase 설정 점검
- [ ] **Google Cloud Console**:
  - `1033672402385-...` 클라이언트 ID의 승인된 리다이렉션 URI에 `https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback` 등록 확인.
  - 웹용 리다이렉션 URI에 `http://localhost:9000/auth-callback` (또는 실제 사용 도메인) 등록 확인.
- [ ] **Supabase Dashboard**:
  - Authentication -> URL Configuration -> Site URL을 `http://localhost:9000` (또는 실제 도메인)으로 설정.
  - Redirect URLs에 모바일 스킴(`com.oksky.myapp://auth-callback`) 추가.

### 단계 2: 프론트엔드 코드 수정 (InformationExamApp)
- [ ] `useGoogleAuth.tsx` 내 `GOOGLE_ANDROID_CLIENT_ID` 및 `GOOGLE_IOS_CLIENT_ID` 발급 및 적용.
- [ ] `Platform.select`에 따른 리다이렉트 로직이 각 환경의 정책에 맞는지 재검토.
- [ ] `localhost` 대신 실제 IP(예: `10.0.2.2` 또는 PC IP)를 사용하여 모바일 기기에서의 통신 문제 해결.

### 단계 3: 백엔드 검증 로직 및 로그 확인
- [ ] `GoogleAuthController`에서 클라이언트 ID가 프론트엔드와 일치하는지 확인.
- [ ] `pom.xml` 또는 `build.gradle`에 구글 라이브러리(`google-api-client`)가 정상 포함되었는지 확인 (이미 `backend/build.gradle`에는 포함됨).

## 4. 권장 해결책: Tunneling 서비스 사용
- Google에서 `localhost`를 차단하거나 HTTPS를 강제하는 경우, `ngrok`이나 `localtunnel`을 사용하여 `https://xyz.ngrok-free.app` 형태의 주소를 발급받아 테스트할 것을 권장함.

## 5. 변경 이력
- 2026-05-12: `react-frontend\src\contexts\AuthContext.js` 파일에서 `redirectTo`를 로컬호스트 주소에서 Supabase 인증 콜백 주소(`https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback`)로 변경 완료.

