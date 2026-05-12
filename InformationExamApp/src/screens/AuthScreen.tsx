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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/api';

// ✅ 웹 브라우저 OAuth 세션 완료 처리 (expo-web-browser 필수)
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser, loginWithGoogle } = useAuthStore();

  // ✅ 핵심: Supabase onAuthStateChange로 세션 변경 감지
  // detectSessionInUrl: true 설정 시 SDK가 자동으로 ?code= 파라미터를 교환 완료 후
  // SIGNED_IN 이벤트를 발생시킵니다.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthScreen] Auth 이벤트 수신:', event, '| 세션 존재:', !!session);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthScreen] 로그인 완료 - 사용자:', session.user.email);
          setIsLoading(true);

          try {
            // ✅ 백엔드(Spring Boot)와 동기화 — Supabase access_token을 전달
            console.log('[AuthScreen] 백엔드 동기화 시작...');
            const syncResponse = await authService.loginWithGoogle(session.access_token);
            console.log('[AuthScreen] 백엔드 동기화 성공:', syncResponse.success);

            if (syncResponse.token) {
              await AsyncStorage.setItem('authToken', syncResponse.token);
              console.log('[AuthScreen] JWT 토큰 저장 완료');
            }

            setUser({
              id: syncResponse.user?.id ?? (session.user.id as any),
              email: syncResponse.user?.email ?? session.user.email ?? '',
              nickname:
                syncResponse.user?.nickname ??
                syncResponse.user?.username ??
                session.user.user_metadata?.full_name ??
                '사용자',
            });

            console.log('[AuthScreen] 로그인 및 동기화 완료 ✅');
          } catch (syncError: any) {
            console.warn('[AuthScreen] 백엔드 동기화 실패 (Supabase 정보로 임시 로그인):', syncError.message);
            // 백엔드 동기화 실패 시 Supabase 사용자 정보로 임시 로그인
            setUser({
              id: session.user.id as any,
              email: session.user.email ?? '',
              nickname: session.user.user_metadata?.full_name ?? '사용자',
            });
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthScreen] 로그아웃 처리');
          setUser(null);
          await AsyncStorage.removeItem('authToken');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthScreen] 토큰 갱신 완료');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('[AuthScreen] Google 로그인 시도...');
      await loginWithGoogle();
      // ✅ 웹: loginWithGoogle() 호출 후 브라우저가 Google → Supabase → localhost:9000 순으로 리다이렉트됨
      // SDK가 자동으로 code를 교환하고 onAuthStateChange(SIGNED_IN)을 발생시킴
    } catch (error: any) {
      console.error('[AuthScreen] 로그인 오류:', error.message || error);
      Alert.alert('로그인 실패', error.message || '구글 로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>📚</Text>
        <Text style={styles.title}>정보처리기사</Text>
        <Text style={styles.subtitle}>시험 준비 앱</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#666" size="small" />
              <Text style={styles.loadingText}>로그인 중...</Text>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Google로 시작하기</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.notice}>
          로그인 시 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의합니다.
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
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e0e3ef',
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