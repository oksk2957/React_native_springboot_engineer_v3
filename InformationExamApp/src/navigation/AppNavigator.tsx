import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Home, BookOpen, BarChart2, AlertCircle, User } from 'lucide-react-native';

import { AuthScreen } from '../screens/Auth/AuthScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import ProblemScreen from '../screens/ProblemScreen';
import TheoryScreen from '../screens/TheoryScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import WrongAnswerScreen from '../screens/WrongAnswerScreen';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTab = () => {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: '600',
        },
      }}
    >
      {/* 홈 */}
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: '홈',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }} 
      />
      {/* 학습 */}
      <Tab.Screen 
        name="Problem" 
        component={ProblemScreen} 
        options={{ 
          title: '학습',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />
        }} 
      />
      {/* 오답 */}
      <Tab.Screen 
        name="WrongAnswer" 
        component={WrongAnswerScreen} 
        options={{ 
          title: '오답',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }} 
      />
      {/* 이론 */}
      <Tab.Screen 
        name="Theory" 
        component={TheoryScreen} 
        options={{ 
          title: '이론',
          tabBarIcon: ({ color, size }) => <AlertCircle color={color} size={size} />
        }} 
      />
      {/* 통계 */}
      <Tab.Screen 
        name="Statistics" 
        component={StatisticsScreen} 
        options={{ 
          title: '통계',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />
        }} 
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, setUser } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        
        if (token) {
          setUser({
            id: 1,
            email: 'user@example.com',
            nickname: 'user',
          });
          console.log('Token found, logged in');
        }
      } catch (error) {
        console.log('Auth init error:', error);
      }
      setIsInitializing(false);
    };
    
    setTimeout(() => {
      initAuth();
    }, 100);
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator id="MainStack" screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTab} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;