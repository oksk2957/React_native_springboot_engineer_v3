/**
 * [제거됨] useGoogleAuth 훅
 * 
 * 이 훅은 Expo Google Auth (Google.useAuthRequest)와 백엔드 POST /api/auth/google 방식을 사용했으나,
 * 현재 프로젝트는 Supabase OAuth Redirect 방식(signInWithOAuth)으로 통일되었습니다.
 * 
 * 대체:
 * - Supabase OAuth 로그인: src/screens/AuthScreen.tsx → authStore.loginWithGoogle()
 * - 백엔드 JWT 방식: authStore.loginWithGoogleIdToken()
 * - Supabase 세션 관리: supabase.auth.onAuthStateChange() + authStore.setSession()
 * 
 * 삭제 사유:
 * - Supabase Redirect OAuth 방식과 직접 Google API 호출 방식이 충돌하여 무한 콜백 발생
 * - 두 인증 전략을 동시에 유지할 필요 없음
 */
export {};