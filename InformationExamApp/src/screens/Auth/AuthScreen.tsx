import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, loginAsGuest, setLoggedIn } = useAuthStore();

  // URL에서 토큰 파라미터 추출
  const extractParams = (url: string) => {
    if (!url) return null;
    try {
      const parts = url.split(/[#?]/);
      if (parts.length < 2) return null;
      const params = new URLSearchParams(parts[1]);
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        code: params.get('code'),
      };
    } catch { return null; }
  };

  // 토큰으로 로그인
  const loginWithToken = async (url: string) => {
    const params = extractParams(url);
    if (!params) return;

    try {
      setIsLoading(true);
      let session;
      if (params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) throw error;
        session = data.session;
      } else if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) throw error;
        session = data.session;
      }

      if (session?.user) {
        await AsyncStorage.setItem('authToken', session.access_token);
        await loginWithGoogle(session.access_token);
        Alert.alert('로그인 성공!', '홈으로 이동합니다.');
      }
    } catch (err: any) {
      Alert.alert('로그인 오류', err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // URL 리스너
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) loginWithToken(event.url);
    });
    Linking.getInitialURL().then((url) => {
      if (url) loginWithToken(url);
    });
    return () => subscription.remove();
  }, []);

  // Google 로그인
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Google 인증 후 Supabase 콜백 URL로 돌아오도록 설정 (코드 교환 안정화)
      const redirectUrl = 'https://gmhznnwecujoafdisscl.supabase.co/auth/v1/callback';
      console.log('Using redirectUrl:', redirectUrl);

      // 2. Supabase OAuth 호출
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS === 'web' ? true : false, // Web에서는 우리가 직접 리다이렉트, Native는 기존대로 false 유지
        },
      });

      if (error) throw error;

      if (data?.url) {
        if (Platform.OS === 'web') {
          // Web 환경: COOP 정책 차단을 피하기 위해 전체 페이지 리다이렉트 수행
          window.location.assign(data.url);
        } else {
          // Native 환경: 브라우저 세션 열기
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

          if (result.type === 'success' && result.url) {
            await loginWithToken(result.url);
          }
        }
      }
    } catch (err: any) {
      console.error('Auth handleLogin error:', err);
      Alert.alert('로그인 오류', '로그인 처리 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => loginAsGuest();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>정보처리기사</Text>
          <Text style={styles.subtitle}>실기合格率 패스</Text>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.googleButtonText}>Google로 시작하기</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestLogin}
        >
          <Text style={styles.guestButtonText}>게스트로 시작</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 8,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});