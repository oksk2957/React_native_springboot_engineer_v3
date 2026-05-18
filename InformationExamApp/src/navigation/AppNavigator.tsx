import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Home, BookOpen, BarChart2, AlertCircle, User } from 'lucide-react-native';

import { AuthScreen } from '../screens/Auth/AuthScreen';
import { HomeScreen } from '../screens/Home/HomeScreen';
import ProblemScreen from '../screens/ProblemScreen';
import TheoryScreen from '../screens/TheoryScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import WrongAnswerScreen from '../screens/WrongAnswerScreen';
import ProgrammingScreen from '../screens/ProgrammingScreen';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme';

export type MainTabParamList = {
  Home: undefined;
  Problem: { problemId?: number; mode?: 'normal' | 'random' | 'subjective' | 'multiple' } | undefined;
  Wrong: { bookmarkDate?: string } | undefined;
  Theory: { problemId?: number; category?: string } | undefined;
  Programming: { problemId?: number; language?: string } | undefined;
  Statistics: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Problem"
        component={ProblemScreen}
        options={{
          title: '학습',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Wrong"
        component={WrongAnswerScreen}
        options={{
          title: '오답',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Theory"
        component={TheoryScreen}
        options={{
          title: '이론',
          tabBarIcon: ({ color, size }) => <AlertCircle color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Programming"
        component={ProgrammingScreen}
        options={{
          title: '코드',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          title: '통계',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();

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
