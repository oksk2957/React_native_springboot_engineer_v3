import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './src/lib/supabase';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProblemScreen from './src/screens/ProblemScreen';
import WrongAnswerScreen from './src/screens/WrongAnswerScreen';
import TheoryScreen from './src/screens/TheoryScreen';
import ProgrammingScreen from './src/screens/ProgrammingScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import { useAuthStore } from './src/stores/authStore';
import type { User } from './src/types';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Problem: '✏️',
    Wrong: '✕',
    Programming: '💻',
    Theory: '📖',
    Stats: '📊',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: focused ? 20 : 16, opacity: focused ? 1 : 0.5 }}>{icons[name] || '?'}</Text>
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#fff' }}>
      <Tab.Navigator
        id="MainTabs"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
          tabBarActiveTintColor: '#4a90e2',
          tabBarInactiveTintColor: '#999',
          tabBarIndicatorStyle: { backgroundColor: '#4a90e2', height: 3 },
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 2,
            ...Platform.select({
              web: {
                boxShadow: '0px 2px 2px rgba(0, 0, 0, 0.1)',
              },
              default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              },
            }),
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: 'bold',
            marginTop: 4,
          },
          tabBarItemStyle: {
            padding: 8,
          },
          tabBarShowIcon: true,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
        <Tab.Screen name="Problem" component={ProblemScreen} options={{ title: '문제' }} />
        <Tab.Screen name="Wrong" component={WrongAnswerScreen} options={{ title: '오답' }} />
        <Tab.Screen name="Programming" component={ProgrammingScreen} options={{ title: '코드' }} />
        <Tab.Screen name="Theory" component={TheoryScreen} options={{ title: '이론' }} />
        <Tab.Screen name="Stats" component={StatisticsScreen} options={{ title: '통계' }} />
      </Tab.Navigator>
    </View>
  );
}

/**
 * AsyncStorage에 저장된 JWT 토큰으로 세션을 복원합니다.
 * AuthScreen에서 loginWithGoogleIdToken으로 로그인한 후,
 * 앱이 다시 시작될 때 이 함수가 호출되어 사용자 정보를 복원합니다.
 * 
 * DEBUG: [JWT-2026-05-28] 토큰 만료 확인 및 자동 갱신 로직 추가
 * 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 토큰 만료 여부 확인 필요
 * 해결: 토큰 만료 시간 확인 후 갱신 또는 로그아웃 처리
 */
async function restoreSessionFromJWT(): Promise<User | null> {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.log('[App] 저장된 JWT 토큰 없음');
      return null;
    }

    console.log('[App] JWT 토큰으로 세션 복원 시도...');
    console.log('[App] 저장된 토큰:', token.substring(0, 20) + '...');

    // DEBUG: [JWT-2026-05-28] 토큰 만료 시간 확인
    const tokenExpiryTimeStr = await AsyncStorage.getItem('tokenExpiryTime');
    if (tokenExpiryTimeStr) {
      const tokenExpiryTime = parseInt(tokenExpiryTimeStr, 10);
      const currentTime = Date.now();
      const timeLeft = tokenExpiryTime - currentTime;

      console.log('[App] 토큰 만료 확인:', {
        현재시간: new Date(currentTime).toLocaleString(),
        만료시간: new Date(tokenExpiryTime).toLocaleString(),
        남은시간: Math.floor(timeLeft / 1000 / 60) + '분',
      });

      // 토큰이 만료되었거나 1시간 미만으로 남았으면 갱신 시도
      if (timeLeft <= 0) {
        console.log('[App] 토큰 만료됨 - 갱신 시도');
        const { useAuthStore } = await import('./src/stores/authStore');
        const authStore = useAuthStore.getState();
        const refreshed = await authStore.refreshToken();
        if (!refreshed) {
          console.log('[App] 토큰 갱신 실패 - 로그아웃 처리');
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('tokenExpiryTime');
          return null;
        }
      } else if (timeLeft < 60 * 60 * 1000) {
        console.log('[App] 토큰 1시간 미만 남음 - 백그라운드 갱신 시도');
        const { useAuthStore } = await import('./src/stores/authStore');
        const authStore = useAuthStore.getState();
        // 백그라운드에서 갱신 시도 (실패해도 현재 토큰으로 계속 진행)
        authStore.refreshToken().catch((error: any) => {
          console.log('[App] 백그라운드 갱신 실패 (무시):', error.message);
        });
      }
    }

    // DEBUG: [JWT-2026-05-28] 세션 복원 로직 개선
    // 원인: getProfile 실패 시 세션 복원 실패
    // 해결: getProfile 실패 시에도 토큰이 있으면 기본 사용자 정보 반환
    try {
      const { authService } = await import('./src/services/api');
      const profileData = await authService.getProfile();
      console.log('[App] 세션 복원 성공:', profileData);

      if (profileData?.success && profileData?.data) {
        const userData = profileData.data;
        const user: User = {
          id: userData.id,
          email: userData.email ?? '',
          nickname: userData.nickname ?? '',
          username: userData.username ?? '',
          profileImage: userData.profileImage,
          role: userData.role,
          isAdmin: userData.isAdmin,
          trialExpired: userData.trialExpired,
          requiresPayment: userData.requiresPayment,
          canAccessApp: userData.canAccessApp,
        };
        return user;
      }
    } catch (profileError: any) {
      // DEBUG: [JWT-2026-05-28] getProfile 실패 시에도 토큰이 있으면 기본 사용자 정보 반환
      console.log('[App] getProfile 실패, 토큰으로 기본 사용자 정보 생성:', profileError.message);
      
      // 토큰이 있으면 기본 사용자 정보 반환 (API 서버 문제로 인한 실패 대응)
      if (token) {
        console.log('[App] 토큰 존재함 - 기본 사용자 정보로 세션 복원');
        return {
          id: 0, // 임시 ID
          email: '',
          nickname: '사용자',
          username: '',
          profileImage: undefined,
          role: 'free_user',
          isAdmin: false,
          trialExpired: false,
          requiresPayment: false,
          canAccessApp: true,
        };
      }
    }
    return null;
  } catch (error: any) {
    console.error('[App] 세션 복원 실패:', error.message || error);
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('tokenExpiryTime');
    return null;
  }
}

