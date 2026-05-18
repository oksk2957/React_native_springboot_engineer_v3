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

/**
 * AuthScreen (screens/Auth/)
 * - 비회원 진입 제거
 * - Google OAuth 회원가입/로그인 단일 진입점
 * - 백엔드 JWT 기반 인증
 */
export const AuthScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogleIdToken, setSessionId } = useAuthStore();

  /**
   * Google 로그인 - 실제 Google Sign-In 라이브러리 연결 필요
   */
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 Google Sign-In 라이브러리로 교체 필요
      // 예시:
      // const { idToken } = await GoogleSignin.signIn();
      // const result = await loginWithGoogleIdToken(idToken);
      // if (result && 'sessionId' in result) setSessionId(result.sessionId ?? null);
      Alert.alert(
        '알림',
        '아직 Google ID Token 획득 라이브러리가 설정되지 않아 로그인 테스트가 불가능합니다.\n\n' +
          '이 화면에서는 authService/loginWithGoogle 호출만 가능합니다.'
      );
    } catch (err: any) {
      console.error('Auth handleLogin error:', err);
      if (err.message?.includes('USER_CANCELLED') || err.message?.includes('cancel')) {
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
          style={styles.googleButton}
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
