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
 * [수정 요망] Google ID Token 획득을 위한 라이브러리 설치 필요
 * 
 * Expo 프로젝트인 경우:
 * npx expo install expo-auth-session
 * 
 * React Native CLI인 경우:
 * npm install @react-native-google-signin/google-signin
 * 
 * 획득한 Google ID Token을 loginWithGoogle(idToken)에 전달하세요.
 */
export const AuthScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, loginAsGuest } = useAuthStore();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: 실제 Google 로그인 라이브러리로 ID Token 획득 필요
      // 예시 (expo-auth-session 사용 시):
      // const { type, params } = await *AuthSession.startAsync({
      //   authUrl: `https://accounts.google.com/o/oauth2/v2/auth?...`,
      // });
      // const idToken = params.id_token;
      
      // 테스트를 위해 임시로 직접 토큰 전달 (실제 구현 시 제거)
      // 실제 구현 시 아래 코드를 Google 로그인 라이브러리로 대체
      Alert.alert(
        '알림', 
        'Google 로그인 라이브러리가 설치되지 않았습니다.\n\n' +
        'Expo: npx expo install expo-auth-session\n' +
        'CLI: npm install @react-native-google-signin/google-signin\n\n' +
        '설치 후 Google ID Token 획득 로직을 구현하세요.'
      );
      
      setIsLoading(false);
      return;

      // 실제 구현 시 아래 주석 해제:
      // const idToken = await getGoogleIdToken(); // 라이브러리로 획득
      // const result = await loginWithGoogle(idToken);
      
      // if (result.requiresNickname) {
      //   // 닉네임 설정 화면으로 이동
      //   Alert.alert('닉네임 설정', '사용할 닉네임을 입력해 주세요.');
      // } else {
      //   Alert.alert('로그인 성공', '환영합니다!');
      // }
      
    } catch (err: any) {
      console.error('Auth handleLogin error:', err);
      Alert.alert(
        '로그인 오류', 
        err?.message || '로그인 처리 중 문제가 발생했습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    Alert.alert('게스트 로그인', '게스트로 시작합니다.');
  };

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
          disabled={isLoading}
        >
          <Text style={styles.guestButtonText}>게스트로 시작</Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          * 게스트模式下에서는 저장 기능이 제한됩니다.
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
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});