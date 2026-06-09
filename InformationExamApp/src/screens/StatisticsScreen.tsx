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
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';
import { statisticsService } from '../services/api';
import type { MainTabParamList } from '../navigation/AppNavigator';

// DEBUG: [AI-AUTHOR-2026-06-09-출석이미지] 달력에 표시할 출석 스탬프 이미지
const ATTENDANCE_STAMP = require('../../assets/출석_이미지.png');

type TabNav = BottomTabNavigationProp<MainTabParamList, 'Statistics'>;

// DEBUG: [AI-AUTHOR-2026-06-09-수정계획안11] 문제별 오답 랭킹 타입 (사용자가 가장 많이 틀린 문제 순위)
interface WrongAnswerRankingItem {
  problemId: number;
  itemType: string;      // OBJECTIVE, SUBJECTIVE, PROGRAMMING_LANGUAGE
  referenceId: number;
  subject: string;
  questionText: string;
  wrongCount: number;
}

// DEBUG: [AI-AUTHOR-2026-06-09] 오답 달력 타입
interface CalendarDayData {
  date: string; // "2026-06-09"
  count: number;
}

// DEBUG: [AI-AUTHOR-2026-06-09] 오답 개수 → 색상 매핑
function getWrongAnswerColor(count: number): string {
  if (count <= 0) return 'transparent';
  if (count <= 5) return '#4a90e2';   // 파랑
  if (count <= 10) return '#4caf50';  // 초록
  if (count <= 15) return '#ffeb3b';  // 노랑
  if (count <= 20) return '#ff9800';  // 주황
  if (count <= 25) return '#f57c00';  // 진한 주황
  return '#e53e3e';                    // 빨강
}

const MEDAL: Record<number, string> = {
  1: '\u{1F3C6}', // 🏆
  2: '\u{1F948}', // 🥈
  3: '\u{1F949}', // 🥉
};

