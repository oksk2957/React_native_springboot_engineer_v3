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

// DEBUG: [수정45-2026-06-11] 오답 개수 → 색상 매핑 (50단위)
function getWrongAnswerColor(count: number): string {
  if (count <= 0) return 'transparent';
  if (count <= 50) return '#4a90e2';   // 파랑
  if (count <= 100) return '#4caf50';  // 초록
  if (count <= 150) return '#ffeb3b';  // 노랑
  if (count <= 200) return '#ff9800';  // 주황
  if (count <= 250) return '#f57c00';  // 진한 주황
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
  // DEBUG: [수정45-2026-06-11] 랭킹 top 50 한 번에 표시, 더보기 제거, 킹 섹션만 AJAX 로딩
  const [wrongAnswerRanking, setWrongAnswerRanking] = useState<WrongAnswerRankingItem[]>([]);
  const [isRankingLoading, setIsRankingLoading] = useState(true);

  const [rankingError, setRankingError] = useState<string | null>(null);
  const isDark = darkMode;

  // DEBUG: [AI-AUTHOR-2026-06-09] 오답 이력 달력 상태
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarData, setCalendarData] = useState<Array<{date: string, count: number}>>([]);

  // DEBUG: [수정45-2026-06-11] 오답 개수 → 색상 매핑 (6단계 히트맵, 50단위)
  const getHeatmapColor = (count: number): string => {
    if (count === 0) return '#e2e8f0';
    if (count <= 50) return '#4a90e2';
    if (count <= 100) return '#4caf50';
    if (count <= 150) return '#ffeb3b';
    if (count <= 200) return '#ff9800';
    if (count <= 250) return '#f57c00';
    return '#e53e3e';
  };

  // DEBUG: [수정45-2026-06-11] 랭킹 top 50 한 번에 fetch (페이징 제거)
  const fetchRanking = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setWrongAnswerRanking([]);
      setIsRankingLoading(false);
      setRankingError('로그인이 필요합니다.');
      return;
    }
    setIsRankingLoading(true);
    setRankingError(null);
    try {
      const data = await statisticsService.getWrongAnswerRanking(0, 50);
      setWrongAnswerRanking(data ?? []);
    } catch (error: any) {
      console.error('[WrongAnswerRanking] Failed to fetch:', error);
      setRankingError(error?.response?.data?.message ?? '랭킹을 불러오지 못했습니다.');
      setWrongAnswerRanking([]);
    } finally {
      setIsRankingLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // DEBUG: [수정48-2026-06-11] 오답 달력 데이터 조회 — 셀만 업데이트, 오버레이 제거
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



  useFocusEffect(
    useCallback(() => {
      fetchRanking();
    }, [fetchRanking])
  );

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            // DEBUG: [수정43-2026-06-11] 로그아웃 화면 전환 보장
            // 원인: logout() 내부 async 작업 중 예외 발생 시 isAuthenticated:false가 적용 안 될 수 있음
            // 해결: logout() 실패 시에도 authStore 상태를 직접 false로 설정
            await logout();
          } catch (error: any) {
            console.warn('[StatisticsScreen] logout 예외 (방어 설정):', error.message);
            // logout()이 부분 실패했더라도 화면 전환은 보장
            const { useAuthStore } = await import('../stores/authStore');
            useAuthStore.setState({ user: null, isAuthenticated: false });
          }
        },
      },
    ]);
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    await setDarkMode(enabled);
  };



  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <Text style={styles.title}>통계 / 마이페이지</Text>
          {user?.email ? (
            <Text style={styles.subHeader} numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
        </View>
        <View style={[styles.rankingSection, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
             랭킹
          </Text>
          <Text style={[styles.hint, isDark && styles.chartLabelDark]}>
            문제별 오답 수 (메달 TOP3, 4~50위 번호)
          </Text>
          {/* DEBUG: [수정45-2026-06-11] 랭킹 섹션만 AJAX 로딩 */}
          {isRankingLoading ? (
            <View style={styles.ajaxLoadingContainer}>
              <ActivityIndicator size="small" color="#4a90e2" />
              <Text style={[styles.ajaxLoadingText, isDark && styles.chartLabelDark]}>
                랭킹 불러오는 중...
              </Text>
            </View>
          ) : rankingError ? (
            <View style={styles.ajaxErrorContainer}>
              <Text style={[styles.ajaxErrorText, isDark && styles.chartLabelDark]}>
                {rankingError}
              </Text>
              <TouchableOpacity style={styles.ajaxRetryBtn} onPress={fetchRanking}>
                <Text style={styles.ajaxRetryBtnText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : wrongAnswerRanking.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDark && styles.chartLabelDark]}>
                오답 데이터가 없습니다
              </Text>
            </View>
          ) : wrongAnswerRanking.map((item, index) => {
                const rank = index + 1;
                const medal = MEDAL[rank];
                const typeLabel = item.itemType === 'OBJECTIVE' ? '객관식'
                  : item.itemType === 'SUBJECTIVE' ? '주관식' : '프로그래밍';
                return (
                  <TouchableOpacity
                    key={item.problemId}
                    style={[styles.rankingItem, isDark && styles.rankingItemDark, rank <= 3 && styles.rankingItemTop3]}
                    onPress={() => navigation.navigate('Problem', { problemId: item.referenceId, mode: 'normal' as const })}
                  >
                    <View style={styles.rankContainer}>{medal ? (<Text style={styles.medalText}>{medal}</Text>) : (<Text style={[styles.rankNumber, isDark && styles.chartLabelDark]}>{rank}</Text>)}</View><View style={{ flex: 1 }}><Text
                        style={[
                          styles.subjectName,
                          isDark && styles.titleDark,
                          rank <= 3 && styles.subjectNameBold,
                        ]}
                        numberOfLines={2}
                      >문제: {item.questionText || `#${item.problemId}`} 과목: {item.subject}</Text></View><Text style={[styles.attemptedCount, isDark && styles.titleDark]}>{item.wrongCount}회</Text>
                  </TouchableOpacity>
                );
              })
          }
        </View>
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
            이번 주 오답 최대값
          </Text>
          <View style={styles.weeklyDashboard}>
            {getWeekDates().map((date, index) => {
              const count = getCountForDate(date);
              const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <View key={index} style={styles.weeklyDay}><Text style={[styles.weeklyDayName, isDark && styles.textDark, isToday && styles.todayText]}>{dayNames[index]}</Text><Text style={[styles.weeklyDate, isDark && styles.textDark]}>{date.getDate()}</Text><View
                    style={[
                      styles.weeklyCountCircle,
                      { backgroundColor: count > 0 ? getHeatmapColor(count) : 'transparent' },
                      count > 0 && styles.weeklyCountCircleWithBg
                    ]}
                  ><Text
                      style={[
                        styles.weeklyCountText,
                        count > 0 ? styles.weeklyCountTextWhite : isDark && styles.textDark
                      ]}
                    >{count}</Text></View></View>
              );
            })}
          </View>
        </View>
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <View style={styles.calendarHeader}>
            {(() => {
              const MIN_YEAR = new Date().getFullYear();
              const MAX_YEAR = MIN_YEAR + 1;
              const isPrevDisabled = currentMonth.getFullYear() <= MIN_YEAR && currentMonth.getMonth() === 0;
              const isNextDisabled = currentMonth.getFullYear() >= MAX_YEAR && currentMonth.getMonth() === 11;
              return (<View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',flex:1}}><TouchableOpacity
                  disabled={isPrevDisabled}
                  onPress={() => {
                    const prev = new Date(currentMonth);
                    prev.setMonth(prev.getMonth() - 1);
                    setCurrentMonth(prev);
                  }}
                >
                  <Text style={[styles.calendarNavButton, isDark && styles.textDark, { opacity: isPrevDisabled ? 0.2 : 1 }]}>◀</Text>
                </TouchableOpacity><Text style={[styles.calendarTitle, isDark && styles.textDark]}>{currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월</Text><TouchableOpacity
                  disabled={isNextDisabled}
                  onPress={() => {
                    const next = new Date(currentMonth);
                    next.setMonth(next.getMonth() + 1);
                    setCurrentMonth(next);
                  }}
                >
                  <Text style={[styles.calendarNavButton, isDark && styles.textDark, { opacity: isNextDisabled ? 0.2 : 1 }]}>▶</Text>
                </TouchableOpacity></View>);
            })()}
          </View>
          <View style={styles.calendarGrid}>
            {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => (<Text key={idx} style={[styles.calendarDayHeader, isDark && styles.textDark]}>{day}</Text>))}
          </View>
          <View style={styles.calendarCellContainer}>
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
                  <View><Text
                      style={[
                        styles.calendarDateText,
                        count > 0 ? styles.calendarDateTextWhite : isDark && styles.textDark
                      ]}
                    >{date.getDate()}</Text></View>{count > 0 && (<View><Image
                        source={ATTENDANCE_STAMP}
                        style={styles.calendarAttendanceImage}
                        resizeMode="contain"
                      /></View>)}
                </View>
              );
            })}
          </View>
          <View style={styles.legendContainer}>
            <Text style={[styles.legendLabel, isDark && styles.textDark]}>적음</Text><View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#e2e8f0' }]} /><Text style={[styles.legendText, isDark && styles.textDark]}>0</Text></View><View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#4a90e2' }]} /><Text style={[styles.legendText, isDark && styles.textDark]}>1-50</Text></View><View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#4caf50' }]} /><Text style={[styles.legendText, isDark && styles.textDark]}>51-100</Text></View><View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#ffeb3b' }]} /><Text style={[styles.legendText, isDark && styles.textDark]}>101-150</Text></View><View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#ff9800' }]} /><Text style={[styles.legendText, isDark && styles.textDark]}>151-200</Text></View><View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#f57c00' }]} /><Text style={[styles.legendText, isDark && styles.textDark]}>201-250</Text></View><View style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: '#e53e3e' }]} /><Text style={[styles.legendText, isDark && styles.textDark]}>251+</Text></View><Text style={[styles.legendLabel, isDark && styles.textDark]}>많음</Text>
          </View>
        </View>
        <View style={[styles.settingsSection, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>설정</Text>
          <View style={styles.settingItem}><Text style={[styles.settingLabel, isDark && styles.settingLabelDark]}>다크 모드</Text><Switch value={darkMode} onValueChange={handleDarkModeToggle} /></View>
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
    padding: 5,
    backgroundColor: '#4a90e2',
  },
  //가운데패딩10
  subHeader: {
    marginTop: 0,
    fontSize: 13,
    marginLeft:10,
   
    color: 'rgba(255,255,255,0.9)',
  },
  title: {
         marginLeft: 10,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  
    color: '#2d3748',
    marginBottom: 0,
  },
  hint: {
    padding: 0,
    fontSize: 12,
    color: '#718096',
    marginBottom: 0,
  },
  //랭킹
  rankingSection: {
    padding: 10,
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
    textAlign: 'center',
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
  // DEBUG: [수정45-2026-06-11] 랭킹 섹션 AJAX 로딩/에러 스타일
  ajaxLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  ajaxLoadingText: {
    fontSize: 13,
    color: '#718096',
    marginTop: 8,
  },
  ajaxErrorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  ajaxErrorText: {
    fontSize: 13,
    color: '#e53e3e',
    marginBottom: 8,
  },
  ajaxRetryBtn: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  ajaxRetryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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
    borderColor: 'transparent', // DEBUG: [수정47-2026-06-11] TS 타입 오류 수정 — borderColor 필수
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
  titleDark: {
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
    height: 60,
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
  // DEBUG: [수정48-2026-06-11] 달력 셀 컨테이너 (AJAX 셀 업데이트)
  calendarCellContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
