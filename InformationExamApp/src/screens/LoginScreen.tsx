import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const {
    user,
    isLoading,
    error,
    isNewUser,
    signInWithGoogle,
    signOut,
    setNickname,
    isAuthenticated,
  } = useGoogleAuth();

  const [nicknameInput, setNicknameInput] = useState('');
  const [isSettingNickname, setIsSettingNickname] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: any) {
      Alert.alert('로그인 실패', err.message || '구글로그인에 실패했습니다.');
    }
  };

  const handleSetNickname = async () => {
    if (!nicknameInput.trim()) {
      Alert.alert('오류', '별명을 입력해주세요.');
      return;
    }

    try {
      await setNickname(nicknameInput.trim());
      setIsSettingNickname(false);
      onLoginSuccess?.();
    } catch (err: any) {
      Alert.alert('설정 실패', err.message || '별명 설정에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err: any) {
      Alert.alert('로그아웃 실패', err.message);
    }
  };

  // 로그인된 상태 - 별명 설정 화면
  if (isAuthenticated && isNewUser && !user?.nickname) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>환영합니다! 🎉</Text>
        <Text style={styles.subText}>사용할 별명을 입력해주세요</Text>

        <TextInput
          style={styles.input}
          placeholder="별명"
          value={nicknameInput}
          onChangeText={setNicknameInput}
          autoFocus
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSetNickname}
        >
          <Text style={styles.buttonText}>확인</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 로그인된 상태
  if (isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>안녕하세요, {user?.nickname || user?.username}! 👋</Text>
        <Text style={styles.emailText}>{user?.email}</Text>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 로그인 전 상태
  return (
    <View style={styles.container}>
      <Text style={styles.title}>정보처리기사</Text>
      <Text style={styles.subtitle}>학습 앱</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={handleGoogleSignIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.buttonText}>Google로 시작하기</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.termsText}>
        로그인하면{' '}
        <Text style={styles.linkText}>서비스 약관</Text>과{' '}
        <Text style={styles.linkText}>개인정보 처리방침</Text>에 동의합니다.
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 48,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
  },
  subText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
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
  primaryButton: {
    backgroundColor: '#4A90E2',
  },
  secondaryButton: {
    backgroundColor: '#666666',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  googleIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#ffe6e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  termsText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 32,
  },
  linkText: {
    color: '#4A90E2',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;