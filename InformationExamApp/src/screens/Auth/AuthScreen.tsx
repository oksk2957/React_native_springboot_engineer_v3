import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme';

// DEBUG: [Supabase-OAuth-2026-05-27] AuthScreen - Supabase OAuth 통합
// 원인: Google ID Token 직접 전달 → Supabase OAuth + JWT 검증으로 전환
// 해결: Supabase signInWithOAuth 사용 후 access_token을 백엔드로 전달
/**
 * AuthScreen (screens/Auth/)
 * - Supabase OAuth 회원가입/로그인 단일 진입점
 * - Supabase JWT 기반 인증
 */
export const AuthScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithSupabase } = useAuthStore();

  /**
   * Supabase OAuth 로그인
   */
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log('[AuthScreen] Supabase OAuth 로그인 시작');
      const result = await loginWithSupabase();
      
      if (result.isNewUser) {
        console.log('[AuthScreen] 신규 사용자, 닉네임 설정 필요:', result.requiresNickname);
      }
      
      console.log('[AuthScreen] 로그인 완료');
    } catch (err: any) {
      console.error('[AuthScreen] 로그인 실패:', err);
      
      // 사용자 취소 처리
      if (err.message?.includes('USER_CANCELLED') || err.message?.includes('cancel')) {
        console.log('[AuthScreen] 사용자가 로그인을 취소했습니다.');
        return;
      }
      
      Alert.alert(
        '로그인 실패',
        err?.message || '로그인 처리 중 오류가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>정보처리기사</Text>
          <Text style={styles.subtitle}>자격증Fundamental</Text>
        </View>

        <TouchableOpacity
          style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.googleButtonText}>Google로 회원가입 / 로그인</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Google 로그인 시 서비스 이용약관{'\n'}개인정보 처리방침에 동의합니다.
        </Text>
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
  googleButtonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
