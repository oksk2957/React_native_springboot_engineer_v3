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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';
import { statisticsService } from '../services/api';
import type { MainTabParamList } from '../navigation/AppNavigator';

type TabNav = BottomTabNavigationProp<MainTabParamList, 'Statistics'>;

// DEBUG: [2026-06-07] 과목별 랭킹 타입
interface SubjectRankingItem {
  subjectId: number;
  subjectName: string;
  attemptedCount: number;
}

const MEDAL: Record<number, string> = {
  1: '\u{1F3C6}', // 🏆
  2: '\u{1F948}', // 🥈
  3: '\u{1F949}', // 🥉
};

export default function StatisticsScreen() {
  const navigation = useNavigation<TabNav>();
  const { user, logout, darkMode, setDarkMode, isAuthenticated } = useAuthStore();
  const [ranking, setRanking] = useState<SubjectRankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isDark = darkMode;

  const fetchRanking = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setRanking([]);
      setIsLoading(false);
      setErrorMessage('로그인이 필요합니다.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // DEBUG: [2026-06-07] 과목별 시도 횟수 랭킹 조회
      const data = await statisticsService.getSubjectRanking();
      setRanking(data ?? []);
    } catch (error: any) {
      console.error('Failed to fetch subject ranking:', error);
      setErrorMessage(error?.response?.data?.message ?? '랭킹을 불러오지 못했습니다.');
      setRanking([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  useFocusEffect(
    useCallback(() => {
      fetchRanking();
    }, [fetchRanking])
  );

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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.titleDark]}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRanking}>
          <Text style={styles.retryBtnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={styles.title}>통계 / 마이페이지</Text>
        {user?.email ? (
          <Text style={styles.subHeader} numberOfLines={1}>
            {user.email}
          </Text>
        ) : null}
      </View>

      {/* Subject Ranking List */}
      <View style={[styles.rankingSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          과목별 시도 횟수 랭킹
        </Text>
        <Text style={[styles.hint, isDark && styles.chartLabelDark]}>
          study_session_item 기반 TOP 100 (원본 숫자)
        </Text>

        {ranking.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDark && styles.chartLabelDark]}>
              푼 문제가 없습니다
            </Text>
          </View>
        ) : (
          ranking.map((item, index) => {
            const rank = index + 1;
            const medal = MEDAL[rank];
            return (
              <View
                key={item.subjectId}
                style={[styles.rankingItem, isDark && styles.rankingItemDark, rank <= 3 && styles.rankingItemTop3]}
              >
                <View style={styles.rankContainer}>
                  {medal ? (
                    <Text style={styles.medalText}>{medal}</Text>
                  ) : (
                    <Text style={[styles.rankNumber, isDark && styles.chartLabelDark]}>
                      {rank}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.subjectName,
                    isDark && styles.titleDark,
                    rank <= 3 && styles.subjectNameBold,
                  ]}
                  numberOfLines={1}
                >
                  {item.subjectName}
                </Text>
                <Text style={[styles.attemptedCount, isDark && styles.titleDark]}>
                  {item.attemptedCount}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Settings */}
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
    color: '#2d3748',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 12,
  },
  rankingSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  rankingItemDark: {
    borderBottomColor: '#4a5568',
  },
  rankingItemTop3: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
  },
  medalText: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  subjectName: {
    flex: 1,
    fontSize: 14,
    color: '#2d3748',
    marginHorizontal: 12,
  },
  subjectNameBold: {
    fontWeight: '600',
  },
  attemptedCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    minWidth: 60,
    textAlign: 'right',
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
  sectionDark: {
    backgroundColor: '#2d2d2d',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  chartLabelDark: {
    color: '#aaa',
  },
  settingLabelDark: {
    color: '#fff',
  },
});
