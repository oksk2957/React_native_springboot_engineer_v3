import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';
import { statisticsService } from '../services/api';
import type { MainTabParamList } from '../navigation/AppNavigator';
import type { Statistics, StudyHeatmapCell, BranchPerformanceRow } from '../types';

type TabNav = BottomTabNavigationProp<MainTabParamList, 'Statistics'>;

const BRANCH_LABEL: Record<string, string> = {
  OBJECTIVE: '객관식',
  SUBJECTIVE: '주관식',
  PROGRAMMING_LANGUAGE: '프로그래밍',
};

function heatmapColor(level: number, isDark: boolean): string {
  if (level <= 0) {
    return isDark ? '#2d3748' : '#e2e8f0';
  }
  const colorsLight = ['', '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#553c9a'];
  const colorsDark = ['', '#9b2c2c', '#c05621', '#b7791f', '#276749', '#2c5282', '#553c9a', '#44337a'];
  const palette = isDark ? colorsDark : colorsLight;
  return palette[Math.min(level, palette.length - 1)] ?? palette[1];
}

export default function StatisticsScreen() {
  const navigation = useNavigation<TabNav>();
  const { user, logout, darkMode, setDarkMode, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setStats(null);
      setIsLoading(false);
      setErrorMessage('로그인이 필요합니다.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await statisticsService.getStatistics(user.id);
      setStats(data);
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
      setErrorMessage(error?.response?.data?.message ?? '통계를 불러오지 못했습니다.');
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    await setDarkMode(enabled);
  };

  const onHeatmapCellPress = (cell: StudyHeatmapCell) => {
    if (cell.count <= 0) {
      return;
    }
    navigation.navigate('Wrong', { bookmarkDate: cell.date });
  };

  const isDark = darkMode;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (errorMessage || !stats) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.titleDark]}>{errorMessage ?? '데이터 없음'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchStatistics}>
          <Text style={styles.retryBtnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const performance: BranchPerformanceRow[] =
    stats.branchPerformance && stats.branchPerformance.length > 0
      ? stats.branchPerformance
      : (stats.categoryStats ?? []).map((c) => ({
          branch: c.category,
          attempted: c.total,
          wrong: c.total - c.correct,
          numerator: c.correct,
          poolTotal: Math.max(c.total, 1),
          achievementRate: c.accuracyRate ?? 0,
        }));

  const heatmap = stats.studyHeatmap ?? [];
  const accuracy =
    stats.accuracyRate ??
    (stats.solvedProblems > 0
      ? Math.round((stats.correctCount / stats.solvedProblems) * 1000) / 10
      : 0);

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>통계 / 마이페이지</Text>
        {user?.email ? (
          <Text style={[styles.subHeader, isDark && styles.subtitleDark]} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}
      </View>

      <View style={[styles.chartSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>영역별 성취도 (user_statistics)</Text>
        <Text style={[styles.hint, isDark && styles.chartLabelDark]}>
          (푼 수 − 오답 수) / DB 해당 유형 총 문제 수
        </Text>
        {performance.map((row) => (
          <View key={String(row.branch)} style={styles.chartItem}>
            <Text style={[styles.chartLabel, isDark && styles.chartLabelDark]}>
              {BRANCH_LABEL[String(row.branch)] ?? row.branch}
            </Text>
            <View style={[styles.barTrack, isDark && styles.barTrackDark]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(100, Math.max(0, row.achievementRate))}%` },
                ]}
              />
            </View>
            <Text style={[styles.chartMeta, isDark && styles.chartValueDark]}>
              {Math.round(row.achievementRate * 10) / 10}% · 시도 {row.attempted} / 풀 {row.numerator} / 오답{' '}
              {row.wrong} / 전체 {row.poolTotal}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.grassSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>오답 잔디 (최근 100일)</Text>
        <Text style={[styles.hint, isDark && styles.chartLabelDark]}>색: 해당일 오답 수 · 탭 시 해당일 오답 리스트</Text>
        <View style={styles.grassGrid}>
          {heatmap.map((cell) => (
            <TouchableOpacity
              key={cell.date}
              activeOpacity={cell.count > 0 ? 0.7 : 1}
              onPress={() => onHeatmapCellPress(cell)}
              style={[
                styles.grassBlock,
                { backgroundColor: heatmapColor(cell.level, isDark) },
                cell.count <= 0 && styles.grassEmptyBorder,
              ]}
              accessibilityLabel={`${cell.date} ${cell.count}문제`}
            />
          ))}
        </View>
        <View style={styles.legendRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((lv) => (
            <View key={lv} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: heatmapColor(lv, isDark) }]} />
              <Text style={[styles.legendTxt, isDark && styles.chartLabelDark]}>
                {lv === 1 ? '1–5' : lv === 2 ? '6–10' : lv === 3 ? '11–15' : lv === 4 ? '16–20' : lv === 5 ? '21–25' : lv === 6 ? '26–30' : '31+'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.summarySection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>요약 (get_user_statistics)</Text>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>총 조회한 문제 수 (DB 전체)</Text>
          <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{stats.totalProblems}문제</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>맞은 문제 수</Text>
          <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{stats.correctCount}문제</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>오답 문제 수</Text>
          <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{stats.wrongCount}문제</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, isDark && styles.summaryLabelDark]}>정답률 (맞음 / 총 풀이)</Text>
          <Text style={[styles.summaryValue, isDark && styles.summaryValueDark]}>{accuracy}%</Text>
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
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a90e2',
  },
  subHeader: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2d3748',
  },
  hint: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
  },
  chartSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  chartItem: {
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  barTrack: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barTrackDark: {
    backgroundColor: '#4a5568',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 6,
  },
  chartMeta: {
    marginTop: 4,
    fontSize: 11,
    color: '#718096',
  },
  grassSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  grassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
    maxWidth: 360,
    alignSelf: 'center',
  },
  grassBlock: {
    width: 14,
    height: 14,
    borderRadius: 2,
    margin: 2,
  },
  grassEmptyBorder: {
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  legendTxt: {
    fontSize: 10,
    color: '#666',
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
    flex: 1,
    paddingRight: 8,
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
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  headerDark: {
    backgroundColor: '#2d2d2d',
  },
  titleDark: {
    color: '#fff',
  },
  subtitleDark: {
    color: '#aaa',
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
