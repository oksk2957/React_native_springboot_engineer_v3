import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { statisticsService } from '../services/api';

type RootStackParamList = {
  Statistics: undefined;
  Auth: undefined;
};

type StatisticsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Statistics'>;
};

export default function StatisticsScreen({ navigation }: StatisticsScreenProps) {
  const { logout, darkMode, setDarkMode } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const today = new Date().getDate();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const data = await statisticsService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 현재 월의 학습 기록 (30일 분량, 오늘까지 초록색)
  const studyRecord = Array.from({ length: 30 }, (_, i) => i + 1 <= today);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    await setDarkMode(enabled);
  };

  const isDark = darkMode;

  if (isLoading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>통계 / 마이페이지</Text>
      </View>

      <View style={[styles.chartSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>영역별 성적</Text>
        <View style={styles.radarChart}>
          {stats.categoryStats.map((stat: any, index: number) => (
            <View key={stat.category} style={styles.chartItem}>
              <Text style={[styles.chartLabel, isDark && styles.chartLabelDark]}>{stat.category}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { width: stat.total > 0 ? `${(stat.correct / stat.total) * 100}%` : '0%' },
                  ]}
                />
                <Text style={[styles.chartValue, isDark && styles.chartValueDark]}>
                  {stat.correct}/{stat.total}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.grassSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>학습 기록 (잔디)</Text>
        <View style={styles.grassGrid}>
          {studyRecord.map((done, index) => (
            <View
              key={index}
              style={[
                styles.grassBlock,
                done && styles.grassActive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={[styles.summarySection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>요약</Text>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>총 조회한 문제 수</Text>
          <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{stats.totalProblems}문제</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>맞은 문제</Text>
          <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{stats.correctCount}문제</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>정답률</Text>
          <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>
            {stats.solvedProblems > 0 ? Math.round((stats.correctCount / stats.solvedProblems) * 100) : 0}%
          </Text>
        </View>
      </View>

      <View style={[styles.settingsSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>설정</Text>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>다크 모드</Text>
          <Switch value={darkMode} onValueChange={handleDarkModeToggle} />
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f6',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a90e2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2d3748',
  },
  chartSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  radarChart: {
    // 레이더 차트 레이아웃 (，暂时 사용안함)
    marginTop: 16,
  },
  chartItem: {
    marginBottom: 12,
  },
  chartLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    height: 24,
  },
  bar: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 4,
  },
  chartValue: {
    position: 'absolute',
    right: 8,
    fontSize: 12,
    color: '#666',
  },
  grassSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  grassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  grassBlock: {
    width: 16,
    height: 16,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  grassLight: {
    backgroundColor: '#9ae6b4',
  },
  grassActive: {
    backgroundColor: '#48bb78',
  },
  grassDark: {
    backgroundColor: '#2f855a',
  },
  grassLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  grassLegendText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  summarySection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  settingsSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#2d3748',
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Dark mode styles
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  headerDark: {
    backgroundColor: '#2d2d2d',
  },
  titleDark: {
    color: '#fff',
  },
  sectionDark: {
    backgroundColor: '#2d2d2d',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  chartLabelDark: {
    color: '#aaa',
  },
  chartValueDark: {
    color: '#aaa',
  },
  summaryLabelDark: {
    color: '#aaa',
  },
  summaryValueDark: {
    color: '#fff',
  },
  settingLabelDark: {
    color: '#fff',
  },
});