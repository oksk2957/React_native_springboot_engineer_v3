import { useState, useEffect, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Google Cloud Console에서 발급받은 Client ID
const GOOGLE_CLIENT_ID = '1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com';
// Android/iOS Client ID가 있다면 각각 설정하세요
const GOOGLE_ANDROID_CLIENT_ID = ''; // Android Client ID
const GOOGLE_IOS_CLIENT_ID = ''; // iOS Client ID

// Supabase 또는 자체 백엔드 API URL
const API_BASE_URL = 'http://localhost:9000/api';

// WebBrowser 리디렉션 완료를 위해 필요
WebBrowser.maybeCompleteAuthSession();

interface User {
  id: number;
  email: string;
  username: string;
  nickname: string | null;
  role: string;
  pictureUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isNewUser: boolean;
  error: string | null;
}

export function useGoogleAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isNewUser: false,
    error: null,
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // 앱 시작 시 저장된 토큰 확인
  useEffect(() => {
    checkStoredAuth();
  }, []);

  // Google 로그인 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleAuth(response.params.id_token);
    } else if (response?.type === 'error') {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: response.error?.description || 'Google login failed',
      }));
    }
  }, [response]);

  // 저장된 인증 정보 확인
  const checkStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userStr = await AsyncStorage.getItem('user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        setAuthState({
          user,
          token,
          isLoading: false,
          isNewUser: false,
          error: null,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to check stored auth:', error);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // 백엔드 API로 Google 토큰 전송 및 회원가입/로그인 처리
  const handleGoogleAuth = async (idToken: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 백엔드로 ID 토큰 전송
      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // 토큰과 사용자 정보 저장
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      setAuthState({
        user: data.user,
        token: data.token,
        isLoading: false,
        isNewUser: data.isNewUser || false,
        error: null,
      });

      return data;
    } catch (error: any) {
      console.error('Google auth error:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to authenticate',
      }));
      throw error;
    }
  };

  // Google 로그인 시작
  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthState((prev) => ({ ...prev, error: null }));
      await promptAsync();
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        error: error.message || 'Failed to start Google login',
      }));
    }
  }, [promptAsync]);

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isNewUser: false,
        error: null,
      });
      router.replace('/');
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  }, [router]);

  // 별명 설정 (신규 사용자)
  const setNickname = async (nickname: string) => {
    try {
      const token = authState.token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/users/nickname`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update nickname');
      }

      // 사용자 정보 업데이트
      const updatedUser = { ...authState.user, nickname: data.nickname };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));

      return data;
    } catch (error: any) {
      setAuthState((prev) => ({
        ...prev,
        error: error.message || 'Failed to set nickname',
      }));
      throw error;
    }
  };

  return {
    ...authState,
    signInWithGoogle,
    signOut,
    setNickname,
    isAuthenticated: !!authState.token,
  };
}

// AuthContext for global auth state management
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useGoogleAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}