export default function StatisticsScreen() {
  const navigation = useNavigation<TabNav>();
  const { user, logout, darkMode, setDarkMode, isAuthenticated } = useAuthStore();
  const [wrongAnswerRanking, setWrongAnswerRanking] = useState<WrongAnswerRankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 30;
  const isDark = darkMode;

  // DEBUG: [AI-AUTHOR-2026-06-09] 오답 이력 달력 상태
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarData, setCalendarData] = useState<Array<{date: string, count: number}>>([]);

  // DEBUG: [AI-AUTHOR-2026-06-09] 오답 개수 → 색상 매핑 (6단계 히트맵)
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return '#e2e8f0';
    if (count <= 5) return '#4a90e2';
    if (count <= 10) return '#4caf50';
    if (count <= 15) return '#ffeb3b';
    if (count <= 20) return '#ff9800';
    if (count <= 25) return '#f57c00';
    return '#e53e3e';
  };

  const fetchRanking = useCallback(async (reset: boolean = true) => {
    if (!isAuthenticated || !user?.id) {
      setWrongAnswerRanking([]);
      setIsLoading(false);
      setErrorMessage('로그인이 필요합니다.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // DEBUG: [AI-AUTHOR-2026-06-09-수정계획안08] 오답 카운트 랭킹 조회 (페이징)
      const startOffset = reset ? 0 : offset;
      const data = await statisticsService.getWrongAnswerRanking(startOffset, PAGE_SIZE);
      if (reset) {
        setWrongAnswerRanking(data ?? []);
        setOffset(data.length);
      } else {
        setWrongAnswerRanking(prev => [...prev, ...(data ?? [])]);
        setOffset(prev => prev + data.length);
      }
      setHasMore(data.length >= PAGE_SIZE);
    } catch (error: any) {
      console.error('[WrongAnswerRanking] Failed to fetch:', error);
      setErrorMessage(error?.response?.data?.message ?? '랭킹을 불러오지 못했습니다.');
      setWrongAnswerRanking([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [isAuthenticated, user?.id, offset]);

  // DEBUG: [AI-AUTHOR-2026-06-09] 오답 달력 데이터 조회 (월별)
  const fetchCalendar = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setCalendarData([]);
      return;
    }
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const data = await statisticsService.getWrongAnswerCalendar(year, month);
      setCalendarData(data ?? []);
    } catch (error: any) {
      console.error('[Calendar] Failed to fetch:', error);
      setCalendarData([]);
    }
  }, [isAuthenticated, user?.id, currentMonth]);

  useEffect(() => {
    fetchRanking();
    fetchCalendar();
  }, [fetchRanking, fetchCalendar]);

  useFocusEffect(
    useCallback(() => {
      fetchRanking();
      fetchCalendar();
    }, [fetchRanking, fetchCalendar])
  );

  // DEBUG: [AI-AUTHOR-2026-06-09] 이번 주 월~일 날짜 계산
  const getWeekDates = (): Date[] => {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  // DEBUG: [AI-AUTHOR-2026-06-09] 특정 날짜의 오답 개수 조회
  const getCountForDate = (date: Date): number => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const found = calendarData.find(item => item.date === dateStr);
    return found?.count ?? 0;
  };

  // DEBUG: [AI-AUTHOR-2026-06-09] 달력 그리드 생성 (월요일 시작)
  const generateCalendarDays = (): (Date | null)[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let firstDow = firstDay.getDay();
    firstDow = firstDow === 0 ? 6 : firstDow - 1; // Mon=0
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDow; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      fetchRanking(false);
    }
  };

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
        <Text style={[styles.errorText, isDark && styles.chartLabelDark]}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchRanking}>
          <Text style={styles.retryBtnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View> {/* DEBUG: [2026-06-09] ScrollView 직계 자식 key 경고 해결 */}
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <Text style={styles.title}>통계 / 마이페이지</Text>
          {user?.email ? (
            <Text style={styles.subHeader} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
        </View>



        {/* Wrong Answer Ranking */}
        <View style={[styles.rankingSection, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
             랭킹
          </Text>
          <Text style={[styles.hint, isDark && styles.chartLabelDark]}>
            문제별 오답 수 (메달 TOP3, 4~30위 번호, 31위+ 게시판)
          </Text>

          {wrongAnswerRanking.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDark && styles.chartLabelDark]}>
                오답 데이터가 없습니다
              </Text>
            </View>
          ) : (
            <>
              {wrongAnswerRanking.map((item, index) => {
                const rank = index + 1;
                const medal = MEDAL[rank];
                const typeLabel = item.itemType === 'OBJECTIVE' ? '객관식'
                  : item.itemType === 'SUBJECTIVE' ? '주관식' : '프로그래밍';
                return (
                  <TouchableOpacity
                    key={item.problemId}
                    style={[styles.rankingItem, isDark && styles.rankingItemDark, rank <= 3 && styles.rankingItemTop3]}
                    onPress={() => navigation.navigate('Problem', { problemId: item.referenceId, mode: 'normal' })}
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
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.subjectName,
                          isDark && styles.titleDark,
                          rank <= 3 && styles.subjectNameBold,
                        ]}
                        numberOfLines={2}
                      >
                        {/* DEBUG: [2026-06-09] 문제: {substring} 과목: {subject} 형식으로 변경 */}
                        문제: {item.questionText || `#${item.problemId}`} 과목: {item.subject}
                      </Text>
                    </View>
                    <Text style={[styles.attemptedCount, isDark && styles.titleDark]}>
                      {item.wrongCount}회
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {hasMore && (
                <TouchableOpacity
                  style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonDisabled]}
                  onPress={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.loadMoreText}>더보기 (다음 30건)</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>







        {/* DEBUG: [AI-AUTHOR-2026-06-09] 이번 주 오답 대시보드 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            이번 주 오답
          </Text>
          <View style={styles.weeklyDashboard}>
            {getWeekDates().map((date, index) => {
              const count = getCountForDate(date);
              const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <View key={index} style={styles.weeklyDay}>
                  <Text style={[styles.weeklyDayName, isDark && styles.textDark, isToday && styles.todayText]}>
                    {dayNames[index]}
                  </Text>
                  <Text style={[styles.weeklyDate, isDark && styles.textDark]}>
                    {date.getDate()}
                  </Text>
                  <View
                    style={[
                      styles.weeklyCountCircle,
                      { backgroundColor: count > 0 ? getHeatmapColor(count) : 'transparent' },
                      count > 0 && styles.weeklyCountCircleWithBg
                    ]}
                  >
                    <Text
                      style={[
                        styles.weeklyCountText,
                        count > 0 ? styles.weeklyCountTextWhite : isDark && styles.textDark
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* DEBUG: [AI-AUTHOR-2026-06-09] 오답 이력 달력 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => {
                const prev = new Date(currentMonth);
                prev.setMonth(prev.getMonth() - 1);
                setCurrentMonth(prev);
              }}
            >
              <Text style={[styles.calendarNavButton, isDark && styles.textDark]}>◀</Text>
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, isDark && styles.textDark]}>
              {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
            </Text>
            <TouchableOpacity
              onPress={() => {
                const next = new Date(currentMonth);
                next.setMonth(next.getMonth() + 1);
                setCurrentMonth(next);
              }}
            >
              <Text style={[styles.calendarNavButton, isDark && styles.textDark]}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.calendarGrid}>
            {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => (
              <Text key={idx} style={[styles.calendarDayHeader, isDark && styles.textDark]}>
                {day}
              </Text>
            ))}

            {/* 달력 날짜 셀 */}
            {generateCalendarDays().map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.calendarCell} />;
              }
              const count = getCountForDate(date);
              const color = count > 0 ? getHeatmapColor(count) : 'transparent';
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <View
                  key={date.toISOString()}
                  style={[
                    styles.calendarCell,
                    { backgroundColor: color },
                    isToday && styles.calendarCellToday
                  ]}
                >
                  {/* DEBUG: [AI-AUTHOR-2026-06-09-출석이미지] 날짜 + 출석이미지 + 카운트 */}
                  {/* DEBUG: [2026-06-09-fix] RN Web에서 Image-Text 형제 금지 → 각 Text를 View로 래핑 */}
                  <View>
                    <Text
                      style={[
                        styles.calendarDateText,
                        count > 0 ? styles.calendarDateTextWhite : isDark && styles.textDark
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </View>
                  {count > 0 && (
                    <View>
                      <Image
                        source={ATTENDANCE_STAMP}
                        style={styles.calendarAttendanceImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
                  {count > 0 && (
                    <View>
                      <Text style={styles.calendarCountText}>{count}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* 범례 */}
          <View style={styles.legendContainer}>
            <Text style={[styles.legendLabel, isDark && styles.textDark]}>적음</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e2e8f0' }]} />
              <Text style={[styles.legendText, isDark && styles.textDark]}>0</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4a90e2' }]} />
              <Text style={[styles.legendText, isDark && styles.textDark]}>1-5</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4caf50' }]} />
              <Text style={[styles.legendText, isDark && styles.textDark]}>6-10</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ffeb3b' }]} />
              <Text style={[styles.legendText, isDark && styles.textDark]}>11-15</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#ff9800' }]} />
              <Text style={[styles.legendText, isDark && styles.textDark]}>16-20</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#f57c00' }]} />
              <Text style={[styles.legendText, isDark && styles.textDark]}>21-25</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e53e3e' }]} />
              <Text style={[styles.legendText, isDark && styles.textDark]}>26+</Text>
            </View>
            <Text style={[styles.legendLabel, isDark && styles.textDark]}>많음</Text>
          </View>
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
      </View>
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
  typeLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
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
  loadMoreButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // DEBUG: [AI-AUTHOR-2026-06-09] 오답 이력 달력 스타일
  calendarSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarNavBtn: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a90e2',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  weekendText: {
    color: '#e53e3e',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    overflow: 'visible',
    paddingVertical: 4,
  },
  calendarDayText: {
    fontSize: 12,
    color: '#2d3748',
  },
  calendarDayTextWithCount: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarCountText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  legendItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#2d3748',
    fontWeight: '600',
  },
  legendTextDark: {
    color: '#2d3748',
  },
  weekDashboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDashboardItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  weekDashboardToday: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  weekDayLabel: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  weekDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  weekCountBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  weekCountTextDark: {
    color: '#2d3748',
  },
  // DEBUG: [AI-AUTHOR-2026-06-09] 주간 대시보드 스타일
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  weeklyDashboard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  weeklyDay: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyDayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  weeklyDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 8,
  },
  weeklyCountCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weeklyCountCircleWithBg: {
    borderWidth: 0,
  },
  weeklyCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  weeklyCountTextWhite: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  textDark: {
    color: '#fff',
  },
  // DEBUG: [AI-AUTHOR-2026-06-09] 달력 스타일
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    fontSize: 20,
    color: '#4a90e2',
    paddingHorizontal: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 8,
  },
  calendarCell: {
    width: '14.28%',
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 6,
    overflow: 'visible',
    paddingVertical: 4,
  },
  calendarCellToday: {
    borderWidth: 2,
    borderColor: '#4a90e2',
  },
  calendarDateText: {
    fontSize: 12,
    color: '#2d3748',
  },
  calendarDateTextWhite: {
    color: '#fff',
    fontWeight: '600',
  },
  calendarCountText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  // DEBUG: [AI-AUTHOR-2026-06-09-출석이미지] 출석 탬프 이미지 스타일 (크게)
  calendarAttendanceImage: {
    width: 28,
    height: 28,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
  },
  legendLabel: {
    fontSize: 12,
    color: '#718096',
    marginHorizontal: 8,
  },
});
