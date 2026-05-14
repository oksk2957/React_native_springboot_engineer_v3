import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  /**
   * Google 로그인 - 백엔드 JWT 방식
   *
   * 흐름:
   * 1. Google ID Token을 백엔드 /api/auth/google 로 전달
   * 2. 백엔드는 Google 토큰 검증
   * 3. 기존 사용자 로그인 또는 신규 사용자 생성
   * 4. 백엔드 JWT 발급
   * 5. 앱은 JWT 저장 후 로그인 완료
   */
  loginWithGoogleIdToken: (
    googleIdToken: string
  ) => Promise<{ requiresNickname: boolean; isNewUser: boolean }>;
  setLoggedIn: (isLoggedIn: boolean, user?: User) => void;
  setNickname: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
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
  setLastProblemId: (id) => set({ lastProblemId: id }),

  /**
   * Google 로그인 - 백엔드 JWT 방식
   *
   * 흐름:
   * 1. Google ID Token을 백엔드 /api/auth/google 로 전달
   * 2. 백엔드는 Google 토큰 검증
   * 3. 기존 사용자 로그인 또는 신규 사용자 생성
   * 4. 백엔드 JWT 발급
   * 5. 앱은 JWT 저장 후 로그인 완료
   */
  loginWithGoogleIdToken: async (googleIdToken: string) => {
    console.log('[AuthStore] Google 로그인 시작 - 백엔드 JWT 방식');
    set({ isLoading: true });

    try {
      const response = await authService.loginWithGoogle(googleIdToken);
      console.log('[AuthStore] 백엔드 로그인 응답:', response);

      if (!response || !response.token || !response.user) {
        throw new Error('로그인 응답이 올바르지 않습니다.');
      }

      await AsyncStorage.setItem('authToken', response.token);

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
    await authService.logout();
    await AsyncStorage.removeItem('darkMode');
    await AsyncStorage.removeItem('authToken');
    set({
      user: null,
      isAuthenticated: false,
      darkMode: false,
    });
    console.log('[AuthStore] 로그아웃 완료');
  },
}));