function AppNavigator() {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        // JWT 토큰으로 세션 복원
        const user = await restoreSessionFromJWT();
        if (user) {
          setUser(user);
          console.log('[App] 세션 복원 완료 - 사용자:', user.email);
        } else {
          console.log('[App] 세션 복원 안됨 - 비회원으로 시작');
        }
      } catch (error) {
        console.error('[App] 초기화 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();

    // DEBUG: [Supabase-OAuth-2026-05-28] Supabase onAuthStateChange 리스너
    // 원인: 웹에서 OAuth 후 auth-callback으로 리다이렉트되면 앱이 재시작되고
    //       Supabase가 URL hash에서 세션을 파싱해 SIGNED_IN 이벤트를 발화함
    // 해결: 이 이벤트를 감지해 백엔드 JWT 교환 후 authStore 업데이트
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[App] Supabase auth 상태 변경:', event, session?.user?.email ?? 'no user');

      // DEBUG: [Auth-Fix-2026-06-07] INITIAL_SESSION 이벤트 무시
      // 원인: INITIAL_SESSION에서 loginWithGoogle 호출 → 400 에러 (토큰 없음)
      // 해결: INITIAL_SESSION은 restoreSessionFromJWT가 처리하므로 무시
      if (event === 'INITIAL_SESSION') {
        console.log('[App] INITIAL_SESSION 무시 - restoreSessionFromJWT가 처리');
        return;
      }

      if (event === 'SIGNED_IN' && session?.access_token) {
        console.log('[App] SIGNED_IN 이벤트 감지 - 백엔드 JWT 교환 시작');
        try {
          setLoading(true);
          
          // DEBUG: [API-2026-05-28] 백엔드 연결 테스트
          // 원인: 백엔드 연결 실패 시 사용자에게 알림 필요
          // 해결: 연결 테스트 후 로그인 시도
          const { authService } = await import('./src/services/api');
          const isConnected = await authService.testConnection();
          
          if (!isConnected) {
            console.error('[App] 백엔드 연결 실패 - 로그인 중단');
            // 백엔드 연결 실패 시에도 Supabase 세션으로 로그인 처리
            const user = {
              id: session.user?.id ?? '0',
              email: session.user?.email ?? '',
              nickname: session.user?.user_metadata?.name ?? '사용자',
              username: session.user?.user_metadata?.name ?? '',
              profileImage: session.user?.user_metadata?.avatar_url,
              role: 'free_user',
              isAdmin: false,
              trialExpired: false,
              requiresPayment: false,
              canAccessApp: true,
            };
            setUser(user);
            console.log('[App] Supabase 세션으로 로그인 완료 (백엔드 연결 실패):', user.email);
            return;
          }
          
          const response = await authService.loginWithGoogle(session.access_token);
          console.log('[App] 백엔드 JWT 교환 완료:', response?.user?.email);

          if (response?.token && response?.user) {
            await AsyncStorage.setItem('authToken', response.token);
            const tokenExpiryTime = Date.now() + (12 * 60 * 60 * 1000);
            await AsyncStorage.setItem('tokenExpiryTime', tokenExpiryTime.toString());

            import('./src/types').then(({ }) => {
              const user = {
                id: response.user.id,
                email: response.user.email ?? '',
                nickname: response.user.nickname ?? '',
                username: response.user.username ?? '',
                profileImage: response.user.profileImage,
                role: response.user.role,
                isAdmin: response.user.isAdmin,
                trialExpired: response.user.trialExpired,
                requiresPayment: response.user.requiresPayment,
                canAccessApp: response.user.canAccessApp,
              };
              setUser(user);
              console.log('[App] Supabase OAuth 로그인 완료 - 사용자:', user.email);
            });
          }
        } catch (error: any) {
          console.error('[App] OAuth 후 백엔드 JWT 교환 실패:', error.message || error);
          // 백엔드 교환 실패 시에도 Supabase 세션으로 로그인 처리
          if (session?.user) {
            const user = {
              id: session.user.id ?? '0',
              email: session.user.email ?? '',
              nickname: session.user.user_metadata?.name ?? '사용자',
              username: session.user.user_metadata?.name ?? '',
              profileImage: session.user.user_metadata?.avatar_url,
              role: 'free_user',
              isAdmin: false,
              trialExpired: false,
              requiresPayment: false,
              canAccessApp: true,
            };
            setUser(user);
            console.log('[App] Supabase 세션으로 로그인 완료 (백엔드 교환 실패):', user.email);
          }
        } finally {
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[App] SIGNED_OUT 이벤트 감지 - 세션 초기화');
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('tokenExpiryTime');
        setUser(null);
      }
    });

    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9ff' }}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 16, color: '#8891b2', fontSize: 14 }}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator id="MainStack" screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="default" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
