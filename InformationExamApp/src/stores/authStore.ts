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
  loginWithGoogle: (googleIdToken: string) => Promise<{ requiresNickname: boolean; isNewUser: boolean }>;
  loginAsGuest: () => void;
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
   * @param googleIdToken - Google에서 받은 ID Token
   */
  loginWithGoogle: async (googleIdToken: string) => {
    console.log('[AuthStore] Google 로그인 시작 (백엔드 JWT 방식)');
    set({ isLoading: true });
    
    try {
      // 1. Google ID Token을 백엔드로 전송
      const response = await authService.loginWithGoogle(googleIdToken);
      console.log('[AuthStore] 백엔드 응답:', response);

      // 2. 백엔드 JWT 저장
      if (response.token) {
        await AsyncStorage.setItem('authToken', response.token);
        console.log('[AuthStore] JWT 저장 완료');
      }

      // 3. 사용자 정보로 상태 업데이트
      const user: User = {
        id: response.userId || 0,
        email: response.email || '',
        nickname: response.nickname || '',
        username: response.username || '',
      };
      
      set({ 
        user, 
        isAuthenticated: true,
        isLoading: false 
      });

      console.log('[AuthStore] 로그인 완료 - user:', user);
      
      return {
        requiresNickname: response.requiresNickname || false,
        isNewUser: response.isNewUser || false,
      };
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