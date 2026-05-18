import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import { useAuthStore } from '../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  '1033672402385-hdhb1unve0rebnh3sor0c6b8cljfkla8.apps.googleusercontent.com';

export default function AuthScreen() {
  const { isLoading, loginWithGoogleIdToken, setSessionId } = useAuthStore();
  const [loginInProgress, setLoginInProgress] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    responseType: ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    const completeGoogleLogin = async () => {
      if (!response) {
        return;
      }

      if (response.type === 'dismiss' || response.type === 'cancel') {
        setLoginInProgress(false);
        return;
      }

      if (response.type !== 'success') {
        setLoginInProgress(false);
        Alert.alert('로그인 실패', 'Google 로그인 인증이 완료되지 않았습니다.');
        return;
      }

      try {
        const idToken =
          response.params?.id_token ||
          response.authentication?.idToken;

        if (!idToken) {
          throw new Error('Google ID Token을 획득하지 못했습니다.');
        }

        const result = await loginWithGoogleIdToken(idToken);
        if (result && typeof result === 'object' && 'sessionId' in result) {
          setSessionId(typeof result.sessionId === 'number' ? result.sessionId : null);
        }
      } catch (error: any) {
        console.error('[AuthScreen] Google 로그인 완료 처리 실패:', error.message || error);
        Alert.alert(
          '로그인 실패',
          error.message || 'Google 로그인 처리 중 오류가 발생했습니다.'
        );
      } finally {
        setLoginInProgress(false);
      }
    };

    completeGoogleLogin();
  }, [response, loginWithGoogleIdToken]);

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert(
        '로그인 준비 중',
        'Google 로그인 요청을 준비하고 있습니다. 잠시 후 다시 시도해주세요.'
      );
      return;
    }

    setLoginInProgress(true);
    try {
      await promptAsync();
    } catch (error: any) {
      console.error('[AuthScreen] Google 로그인 시작 실패:', error.message || error);
      setLoginInProgress(false);
      Alert.alert(
        '로그인 실패',
        error.message || 'Google 로그인 화면을 여는 중 오류가 발생했습니다.'
      );
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
            (isLoading || loginInProgress || !request) && styles.googleButtonDisabled,
          ]}
          onPress={handleGoogleLogin}
          disabled={isLoading || loginInProgress || !request}
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
