/**
 * [마이그레이션 완료] LoginScreen
 * 
 * 이전: useGoogleAuth 훅 (Expo Google Auth → 백엔드 JWT 방식)
 * 현재: authStore (Supabase OAuth Redirect 방식)
 * 
 * 이 컴포넌트는 src/screens/AuthScreen.tsx로 대체되었습니다.
 * 추후 제거 예정이지만, 다른 곳에서 import 중일 수 있어 유지합니다.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { isAuthenticated, isLoading, user, loginWithGoogle, logout } = useAuthStore();

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      onLoginSuccess?.();
    } catch (err: any) {
      Alert.alert('로그인 실패', err.message || '구글 로그인에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      Alert.alert('로그아웃 실패', err.message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={{ marginTop: 16, color: '#666' }}>로그인 중...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>안녕하세요, {user?.nickname || user?.username}! 👋</Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleLogout}>
          <Text style={styles.buttonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>정보처리기사</Text>
      <Text style={styles.subtitle}>학습 앱</Text>

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Google로 시작하기</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        로그인하면 서비스 약관과 개인정보 처리방침에 동의합니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333333', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#666666', marginBottom: 48 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#333333', marginBottom: 8 },
  emailText: { fontSize: 14, color: '#666666', marginBottom: 32 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    marginVertical: 8,
  },
  secondaryButton: { backgroundColor: '#666666' },
  googleButton: { backgroundColor: '#4285F4', marginTop: 20 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  termsText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 32,
  },
});

export default LoginScreen;