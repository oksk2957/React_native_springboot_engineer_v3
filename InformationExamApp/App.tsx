import React, { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
 */
async function restoreSessionFromJWT(): Promise<User | null> {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.log('[App] 저장된 JWT 토큰 없음');
      return null;
    }

    console.log('[App] JWT 토큰으로 세션 복원 시도...');

    // authService.getProfile을 호출해서 사용자 정보를 가져옵니다.
    // 이 함수는 api.ts에서 이미 정의되어 있습니다.
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
    return null;
  } catch (error: any) {
    console.error('[App] 세션 복원 실패:', error.message || error);
    await AsyncStorage.removeItem('authToken');
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
