import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { problemService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { Problem } from '../types';
import { useRoute } from '@react-navigation/native';

type StudyMode = 'normal' | 'random' | 'subjective' | 'multiple';

export default function ProblemScreen() {
  const route = useRoute() as any;
  const { darkMode, sessionId: storedSessionId } = useAuthStore();
  const sessionId = route?.params?.sessionId ?? route?.params?.studySessionId ?? storedSessionId ?? null;

  const routeMode: StudyMode = route?.params?.mode ?? 'normal';
  const categoryParam: string | undefined = route?.params?.category;
  const rawPid = route?.params?.problemId;
  const hasExplicitProblemId =
    rawPid !== undefined && rawPid !== null && `${rawPid}`.trim() !== '' && Number.isFinite(Number(rawPid));

  const [problemIds, setProblemIds] = useState<number[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavLoading, setIsNavLoading] = useState(false);

  const problemIdsRef = useRef<number[]>([]);
  const currentIndexRef = useRef(0);
  const loadSeqRef = useRef(0);

  const isDark = darkMode;
  const poolSize = routeMode === 'random' ? problems.length : problemIds.length;

  useEffect(() => {
    problemIdsRef.current = problemIds;
  }, [problemIds]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    loadProblems();
  }, [routeMode, categoryParam, rawPid]);

  const loadProblems = async () => {
    const seq = ++loadSeqRef.current;
    setIsLoading(true);
    setIsNavLoading(false);
    setProblemIds([]);
    setProblems([]);
    setCurrentProblem(null);
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setSelectedAnswer('');
    setShowResult(false);

    try {
      if (hasExplicitProblemId) {
        const problem = await problemService.getProblem(Number(rawPid));
        setProblems([problem]);
        setCurrentProblem(problem);
      } else if (routeMode === 'random') {
        const problemList = await problemService.getOneRandomProblemPerSubject();
        if (seq === loadSeqRef.current) {
          setProblems(problemList);
          setCurrentProblem(problemList[0] || null);
        }
      } else {
        let ids: number[] = [];
        if (routeMode === 'subjective') {
          const meta = await problemService.getStudyProblemMeta({
            type: 'SUBJECTIVE',
            limit: 5000,
          });
          ids = meta.ids || [];
        } else if (routeMode === 'multiple') {
          const meta = await problemService.getStudyProblemMeta({
            type: 'OBJECTIVE',
            limit: 5000,
          });
          ids = meta.ids || [];
        } else if (categoryParam) {
          const meta = await problemService.getStudyProblemMeta({
            category: categoryParam,
            difficulty: 0,
            limit: 5000,
          });
          ids = meta.ids || [];
        } else {
          // 학습 탭 등 파라미터 없음 → 전역 객관식(OBJECTIVE) 순차 학습
          const meta = await problemService.getStudyProblemMeta({
            type: 'OBJECTIVE',
            limit: 5000,
          });
          ids = meta.ids || [];
        }

        if (seq !== loadSeqRef.current) return;

        setProblemIds(ids);
        problemIdsRef.current = ids;

        if (ids.length === 0) {
          return;
        }

        const first = await problemService.getProblem(ids[0]);
        if (seq !== loadSeqRef.current) return;
        setCurrentProblem(first);
      }
    } catch (error) {
      console.error('Error loading problems:', error);
      Alert.alert('오류', '문제를 불러오지 못했습니다.');
    } finally {
      if (seq === loadSeqRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!currentProblem) return;
    if (!selectedAnswer) {
      Alert.alert('오류', '정답을 입력하거나 선택해주세요.');
      return;
    }

    try {
      const result = await problemService.submitAnswer(
        currentProblem.id,
        selectedAnswer,
        currentProblem.type,
        sessionId ?? undefined
      );
      setShowResult(true);

      if (result.isCorrect) {
        Alert.alert('정답입니다! 🎉', result.explanation);
      } else {
        Alert.alert('틀렸습니다. ✍️', `정답: ${result.correctAnswer}\n\n${result.explanation}`);
      }
    } catch (error) {
      setShowResult(true);
    }
  };

  const goToProblemIndex = async (nextIndex: number) => {
    const ids = problemIdsRef.current;
    if (ids.length === 0 || nextIndex < 0 || nextIndex >= ids.length) {
      return;
    }
    const seqAtTap = loadSeqRef.current;
    setIsNavLoading(true);
    setSelectedAnswer('');
    setShowResult(false);
    try {
      const p = await problemService.getProblem(ids[nextIndex]);
      if (seqAtTap !== loadSeqRef.current) {
        return;
      }
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      setCurrentProblem(p);
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '문제를 불러오지 못했습니다.');
    } finally {
      setIsNavLoading(false);
    }
  };

  const handlePrevProblem = () => {
    Keyboard.dismiss();
    const idx = currentIndexRef.current;
    if (idx <= 0) {
      return;
    }
    if (routeMode === 'random') {
      setCurrentIndex(idx - 1);
      setCurrentProblem(problems[idx - 1] || null);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      void goToProblemIndex(idx - 1);
    }
  };

  const handleNextProblem = () => {
    Keyboard.dismiss();
    const idx = currentIndexRef.current;
    const len = routeMode === 'random' ? problems.length : problemIdsRef.current.length;
    if (len === 0) {
      return;
    }
    const isLastProblem = idx >= len - 1;
    if (isLastProblem) {
      Alert.alert(
        '학습 완료',
        '모든 과목의 문제를 다 보았습니다. 조회한 문제를 초기화하시겠습니까?',
        [
          { text: '아니오', style: 'cancel' },
          {
            text: '예',
            onPress: () => {
              void loadProblems();
            },
          },
        ]
      );
      return;
    }
    if (routeMode === 'random') {
      setCurrentIndex(idx + 1);
      setCurrentProblem(problems[idx + 1] || null);
      setSelectedAnswer('');
      setShowResult(false);
    } else {
      void goToProblemIndex(idx + 1);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a90e2" />
        <Text style={{ marginTop: 12 }}>문제 목록을 불러오는 중...</Text>
        {problemIds.length === 0 && (
          <TouchableOpacity onPress={loadProblems} style={{ marginTop: 16 }}>
            <Text style={{ color: '#4a90e2' }}>다시 시도하기</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!currentProblem || poolSize === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>표시할 문제가 없습니다.</Text>
        <TouchableOpacity onPress={loadProblems} style={{ marginTop: 16 }}>
          <Text style={{ color: '#4a90e2' }}>다시 시도하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View>
          <Text style={[styles.category, isDark && styles.categoryDark]}>
            {currentProblem?.isAiGenerated ? '[AI] ' : ''}
            {categoryParam || currentProblem?.category || '학습'}
          </Text>
          {poolSize >= 1 ? (
            <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
              {currentIndex + 1} / {poolSize}
              {isNavLoading ? ' · 불러오는 중' : ''}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.questionSection, isDark && styles.questionSectionDark]}>
        <Text style={[styles.questionText, isDark && styles.questionTextDark, { fontSize: 18 }]}>
          Q. {currentProblem.question}
        </Text>
      </View>

      {currentProblem.type === 'MULTIPLE_CHOICE' || currentProblem.type === 'OBJECTIVE' ? (
        <View style={[styles.optionsSection, isDark && styles.optionsSectionDark]}>
          {Object.keys(currentProblem.options).sort().map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                isDark && styles.optionButtonDark,
                selectedAnswer === option && styles.optionSelected,
                showResult && currentProblem.correctAnswer === option && styles.optionCorrect,
                showResult &&
                  selectedAnswer === option &&
                  selectedAnswer !== currentProblem.correctAnswer &&
                  styles.optionWrong,
              ]}
              onPress={() => !showResult && !isNavLoading && setSelectedAnswer(option)}
              disabled={showResult || isNavLoading}
            >
              <Text style={[styles.optionLabel, isDark && styles.optionLabelDark]}>{option}.</Text>
              <Text style={[styles.optionText, isDark && styles.optionTextDark]}>
                {currentProblem.options[option]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.subjectiveSection}>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="정답을 입력하세요"
            placeholderTextColor={isDark ? '#888' : '#aaa'}
            value={selectedAnswer}
            onChangeText={setSelectedAnswer}
            editable={!showResult && !isNavLoading}
          />
        </View>
      )}

      {!showResult ? (
        <TouchableOpacity
          style={[styles.submitButton, isNavLoading && { opacity: 0.55 }]}
          onPress={handleSubmit}
          disabled={isNavLoading}
        >
          <Text style={styles.submitText}>제출</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.explanationSection}>
          <Text style={styles.explanationTitle}>해설</Text>
          <Text style={styles.explanationText}>{currentProblem.explanation}</Text>
        </View>
      )}

      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentIndex === 0 && styles.navButtonMuted]}
          onPress={handlePrevProblem}
          disabled={currentIndex === 0 || isNavLoading}
          activeOpacity={0.65}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        >
          <Text style={styles.navText}>이전</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, poolSize === 0 && styles.navButtonMuted]}
          onPress={handleNextProblem}
          disabled={poolSize === 0 || isNavLoading}
          activeOpacity={0.65}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
        >
          <Text style={styles.navText}>다음</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  category: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  progressTextDark: {
    color: '#aaa',
  },
  fontControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fontButton: {
    fontSize: 18,
    padding: 8,
    color: '#4a90e2',
  },
  fontSizeText: {
    fontSize: 14,
    marginHorizontal: 8,
    color: '#666',
  },
  questionSection: {
    padding: 20,
  },
  questionText: {
    lineHeight: 28,
    color: '#2d3748',
  },
  questionSectionDark: {
    padding: 20,
    paddingTop: 0,
    backgroundColor: '#2d2d2d',
  },
  optionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  optionButton: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: '#4a90e2',
    backgroundColor: '#ebf8ff',
  },
  optionCorrect: {
    borderColor: '#38a169',
    backgroundColor: '#f0fff4',
  },
  optionWrong: {
    borderColor: '#e53e3e',
    backgroundColor: '#fff5f5',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#2d3748',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#2d3748',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  explanationSection: {
    padding: 20,
    marginTop: 16,
    backgroundColor: '#edf2f7',
    borderRadius: 8,
    marginHorizontal: 20,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4a5568',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: 16,
    marginBottom: 40,
  },
  navButton: {
    padding: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    width: '45%',
    alignItems: 'center',
    zIndex: 2,
    elevation: 2,
  },
  navButtonMuted: {
    opacity: 0.45,
  },
  subjectiveSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#2d3748',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: '#444',
    backgroundColor: '#333',
    color: '#fff',
  },
  navText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  // Dark mode styles
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  headerDark: {
    backgroundColor: '#2d2d2d',
    borderBottomColor: '#444',
  },
  categoryDark: {
    color: '#4a90e2',
  },
  fontButtonDark: {
    color: '#4a90e2',
  },
  fontSizeTextDark: {
    color: '#aaa',
  },
  questionTextDark: {
    color: '#fff',
  },
  optionsSectionDark: {
    backgroundColor: '#2d2d2d',
  },
  optionButtonDark: {
    borderColor: '#444',
    backgroundColor: '#3d3d3d',
  },
  optionLabelDark: {
    color: '#fff',
  },
  optionTextDark: {
    color: '#fff',
  },
});
