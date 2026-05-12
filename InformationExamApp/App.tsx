import React, { useEffect, useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProblemScreen from './src/screens/ProblemScreen';
import WrongAnswerScreen from './src/screens/WrongAnswerScreen';
import TheoryScreen from './src/screens/TheoryScreen';
import ProgrammingScreen from './src/screens/ProgrammingScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import { useAuthStore } from './src/stores/authStore';
import { supabase } from './src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Problem: '📚',
    Wrong: '❌',
    Programming: '💻',
    Theory: '📖',
    Stats: '📊',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: focused ? 20 : 16, opacity: focused ? 1 : 0.5 }}>{icons[name] || '•'}</Text>
    </View>
  );
}

// 상단 탭바 (사용자 UX 개선을 위해 안드로이드 물리버튼 간섭을 피해 최상단으로 이동)
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
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '홈' }}
        />
        <Tab.Screen
          name="Problem"
          component={ProblemScreen}
          options={{ title: '학습' }}
        />
        <Tab.Screen
          name="Wrong"
          component={WrongAnswerScreen}
          options={{ title: '오답' }}
        />
        <Tab.Screen
          name="Programming"
          component={ProgrammingScreen}
          options={{ title: '언어' }}
        />
        <Tab.Screen
          name="Theory"
          component={TheoryScreen}
          options={{ title: '이론' }}
        />
        <Tab.Screen
          name="Stats"
          component={StatisticsScreen}
          options={{ title: '통계' }}
        />
      </Tab.Navigator>
    </View>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();

  // ✅ 앱 최초 실행 시 기존 Supabase 세션 복원 (새로고침 시 자동 로그아웃 방지)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[App] 세션 복원 오류:', error.message);
          return;
        }
        if (session?.user) {
          console.log('[App] 기존 세션 복원 성공:', session.user.email);
          // authToken이 AsyncStorage에 있으면 백엔드 동기화 완료 상태
          const savedToken = await AsyncStorage.getItem('authToken');
          if (savedToken) {
            setUser({
              id: session.user.id as any,
              email: session.user.email ?? '',
              nickname: session.user.user_metadata?.full_name ?? '사용자',
            });
          } else {
            // 토큰 없으면 AuthScreen의 onAuthStateChange에서 재동기화 처리
            console.log('[App] authToken 없음 - AuthScreen에서 백엔드 동기화 예정');
          }
        } else {
          console.log('[App] 저장된 세션 없음 → 로그인 화면 표시');
        }
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
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