import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/authStore';
import type { WrongAnswer, ProblemType, StudyHeatmapCell, CalendarDayCell } from '../types';
import { statisticsService } from '../services/api';
import type { MainTabParamList } from '../navigation/AppNavigator';

type WrongAnswerRoute = RouteProp<MainTabParamList, 'Wrong'>;
type WrongTabNav = BottomTabNavigationProp<MainTabParamList, 'Wrong'>;
type MiniTab = 'list' | 'calendar';

type CalendarMonth = {
  year: number;
  month: number;
};

const problemTypes: { id: ProblemType | 'all'; name: string }[] = [
  { id: 'all', name: '전체' },
  { id: 'OBJECTIVE', name: '객관식' },
  { id: 'SUBJECTIVE', name: '주관식' },
  { id: 'PROGRAMMING_LANGUAGE', name: '프로그래밍' },
];

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function heatmapLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 5) return 1;
  if (count <= 10) return 2;
  if (count <= 15) return 3;
  if (count <= 20) return 4;
  if (count <= 25) return 5;
  if (count <= 30) return 6;
  return 7;
}

function heatmapColor(countOrLevel: number, isDark: boolean, isLevel = false): string {
  const level = isLevel ? countOrLevel : heatmapLevel(countOrLevel);
  if (level <= 0) return isDark ? '#2d3748' : '#edf2f7';
  const colorsLight = ['', '#e53e3e', '#dd6b20', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#6b46c1'];
  const colorsDark = ['', '#9b2c2c', '#c05621', '#b7791f', '#276749', '#2c5282', '#553c9a', '#44337a'];
  const palette = isDark ? colorsDark : colorsLight;
  return palette[Math.min(level, palette.length - 1)] ?? palette[1];
}

function buildCalendarDays(month: CalendarMonth, heatmapByDate: Record<string, StudyHeatmapCell>): CalendarDayCell[] {
  const first = new Date(month.year, month.month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const gridStart = new Date(month.year, month.month, 1 - mondayOffset);
  const days: CalendarDayCell[] = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const key = toDateKey(date);
    const row = heatmapByDate[key];
    days.push({
      date: key,
      day: date.getDate(),
      count: row?.count ?? 0,
      level: row?.level ?? heatmapLevel(row?.count ?? 0),
      isCurrentMonth: date.getMonth() === month.month,
    });
  }

  return days;
}

function buildCurrentWeek(heatmapByDate: Record<string, StudyHeatmapCell>): CalendarDayCell[] {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  return WEEK_LABELS.map((_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = toDateKey(date);
    const row = heatmapByDate[key];
    return {
      date: key,
      day: date.getDate(),
      count: row?.count ?? 0,
      level: row?.level ?? heatmapLevel(row?.count ?? 0),
      isCurrentMonth: true,
    };
  });
}

export default function WrongAnswerScreen() {
  const route = useRoute<WrongAnswerRoute>();
  const navigation = useNavigation<WrongTabNav>();
  const { darkMode, isAuthenticated, user } = useAuthStore();
  const bookmarkDate = route.params?.bookmarkDate;

  const today = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<MiniTab>(bookmarkDate ? 'list' : 'calendar');
  const [selectedType, setSelectedType] = useState<ProblemType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(bookmarkDate);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>({ year: today.getFullYear(), month: today.getMonth() });
  const [wrongProblems, setWrongProblems] = useState<WrongAnswer[]>([]);
  const [heatmap, setHeatmap] = useState<StudyHeatmapCell[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = darkMode;

  const fetchWrongAnswers = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setWrongProblems([]);
      setHeatmap([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const stats = await statisticsService.getStatistics(user.id);
      setHeatmap(stats.studyHeatmap ?? []);

      const targetDate = bookmarkDate ?? selectedDate;
      let data: WrongAnswer[];
      if (targetDate) {
        data = await statisticsService.getWrongAnswersByDate(targetDate);
      } else if (selectedType === 'all') {
        data = await statisticsService.getWrongAnswers();
      } else {
        data = await statisticsService.getWrongAnswersByType(selectedType);
      }

      if (targetDate && selectedType !== 'all') {
        data = data.filter((w) => w.problemType === selectedType);
      }
      setWrongProblems(data);
    } catch (error: any) {
      console.error('Failed to fetch wrong answers:', error);
      // DEBUG: [2026-06-07] 401 감지 시 세션 만료 Alert + 빈 화면 초기화
      if (error.response?.status === 401) {
        Alert.alert('세션 만료', '다시 로그인해주세요.', [{ text: '확인' }]);
      }
      setWrongProblems([]);
      setHeatmap([]);
    } finally {
      setIsLoading(false);
    }
  }, [bookmarkDate, selectedDate, selectedType, isAuthenticated, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchWrongAnswers();
    }, [fetchWrongAnswers])
  );

  const heatmapByDate = useMemo(
    () => Object.fromEntries(heatmap.map((cell) => [cell.date, cell])),
    [heatmap]
  );
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth, heatmapByDate), [calendarMonth, heatmapByDate]);
  const currentWeek = useMemo(() => buildCurrentWeek(heatmapByDate), [heatmapByDate]);

  const activeDate = bookmarkDate ?? selectedDate;

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    navigation.setParams({ bookmarkDate: undefined });
  };

  const handleDayPress = (cell: StudyHeatmapCell) => {
    if (cell.count <= 0) {
      return;
    }
    setSelectedDate(cell.date);
    navigation.setParams({ bookmarkDate: cell.date });
    setActiveTab('list');
  };

  const changeMonth = (delta: number) => {
    setCalendarMonth((prev) => {
      const next = new Date(prev.year, prev.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  const handleRetry = (wrongAnswer: WrongAnswer) => {
    const problemId = Number(wrongAnswer.referenceId);

    console.log(
      `[WrongAnswerScreen] retry navigation - problemType: ${wrongAnswer.problemType}, referenceId: ${wrongAnswer.referenceId}, parsedProblemId: ${problemId}`
    );

    if (Number.isNaN(problemId)) {
      console.log('[WrongAnswerScreen] retry navigation aborted - invalid problemId');
      return;
    }

    const targetTab =
      wrongAnswer.problemType === 'OBJECTIVE'
        ? 'Problem'
        : wrongAnswer.problemType === 'SUBJECTIVE'
          ? 'Theory'
          : 'Programming';

    console.log(`[WrongAnswerScreen] navigating to ${targetTab} for problemId: ${problemId}`);
    console.log(`[WrongAnswerScreen] navigation payload ready - targetTab: ${targetTab}, problemId: ${problemId}`);

    switch (wrongAnswer.problemType) {
      case 'OBJECTIVE':
        navigation.navigate('Problem', { problemId, mode: 'normal' } as never);
        break;
      case 'SUBJECTIVE':
        navigation.navigate('Theory', { problemId } as never);
        break;
      case 'PROGRAMMING_LANGUAGE':
        navigation.navigate('Programming', { problemId } as never);
        break;
      default:
        navigation.navigate('Problem', { problemId } as never);
        break;
    }
  };

  const getTypeLabel = (type: ProblemType): string => {
    switch (type) {
      case 'OBJECTIVE':
        return '객관식';
      case 'SUBJECTIVE':
        return '주관식';
      case 'PROGRAMMING_LANGUAGE':
        return '프로그래밍';
      default:
        return type;
    }
  };

  const renderCalendar = () => (
    <ScrollView contentContainerStyle={styles.calendarContent}>
      <View style={[styles.weekCard, isDark && styles.problemCardDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.problemQuestionDark]}>이번 주 오답 대시보드</Text>
        <View style={styles.weekRow}>
          {currentWeek.map((cell, index) => (
            <TouchableOpacity key={cell.date} style={styles.weekDay} onPress={() => handleDayPress(cell)} activeOpacity={cell.count > 0 ? 0.7 : 1}>
              <Text style={[styles.weekLabel, isDark && styles.answerLabelDark]}>{WEEK_LABELS[index]}</Text>
              <View style={[styles.weekCircle, { backgroundColor: heatmapColor(cell.count, isDark) }]}>
                <Text style={styles.weekDate}>{cell.day}</Text>
              </View>
              <Text style={[styles.weekCount, isDark && styles.answerLabelDark]}>{cell.count}개</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.monthCard, isDark && styles.problemCardDark]}>
        <View style={styles.monthHeader}>
          <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth(-1)}>
            <Text style={styles.monthButtonText}>이전</Text>
          </TouchableOpacity>
          <Text style={[styles.monthTitle, isDark && styles.problemQuestionDark]}>
            {calendarMonth.year}년 {calendarMonth.month + 1}월
          </Text>
          <TouchableOpacity style={styles.monthButton} onPress={() => changeMonth(1)}>
            <Text style={styles.monthButtonText}>다음</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarGrid}>
          {WEEK_LABELS.map((label) => (
            <Text key={label} style={[styles.dayOfWeek, isDark && styles.answerLabelDark]}>{label}</Text>
          ))}
          {calendarDays.map((cell) => (
            <TouchableOpacity
              key={cell.date}
              style={[
                styles.calendarDay,
                { backgroundColor: heatmapColor(cell.count, isDark) },
                !cell.isCurrentMonth && styles.calendarDayMuted,
                activeDate === cell.date && styles.calendarDaySelected,
              ]}
              onPress={() => handleDayPress(cell)}
              activeOpacity={cell.count > 0 ? 0.7 : 1}
            >
              <Text style={[styles.calendarDayText, !cell.isCurrentMonth && styles.calendarDayTextMuted]}>{cell.day}</Text>
              {cell.count > 0 ? <Text style={styles.calendarCount}>{cell.count}</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.legendRow}>
          {[1, 2, 3, 4, 5, 6].map((lv) => (
            <View key={lv} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: heatmapColor(lv, isDark, true) }]} />
              <Text style={[styles.legendTxt, isDark && styles.answerLabelDark]}>
                {lv === 1 ? '1~5' : lv === 2 ? '6~10' : lv === 3 ? '11~15' : lv === 4 ? '16~20' : lv === 5 ? '21~25' : '26~30'}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, isDark && styles.containerDark, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.title, isDark && styles.titleDark]}>오답 노트</Text>
        <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
          {activeDate ? `${activeDate} 오답` : '전체 오답'} · {wrongProblems.length}개
        </Text>
        <Text style={[styles.navigationHint, isDark && styles.navigationHintDark]}>
          객관식은 학습 탭, 주관식은 이론 탭, 프로그래밍은 코드 탭으로 이동합니다.
        </Text>
      </View>

      <View style={[styles.miniTabs, isDark && styles.categoryFilterDark]}>
        <TouchableOpacity style={[styles.miniTab, activeTab === 'list' && styles.miniTabActive]} onPress={() => setActiveTab('list')}>
          <Text style={[styles.miniTabText, activeTab === 'list' && styles.miniTabTextActive]}>문제 리스트</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniTab, activeTab === 'calendar' && styles.miniTabActive]} onPress={() => setActiveTab('calendar')}>
          <Text style={[styles.miniTabText, activeTab === 'calendar' && styles.miniTabTextActive]}>오답 이력 달력</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'calendar' ? renderCalendar() : (
        <>
          {activeDate ? (
            <TouchableOpacity style={styles.clearBanner} onPress={clearDateFilter}>
              <Text style={styles.clearBannerText}>날짜 필터 해제하고 전체 오답 보기</Text>
            </TouchableOpacity>
          ) : null}

          <View style={[styles.categoryFilter, isDark && styles.categoryFilterDark]}>
            {problemTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.categoryButton,
                  selectedType === type.id && styles.categoryButtonActive,
                  isDark && styles.categoryButtonDark,
                ]}
                onPress={() => setSelectedType(type.id as ProblemType | 'all')}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedType === type.id && styles.categoryTextActive,
                    isDark && styles.categoryTextDark,
                  ]}
                >
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {wrongProblems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                {activeDate
                  ? '해당 날짜에 발생한 오답이 없습니다.'
                  : selectedType === 'all'
                    ? '오답이 없습니다!'
                    : `${getTypeLabel(selectedType as ProblemType)} 오답이 없습니다!`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={wrongProblems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.problemCard, isDark && styles.problemCardDark]}
                  onPress={() => handleRetry(item)}
                >
                  <View style={styles.problemHeader}>
                    <Text style={[styles.problemType, isDark && styles.problemTypeDark]}>
                      {getTypeLabel(item.problemType)}
                    </Text>
                    <Text style={[styles.dateText, isDark && styles.answerLabelDark]}>{String(item.submittedAt).slice(0, 10)}</Text>
                  </View>
                  <Text style={[styles.problemQuestion, isDark && styles.problemQuestionDark]} numberOfLines={2}>
                    {item.problemTitle}
                  </Text>
                  <View style={styles.answerContainer}>
                    <Text style={[styles.answerLabel, isDark && styles.answerLabelDark]}>내 답변:</Text>
                    <Text style={[styles.wrongAnswer, isDark && styles.wrongAnswerDark]}>{item.submittedAnswer}</Text>
                  </View>
                  <View style={styles.answerContainer}>
                    <Text style={[styles.answerLabel, isDark && styles.answerLabelDark]}>정답:</Text>
                    <Text style={[styles.correctAnswer, isDark && styles.correctAnswerDark]}>{item.correctAnswer}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#4a90e2' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 4 },
  navigationHint: { fontSize: 12, color: '#e2e8f0', marginTop: 8, lineHeight: 18 },
  navigationHintDark: { color: '#cbd5e0' },
  miniTabs: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', gap: 8 },
  miniTab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#e2e8f0', alignItems: 'center' },
  miniTabActive: { backgroundColor: '#4a90e2' },
  miniTabText: { color: '#4a5568', fontWeight: '700' },
  miniTabTextActive: { color: '#fff' },
  clearBanner: { backgroundColor: '#edf2f7', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  clearBannerText: { color: '#2b6cb0', fontWeight: '600', textAlign: 'center' },
  categoryFilter: { padding: 16, backgroundColor: '#fff', flexDirection: 'row', flexWrap: 'wrap' },
  categoryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8, marginBottom: 8 },
  categoryButtonActive: { backgroundColor: '#4a90e2' },
  categoryText: { fontSize: 14, color: '#666' },
  categoryTextActive: { color: '#fff', fontWeight: 'bold' },
  calendarContent: { paddingBottom: 24 },
  weekCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#2d3748', marginBottom: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', flex: 1 },
  weekLabel: { fontSize: 12, color: '#718096', marginBottom: 6, fontWeight: '700' },
  weekCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  weekDate: { color: '#fff', fontWeight: '800' },
  weekCount: { fontSize: 11, color: '#718096', marginTop: 6 },
  monthCard: { backgroundColor: '#fff', marginHorizontal: 16, padding: 16, borderRadius: 16 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  monthButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e8f0fe' },
  monthButtonText: { color: '#2b6cb0', fontWeight: '800' },
  monthTitle: { color: '#2d3748', fontWeight: '900', fontSize: 18 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayOfWeek: { width: `${100 / 7}%`, textAlign: 'center', color: '#718096', fontWeight: '800', marginBottom: 8 },
  calendarDay: { width: `${100 / 7}%`, aspectRatio: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)', padding: 4, justifyContent: 'space-between' },
  calendarDayMuted: { opacity: 0.35 },
  calendarDaySelected: { borderWidth: 3, borderColor: '#1a365d' },
  calendarDayText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  calendarDayTextMuted: { color: '#cbd5e0' },
  calendarCount: { color: '#fff', fontSize: 10, fontWeight: '800', alignSelf: 'flex-end' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 4 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2, marginRight: 4 },
  legendTxt: { fontSize: 10, color: '#666' },
  problemCard: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginHorizontal: 16, marginTop: 12 },
  problemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  problemType: { fontSize: 12, color: '#4a90e2', fontWeight: 'bold', backgroundColor: '#e8f0fe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  dateText: { fontSize: 11, color: '#718096' },
  problemQuestion: { fontSize: 14, color: '#2d3748', marginBottom: 12, lineHeight: 20 },
  answerContainer: { flexDirection: 'row', marginBottom: 4 },
  answerLabel: { fontSize: 12, color: '#666', marginRight: 8 },
  wrongAnswer: { fontSize: 12, color: '#e53e3e', flex: 1 },
  correctAnswer: { fontSize: 12, color: '#38a169', fontWeight: 'bold', flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
  containerDark: { backgroundColor: '#1a1a1a' },
  headerDark: { backgroundColor: '#2d2d2d' },
  titleDark: { color: '#fff' },
  subtitleDark: { color: '#aaa' },
  categoryFilterDark: { backgroundColor: '#2d2d2d' },
  categoryButtonDark: { backgroundColor: '#3d3d3d' },
  categoryTextDark: { color: '#aaa' },
  problemCardDark: { backgroundColor: '#3d3d3d' },
  problemTypeDark: { color: '#4a90e2', backgroundColor: '#2a3a5c' },
  problemQuestionDark: { color: '#fff' },
  emptyTextDark: { color: '#aaa' },
  answerLabelDark: { color: '#aaa' },
  wrongAnswerDark: { color: '#fc8181' },
  correctAnswerDark: { color: '#68d391' },
});
