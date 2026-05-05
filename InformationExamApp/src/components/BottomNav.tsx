import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';

const tabs = [
  { name: 'Home', label: '홈', icon: '🏠' },
  { name: 'Problem', label: '학습', icon: '📚' },
  { name: 'WrongAnswer', label: '오답', icon: '❌' },
  { name: 'Theory', label: '이론', icon: '📖' },
  { name: 'Statistics', label: '통계', icon: '📊' },
];

export default function BottomNav() {
  const navigation = useNavigation();
  const isDark = useAuthStore((state) => state.darkMode);
  const currentRoute = navigation.getState()?.routes?.slice(-1)[0]?.name || 'Home';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {tabs.map((tab) => {
        const isActive = currentRoute === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.name)}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                isDark && !isActive && styles.labelDark,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
  },
  containerDark: {
    backgroundColor: '#2d2d2d',
    borderTopColor: '#444',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  iconActive: {},
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  labelActive: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  labelDark: {
    color: '#aaa',
  },
});