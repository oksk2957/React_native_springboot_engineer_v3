import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
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
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a90e2" />
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