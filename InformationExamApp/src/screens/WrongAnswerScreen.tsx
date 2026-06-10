import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp, NavigationProp } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import type { WrongAnswer, ProblemType } from '../types';
import { statisticsService } from '../services/api';
import type { MainTabParamList } from '../navigation/AppNavigator';

type WrongAnswerRoute = RouteProp<MainTabParamList, 'Wrong'>;

const problemTypes: { id: ProblemType | 'all'; name: string }[] = [
  { id: 'all', name: '전체' },
  { id: 'OBJECTIVE', name: '객관식' },
  { id: 'SUBJECTIVE', name: '주관식' },
  { id: 'PROGRAMMING_LANGUAGE', name: '프로그래밍' },
];

export default function WrongAnswerScreen() {
  const route = useRoute<WrongAnswerRoute>();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { darkMode, isAuthenticated, user } = useAuthStore();
  const bookmarkDate = route.params?.bookmarkDate;

  const [selectedType, setSelectedType] = useState<ProblemType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(bookmarkDate);
  const [wrongProblems, setWrongProblems] = useState<WrongAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // DEBUG: [2026-06-10] 초기 로딩만 전체 화면, 이후 AJAX 부분 로딩

  const isDark = darkMode;

  const fetchWrongAnswers = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setWrongProblems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
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
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false); // DEBUG: [2026-06-10] 최초 로딩 완료 → 이후 AJAX 모드
    }
  }, [bookmarkDate, selectedDate, selectedType, isAuthenticated, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchWrongAnswers();
    }, [fetchWrongAnswers])
  );

  const activeDate = bookmarkDate ?? selectedDate;

  const clearDateFilter = () => {
    setSelectedDate(undefined);
    navigation.setParams({ bookmarkDate: undefined });
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
        navigation.navigate('Problem', { problemId, mode: 'normal' });
        break;
      case 'SUBJECTIVE':
        navigation.navigate('Theory', { problemId });
        break;
      case 'PROGRAMMING_LANGUAGE':
        navigation.navigate('Programming', { problemId });
        break;
      default:
        navigation.navigate('Problem', { problemId });
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

  // DEBUG: [2026-06-10] 초기 로딩만 전체 화면 인디케이터, 이후 AJAX 부분 로딩
  if (isInitialLoad && isLoading) {
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

      {/* DEBUG: [2026-06-10] AJAX 부분 로딩 — 콘텐츠 영역만 인디케이터 */}
      {isLoading && !isInitialLoad && (
        <View style={styles.ajaxLoadingContainer}>
          <ActivityIndicator size="small" color="#4a90e2" />
          <Text style={[styles.ajaxLoadingText, isDark && styles.answerLabelDark]}>불러오는 중...</Text>
        </View>
      )}

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
          style={{ flex: 1 }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  ajaxLoadingContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 8 },
  ajaxLoadingText: { fontSize: 13, color: '#666' },
  //오답노트
  header: { padding: 10, backgroundColor: '#4a90e2' },
  title: { fontSize: 15, fontWeight: 'bold', color: '#fff' },
  //전체 오답 css 
  subtitle: { fontSize: 14, color: '#fff', opacity: 0.8, marginTop: 0 },
  navigationHint: { fontSize: 12, color: '#e2e8f0', marginTop: 0, lineHeight: 18 },
  navigationHintDark: { color: '#cbd5e0' },
  clearBanner: { backgroundColor: '#edf2f7', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  clearBannerText: { color: '#2b6cb0', fontWeight: '600', textAlign: 'center' },
  // 전체 객관식 주관식 프로그래밍 가운데정렬
  categoryFilter: { paddingTop: 3, paddingHorizontal: 8, backgroundColor: '#fff', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }, // DEBUG: [2026-06-10] padding-top 제거 (요청)

  //전체 객관식 주관식 프로그래밍
  categoryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8, marginBottom: 3 },
  categoryButtonActive: { backgroundColor: '#4a90e2' },
  categoryText: { fontSize: 14, color: '#666' },
  categoryTextActive: { color: '#fff', fontWeight: 'bold' },
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
