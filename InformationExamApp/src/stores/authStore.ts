import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import type { User } from '../types';
import { authService } from '../services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  darkMode: boolean;
  lastProblemId: number;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setDarkMode: (enabled: boolean) => Promise<void>;
  setLastProblemId: (id: number) => void;
  loginWithGoogle: () => Promise<{ requiresNickname: boolean }>;
  loginAsGuest: () => void;
  setLoggedIn: (isLoggedIn: boolean, user?: User) => void;
  setNickname: (nickname: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  darkMode: false,
  lastProblemId: 1,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setDarkMode: async (enabled: boolean) => {
    await AsyncStorage.setItem('darkMode', JSON.stringify(enabled));
    set({ darkMode: enabled });
  },
  setLastProblemId: (id: number) => set({ lastProblemId: id }),
  loginWithGoogle: async () => {
    console.log('[AuthStore] Google 로그인 시작');
    set({ isLoading: true });
    try {
      // ✅ 현재 실행 포트를 정확히 감지하여 redirectTo 설정
      // Supabase가 Google 인증 완료 후 이 URL로 돌아와 ?code= 파라미터를 전달함
      const redirectTo = (Platform.OS === 'web' && typeof window !== 'undefined')
        ? window.location.origin   // 현재 포트 자동 감지 (9000, 8081 어느 포트든 OK)
        : 'com.oksky.myapp://auth'; // 모바일 딥링크

      console.log('[AuthStore] redirectTo URL:', redirectTo);

      if (typeof supabase === 'undefined') {
        throw new Error('Supabase 클라이언트가 초기화되지 않았습니다.');
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          redirectTo,
          // ✅ skipBrowserRedirect: false (기본값) — 브라우저가 자동으로 Google로 이동
        },
      });

      if (error) {
        console.error('[AuthStore] Supabase OAuth 오류:', error);
        throw error;
      }

      console.log('[AuthStore] OAuth 리다이렉트 시작 - URL:', data?.url);
      return { requiresNickname: false };
    } catch (error: any) {
      console.error('[AuthStore] 로그인 오류:', error.message || error);
      set({ isLoading: false });
      throw error;
    }
  },
  loginAsGuest: () => {
    const guestUser: User = {
      id: 0,
      email: 'guest@example.com',
      nickname: '게스트',
    };
    set({ user: guestUser, isAuthenticated: true });
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
        set({ user: { ...currentUser, nickname }, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  logout: async () => {
    await authService.logout();
    await AsyncStorage.removeItem('darkMode');
    set({ user: null, isAuthenticated: false, darkMode: false });
  },
}));