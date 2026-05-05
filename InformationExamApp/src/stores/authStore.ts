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
  loginWithGoogle: (idToken: string) => Promise<{ requiresNickname: boolean }>;
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
  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.loginWithGoogle(idToken);
      const userData = response.user;
      // 저장된 다크 모드 설정 로드
      const savedDarkMode = await AsyncStorage.getItem('darkMode');
      set({ user: userData, isAuthenticated: true, isLoading: false, darkMode: savedDarkMode === 'true' });
      return { requiresNickname: !userData.nickname };
    } catch (error) {
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