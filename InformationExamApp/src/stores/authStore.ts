import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { User } from '../types';
import { authService } from '../services/api';
import { supabase } from '../lib/supabase';

// DEBUG: [Logout-Fix-2026-06-09] 로그아웃 진행 중 플래그
// 원인: Web에서 signOut() 호출 후 SIGNED_IN 이벤트가 다시 발생해 재로그인되는 레이스 컨디션
// 해결: 로그아웃 시작 시 true, 완료 시 false → SIGNED_IN 이벤트 무시
export let isLoggingOut = false;

// DEBUG: [Supabase-OAuth-2026-05-27] AuthStore - Supabase OAuth 통합
// 원인: Google ID Token 직접 전달 → Supabase OAuth + JWT 검증으로 전환
// 해결: Supabase signInWithOAuth 사용 후 access_token을 백엔드로 전달

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  darkMode: boolean;
  lastProblemId: number;
  sessionId: number | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setLastProblemId: (id: number) => void;
  setSessionId: (sessionId: number | null) => void;
  /**
   * Supabase OAuth 로그인
   * 
   * 흐름:
   * 1. Supabase signInWithOAuth 호출 (Google Provider)
   * 2. Supabase 콜백 후 access_token 획득
   * 3. access_token을 백엔드 /api/auth/google로 전달
   * 4. 백엔드는 Supabase JWT 검증
   * 5. 기존 사용자 로그인 또는 신규 사용자 생성
   * 6. 백엔드 JWT 발급
   * 7. 앱은 JWT 저장 후 로그인 완료
   * 
   * DEBUG: [Supabase-OAuth-2026-05-27] AuthScreen에서 호출됨
   * 원인: Google OAuth HTTP origin 차단 → Supabase OAuth로 전환
   * 해결: AuthScreen.handleSupabaseLogin()에서 호출
   */
  loginWithSupabase: () => Promise<{ requiresNickname: boolean; isNewUser: boolean }>;
  setLoggedIn: (isLoggedIn: boolean, user?: User) => void;
  setNickname: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  // DEBUG: [JWT-2026-05-28] 토큰 만료 확인 및 갱신 함수 추가
  checkTokenExpiry: () => Promise<boolean>;
  refreshToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  darkMode: false,
  lastProblemId: 1,
  sessionId: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setDarkMode: async (enabled: boolean) => {
    await AsyncStorage.setItem('darkMode', JSON.stringify(enabled));
    set({ darkMode: enabled });
  },
  setLastProblemId: (id) => set({ lastProblemId: id }),
  setSessionId: (sessionId) => set({ sessionId }),

  /**
   * Supabase OAuth 로그인
   * 
   * 흐름:
   * 1. Supabase signInWithOAuth 호출 (Google Provider)
   * 2. Supabase 콜백 후 access_token 획득
   * 3. access_token을 백엔드 /api/auth/google로 전달
   * 4. 백엔드는 Supabase JWT 검증
   * 5. 기존 사용자 로그인 또는 신규 사용자 생성
   * 6. 백엔드 JWT 발급
   * 7. 앱은 JWT 저장 후 로그인 완료
   * 
   * DEBUG: [Supabase-OAuth-2026-05-27] loginWithSupabase 구현
   * 원인: Google OAuth HTTP origin 차단 → Supabase OAuth로 전환
   * 해결: Supabase signInWithOAuth 사용 후 access_token을 백엔드로 전달
   */
  loginWithSupabase: async () => {
    console.log('[AuthStore] Supabase OAuth 로그인 시작');
    set({ isLoading: true });

    try {
      // 1. Supabase OAuth URL 생성
      console.log('[AuthStore] Supabase signInWithOAuth 호출');
      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // DEBUG: [Supabase-OAuth-2026-05-27] redirectTo 수정
          // 원인: Google OAuth IP 주소 불가 → Supabase 도메인 사용
          // 해결: 공개 최상위 도메인(.com)으로 변경, 경로 제거
          redirectTo: 'https://gmhznnwecujoafdisscl.supabase.co',
          scopes: 'email profile openid',
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        console.error('[AuthStore] Supabase OAuth 오류:', oauthError);
        throw new Error(oauthError.message);
      }

      console.log('[AuthStore] Supabase OAuth URL:', oauthData.url);

      // 2. WebBrowser에서 OAuth 열기
      console.log('[AuthStore] WebBrowser에서 OAuth 열기');
      let result;
      if (Platform.OS === 'web') {
        // 웹: 직접 리다이렉트
        window.location.href = oauthData.url;
        return { requiresNickname: false, isNewUser: false };
      } else {
        // 모바일: WebBrowser 사용
        result = await WebBrowser.openAuthSessionAsync(
          oauthData.url,
          'https://gmhznnwecujoafdisscl.supabase.co'
        );
      }

      console.log('[AuthStore] WebBrowser 결과:', result);

      if (result.type !== 'success') {
        throw new Error('사용자가 로그인을 취소했습니다.');
      }

      // 3. URL에서 access_token 추출
      console.log('[AuthStore] URL에서 access_token 추출');
      let accessToken: string | null = null;
      
      if (result.url) {
        // URL에서 access_token 추출
        const url = new URL(result.url);
        const hash = url.hash;
        console.log('[AuthStore] URL hash:', hash);
        
        if (hash) {
          // hash에서 access_token 추출
          const params = new URLSearchParams(hash.substring(1));
          accessToken = params.get('access_token');
          console.log('[AuthStore] hash에서 access_token 추출:', accessToken ? '성공' : '실패');
        }
        
        // hash에 없으면 query parameter에서 추출
        if (!accessToken) {
          const params = new URLSearchParams(url.search);
          accessToken = params.get('access_token');
          console.log('[AuthStore] query에서 access_token 추출:', accessToken ? '성공' : '실패');
        }
      }
      
      // access_token이 없으면 Supabase 세션에서 획득
      if (!accessToken) {
        console.log('[AuthStore] Supabase 세션에서 access_token 획득 시도');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthStore] 세션 획득 오류:', sessionError);
          throw new Error(sessionError.message);
        }
        
        accessToken = sessionData.session?.access_token ?? null;
      }
      
      if (!accessToken) {
        console.error('[AuthStore] access_token을 획득하지 못했습니다.');
        throw new Error('Supabase access_token을 획득하지 못했습니다.');
      }

      // DEBUG: [AI-AUTHOR-20260609-P0] access_token 상세 정보 로깅 (Google 400 디버깅)
      const tokenPreview = accessToken.length > 20
        ? accessToken.substring(0, 20) + '...' : accessToken;
      console.log('[AuthStore][DEBUG-P0] access_token detail:', {
        length: accessToken.length,
        preview: tokenPreview,
        hasDot: accessToken.includes('.'),
        startsWith: accessToken.substring(0, 10),
      });

      // 4. 백엔드로 access_token 전달
      console.log('[AuthStore] 백엔드 /api/auth/google로 access_token 전달');
      const response = await authService.loginWithGoogle(accessToken);
      console.log('[AuthStore] 백엔드 로그인 응답:', response);

      if (!response || !response.token || !response.user) {
        throw new Error('로그인 응답이 올바르지 않습니다.');
      }

      // DEBUG: [JWT-2026-05-28] 토큰 저장 로직 개선
      // 원인: 토큰 저장 후 예외 발생 시 catch 블록에서 삭제됨
      // 해결: 저장 후 즉시 확인 및 예외 처리 개선
      console.log('[AuthStore] 토큰 저장 시도:', response.token ? '토큰 존재' : '토큰 없음');
      
      try {
        await AsyncStorage.setItem('authToken', response.token);
        
        // DEBUG: [JWT-2026-05-28] 토큰 저장 후 즉시 확인
        const savedToken = await AsyncStorage.getItem('authToken');
        console.log('[AuthStore] 토큰 저장 확인:', savedToken ? '성공' : '실패');
        
        // DEBUG: [JWT-2026-05-28] 토큰 만료 시간 저장 (12시간 후)
        // 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 만료 시간 저장
        // 해결: 현재 시간 + 12시간을 저장하여 만료 여부 확인
        const tokenExpiryTime = Date.now() + (12 * 60 * 60 * 1000); // 12시간 후
        await AsyncStorage.setItem('tokenExpiryTime', tokenExpiryTime.toString());
        console.log('[AuthStore] 토큰 만료 시간 저장:', new Date(tokenExpiryTime).toLocaleString());
      } catch (storageError) {
        console.error('[AuthStore] 토큰 저장 실패:', storageError);
        throw new Error('토큰 저장에 실패했습니다.');
      }

      const user: User = {
        id: response.user.id,
        email: response.user.email ?? '',
        nickname: response.user.nickname ?? '',
        username: response.user.username ?? '',
        profileImage: response.user.profileImage,
        role: response.user.role,
        isAdmin: response.user.isAdmin,
        trialExpired: response.user.trialExpired,
        requiresPayment: response.user.requiresPayment,
        canAccessApp: response.user.canAccessApp,
      };

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('[AuthStore] 로그인 완료:', {
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
      });

      return {
        requiresNickname: response.requiresNickname || false,
        isNewUser: response.isNewUser || false,
      };
    } catch (error: any) {
      console.error('[AuthStore] 로그인 실패:', error.message || error);
      await AsyncStorage.removeItem('authToken');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  },

  setLoggedIn: (isLoggedIn: boolean, user?: User) => {
    if (isLoggedIn && user) {
      set({ user, isAuthenticated: true });
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  setNickname: async (nickname: string) => {
    set({ isLoading: true });
    try {
      await authService.setNickname(nickname);
      const currentUser = get().user;
      if (currentUser) {
        set({
          user: { ...currentUser, nickname },
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    // DEBUG: [Logout-Fix-2026-06-09] Supabase 세션도 함께 정리
    // 원인: authToken만 삭제하고 supabase.auth.signOut()을 호출하지 않아
    //       Supabase 세션이 AsyncStorage에 남아있어 앱 재시작 시 자동 재로그인됨
    // 해결: Zustand 상태 리셋 → AsyncStorage 정리 → Supabase signOut 순서

    // 1. Zustand 상태 먼저 리셋 (Web 레이스 컨디션 방지)
    set({
      user: null,
      isAuthenticated: false,
      darkMode: false,
    });

    // 2. AsyncStorage 정리
    await authService.logout();
    await AsyncStorage.removeItem('darkMode');
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('tokenExpiryTime'); // DEBUG: [JWT-2026-05-28] 토큰 만료 시간 삭제

    // 3. Supabase 세션 정리 (SIGNED_OUT 이벤트 발생 → App.tsx에서 추가 정리)
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('[AuthStore] Supabase signOut 경고:', error.message);
      } else {
        console.log('[AuthStore] Supabase 세션 해제 완료');
      }
    } catch (e: any) {
      console.warn('[AuthStore] Supabase signOut 예외 (무시):', e.message);
    }

    console.log('[AuthStore] 로그아웃 완료');
  },

  // DEBUG: [JWT-2026-05-28] 토큰 만료 여부 확인 함수
  // 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 만료 여부 확인 필요
  // 해결: 저장된 만료 시간과 현재 시간 비교
  checkTokenExpiry: async () => {
    try {
      const tokenExpiryTimeStr = await AsyncStorage.getItem('tokenExpiryTime');
      if (!tokenExpiryTimeStr) {
        console.log('[AuthStore] 토큰 만료 시간 없음 - 비회원 상태');
        return false;
      }

      const tokenExpiryTime = parseInt(tokenExpiryTimeStr, 10);
      const currentTime = Date.now();
      const timeLeft = tokenExpiryTime - currentTime;

      // DEBUG: [JWT-2026-05-28] 토큰 만료 시간 디버깅 로그
      console.log('[AuthStore] 토큰 만료 확인:', {
        현재시간: new Date(currentTime).toLocaleString(),
        만료시간: new Date(tokenExpiryTime).toLocaleString(),
        남은시간: Math.floor(timeLeft / 1000 / 60) + '분',
        만료여부: timeLeft <= 0,
      });

      if (timeLeft <= 0) {
        console.log('[AuthStore] 토큰 만료됨 - 자동 갱신 시도');
        // 토큰 갱신 로직 호출
        await get().refreshToken();
        return true;
      }

      // 1시간 미만으로 남았으면 자동 갱신
      if (timeLeft < 60 * 60 * 1000) {
        console.log('[AuthStore] 토큰 1시간 미만 남음 - 자동 갱신 시도');
        await get().refreshToken();
        return true;
      }

      console.log('[AuthStore] 토큰 유효함');
      return true;
    } catch (error) {
      console.error('[AuthStore] 토큰 만료 확인 오류:', error);
      return false;
    }
  },

  // DEBUG: [JWT-2026-05-28] 토큰 갱신 함수
  // 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 토큰 재발급 필요
  // 해결: 백엔드 API를 호출하여 새로운 토큰 발급
  refreshToken: async () => {
    try {
      console.log('[AuthStore] 토큰 갱신 시작');
      const currentToken = await AsyncStorage.getItem('authToken');
      if (!currentToken) {
        console.log('[AuthStore] 갱신할 토큰 없음');
        return false;
      }

      // 백엔드 API 호출하여 토큰 갱신
      const response = await authService.refreshToken(currentToken);
      if (response && response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        const tokenExpiryTime = Date.now() + (12 * 60 * 60 * 1000); // 12시간 후
        await AsyncStorage.setItem('tokenExpiryTime', tokenExpiryTime.toString());
        console.log('[AuthStore] 토큰 갱신 완료 - 새로운 만료 시간:', new Date(tokenExpiryTime).toLocaleString());
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AuthStore] 토큰 갱신 실패:', error);
      // 갱신 실패 시 로그아웃 처리
      await get().logout();
      return false;
    }
  },
}));
