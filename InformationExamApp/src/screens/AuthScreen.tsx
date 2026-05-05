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
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuthStore();

  // 토큰 추출
  const extractParams = (url: string) => {
    if (!url) return null;
    try {
      // hash(#)와 query(?) 모두 체크
      const parts = url.split(/[#?]/);
      if (parts.length < 2) return null;
      
      const paramString = parts[1];
      const params = new URLSearchParams(paramString);
      
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const code = params.get('code');

      return { access_token, refresh_token, code };
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
        // Implicit Flow 또는 이미 교환된 세션
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) throw error;
        session = data.session;
      } else if (params.code) {
        // PKCE Flow
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) throw error;
        session = data.session;
      }

      if (session?.user) {
        // 1. Supabase 세션의 엑세스 토큰을 AsyncStorage에 저장 (api interceptor용)
        await AsyncStorage.setItem('authToken', session.access_token);
        
        // 2. 스토어에 사용자 정보 저장
        setUser({
          id: session.user.id as any,
          email: session.user.email || '',
          nickname: session.user.user_metadata?.full_name || '사용자',
        });
        
        Alert.alert('로그인 성공!', '홈으로 이동합니다.');
      }
    } catch (err: any) {
      console.log('Login error:', err);
      Alert.alert('로그인 오류', err.message || '세션을 설정하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // URL 리스너
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url) {
        console.log('Incoming URL:', event.url);
        loginWithToken(event.url);
      }
    });
    
    // 초기 URL 확인 (앱이 꺼져있을 때 딥링크로 켜진 경우)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
        loginWithToken(url);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Linking.createURL을 사용하여 환경(Expo Go 또는 개발 빌드)에 맞는 URL 생성
      const redirectUrl = Linking.createURL('auth-callback');
      console.log('Using redirectUrl:', redirectUrl);
      
      // 웹 환경에서 IP 주소로 접속 시 crypto 에러 방지
      if (Platform.OS === 'web' && 
          window.location.hostname !== 'localhost' && 
          window.location.protocol !== 'https:') {
        Alert.alert('보안 알림', '웹 브라우저에서는 localhost 주소로 접속해야 구글 로그인이 가능합니다.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: redirectUrl, 
          scopes: 'email profile',
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success' && result.url) {
          await loginWithToken(result.url);
        } else if (result.type === 'cancel') {
          Alert.alert('취소됨', '로그인이 취소되었습니다.');
        }
      }
    } catch (err: any) {
      console.log('Auth handleLogin error:', err);
      Alert.alert('오류', err?.message || '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>정처기 앱</Text>
      <Text style={styles.subtitle}>로그인</Text>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#666" />
        ) : (
          <Text style={styles.googleButtonText}>Google로 시작하기</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#4a90e2',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});