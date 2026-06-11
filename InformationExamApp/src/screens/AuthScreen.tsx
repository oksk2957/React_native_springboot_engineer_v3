import React, { useEffect, useState } from 'react';
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
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

// DEBUG: [Supabase-OAuth-2026-05-27] AuthScreen - Supabase OAuth 전환
// 원인: Google OAuth HTTP origin 차단 → Supabase OAuth로 전환
// 해결: expo-auth-session 제거, Supabase signInWithOAuth 사용
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { isLoading, loginWithSupabase, setSessionId } = useAuthStore();
  const [loginInProgress, setLoginInProgress] = useState(false);

  // DEBUG: [Supabase-OAuth-2026-05-27] Supabase OAuth 로그인 처리
  // 원인: Google OAuth HTTP origin 차단 → Supabase OAuth로 전환
  // 해결: Supabase signInWithOAuth 사용, 백엔드로 access_token 전달
  // 참고: Supabase Console Redirect URLs 설정에 맞춰 동적으로 redirectTo 설정
  //       - 개발: http://localhost:9000/auth-callback
  //       - Expo: exp://172.30.1.8:9100/--/auth-callback
  //       - 프로덕션: com.oksky.myapp://auth-callback
  const getRedirectUrl = (): string => {
    const isDev = __DEV__;
    const isWeb = Platform.OS === 'web';
    
    if (isWeb) {
      // 웹 환경: localhost 개발 서버
      return isDev ? 'http://localhost:9000/auth-callback' : 'https://gmhznnwecujoafdisscl.supabase.co';
    }
    
    // 네이티브 환경
    if (isDev) {
      // Expo 개발 환경
      return 'exp://172.30.1.8:9100/--/auth-callback';
    }
    
    // 프로덕션 환경
    return 'com.oksky.myapp://auth-callback';
  };

  const handleSupabaseLogin = async () => {
    console.log('[AuthScreen] Supabase OAuth 로그인 시작');
    setLoginInProgress(true);

    try {
      // 1. Supabase OAuth 로그인 (Google Provider)
      console.log('[AuthScreen] Supabase signInWithOAuth 호출');
      const redirectTo = getRedirectUrl();
      console.log('[AuthScreen] Redirect URL:', redirectTo);
      
      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // DEBUG: [Supabase-OAuth-2026-05-27] redirectTo 수정
          // 원인: Google OAuth IP 주소 불가 → Supabase OAuth로 전환
          // 해결: Supabase Console에 설정된 Redirect URLs에 맞춰 동적 설정
          //       CORS 고려: HTTPS 연결 사용, 웹/네이티브 환경 분기
          redirectTo,
          scopes: 'email profile openid',
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        console.error('[AuthScreen] Supabase OAuth 오류:', oauthError);
        throw new Error(oauthError.message);
      }

      console.log('[AuthScreen] Supabase OAuth URL:', oauthData.url);

      // 2. WebBrowser에서 OAuth 열기
      console.log('[AuthScreen] WebBrowser에서 OAuth 열기');
      let result;
      if (Platform.OS === 'web') {
        // 웹: 직접 리다이렉트
        window.location.href = oauthData.url;
        return { requiresNickname: false, isNewUser: false };
      } else {
        // 모바일: WebBrowser 사용
        result = await WebBrowser.openAuthSessionAsync(
          oauthData.url,
          redirectTo
        );
      }

      console.log('[AuthScreen] WebBrowser 결과:', result);

      if (result.type !== 'success') {
        throw new Error('사용자가 로그인을 취소했습니다.');
      }

      // 3. OAuth 완료 후 세션 확인
      console.log('[AuthScreen] OAuth 완료, 세션 확인');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AuthScreen] 세션 획득 오류:', sessionError);
        throw new Error(sessionError.message);
      }

      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.error('[AuthScreen] access_token을 획득하지 못했습니다.');
        throw new Error('Supabase access_token을 획득하지 못했습니다.');
      }

      console.log('[AuthScreen] Supabase access_token 획득 완료');

      // 4. 백엔드로 access_token 전달
      console.log('[AuthScreen] 백엔드 /api/auth/google로 access_token 전달');
      const loginResult = await loginWithSupabase();
      
      if (loginResult && typeof loginResult === 'object' && 'sessionId' in loginResult) {
        setSessionId(typeof loginResult.sessionId === 'number' ? loginResult.sessionId : null);
      }

      console.log('[AuthScreen] 로그인 완료');
    } catch (error: any) {
      console.error('[AuthScreen] Supabase OAuth 로그인 실패:', error.message || error);
      Alert.alert(
        '로그인 실패',
        error.message || 'Supabase OAuth 로그인 처리 중 오류가 발생했습니다.'
      );
    } finally {
      setLoginInProgress(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>📚</Text>
        <Text style={styles.title}>정보처리기사</Text>
        <Text style={styles.subtitle}>Google 계정으로 회원가입 및 시작</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.googleButton,
            (isLoading || loginInProgress) && styles.googleButtonDisabled,
          ]}
          onPress={handleSupabaseLogin}
          disabled={isLoading || loginInProgress}
          activeOpacity={0.8}
        >
          {isLoading || loginInProgress ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#666" size="small" />
              <Text style={styles.loadingText}>로그인 중...</Text>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Google로 회원가입 / 로그인</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.notice}>
          Google 로그인 시 서비스 이용약관{'\n'}개인정보 처리방침에 동의합니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
    backgroundColor: '#f8f9ff',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 72,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e7a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#8891b2',
    marginTop: 4,
  },
  buttonContainer: {
    paddingBottom: 16,
    gap: 16,
  },
  googleButton: {
    backgroundColor: '#e4d9d9',
    borderWidth: 1.5,
    borderColor: '#e4d9d9',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  googleButtonDisabled: {
    opacity: 0.7,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    backgroundColor:  '#ffffff',
      borderRadius: 12,     // width의 절반 → 원형,
    width: 24,
    textAlign: 'center',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '600',
  },
  notice: {
    color: '#aab0c8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
