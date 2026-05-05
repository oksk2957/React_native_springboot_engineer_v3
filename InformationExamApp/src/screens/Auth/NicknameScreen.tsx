import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface NicknameScreenProps {
  onComplete: () => void;
}

export const NicknameScreen: React.FC<NicknameScreenProps> = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const { setNickname: saveNickname, isLoading } = useAuthStore();
  
  const isValidLength = nickname.length >= 2 && nickname.length <= 10;
  const isAlphanumeric = /^[a-zA-Z0-9가-힣]+$/.test(nickname);
  
  const handleSubmit = async () => {
    if (!isValidLength || !isAlphanumeric) {
      Alert.alert(
        '입력 오류',
        '닉네임은 2~10자의 한글, 영어, 숫자만 가능합니다.'
      );
      return;
    }
    
    try {
      await saveNickname(nickname);
      onComplete();
    } catch (error) {
      Alert.alert(
        '설정 실패',
        '닉네임 설정 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>환영합니다!</Text>
            <Text style={styles.subtitle}>
              사용하실 닉네임을{'\n'}입력해주세요
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임 (2~10자)"
              placeholderTextColor={colors.textTertiary}
              maxLength={10}
              autoFocus
              autoCapitalize="none"
            />
            
            <View style={styles.validation}>
              <Text style={[
                styles.validationText,
                nickname.length >= 2 && nickname.length <= 10
                  ? styles.validationSuccess
                  : styles.validationError
              ]}>
                • 2~10자
              </Text>
              <Text style={[
                styles.validationText,
                isAlphanumeric && nickname.length > 0
                  ? styles.validationSuccess
                  : styles.validationError
              ]}>
                • 한글/영어/숫자만 가능
              </Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title="시작하기"
              onPress={handleSubmit}
              disabled={!isValidLength || !isAlphanumeric}
              loading={isLoading}
              size="large"
              style={styles.button}
            />
          </View>
          
          <Text style={styles.hint}>
            닉네임은 마이페이지에서{'\n'}언제든지 변경할 수 있습니다
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 28,
  },
  inputContainer: {
    marginBottom: spacing['2xl'],
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  validation: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  validationText: {
    ...typography.caption,
  },
  validationSuccess: {
    color: colors.success,
  },
  validationError: {
    color: colors.textTertiary,
  },
  buttonContainer: {
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
  },
  hint: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});