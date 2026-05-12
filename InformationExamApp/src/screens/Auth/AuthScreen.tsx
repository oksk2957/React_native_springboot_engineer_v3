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
      // 30년차 개발자의 최종 설계: 
      // 1. 구글 인증은 Supabase(HTTPS)가 대행합니다.
      // 2. 인증 완료 후 Supabase는 사용자가 킨 로컬 서버(9001)로 '직접' 리다이렉트합니다.
      // 이 과정에서 Google의 HTTPS 제한을 완벽히 우회합니다.
      const localServerAuthUrl = 'http://localhost:9001/api/auth/google';
      
      console.log('Redirecting through Supabase to Local Server:', localServerAuthUrl);

      // Supabase OAuth 호출
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // redirectTo를 로컬 서버의 API 주소로 설정하여 Supabase가 인증 후 서버로 쏴주게 만듭니다.
          redirectTo: localServerAuthUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: Platform.OS === 'web', 
        },
      });

      if (error) throw error;

      if (data?.url) {
        if (Platform.OS === 'web') {
          // Web: Supabase -> Local Server (9001) -> App (8436) 체인 가동
          window.location.assign(data.url);
        } else {
          // Native: 브라우저 세션 열기
          const result = await WebBrowser.openAuthSessionAsync(data.url, localServerAuthUrl);

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