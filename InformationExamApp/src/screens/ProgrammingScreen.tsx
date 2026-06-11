import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { problemService } from '../services/api';
import { fetchTheoryCards, fetchProgrammingCards } from '../api/theoryApi';
import { TheoryCard } from '../types/theory';
import type { MainTabParamList } from '../navigation/AppNavigator';

const languageIcons: Record<string, string> = {
  'C언어': '🅒',
  'Java': '☕',
  'Python': '🐍',
  '공통개념': '📚',
};

const languageColors: Record<string, string> = {
  'C언어': '#bbaf0b',
  'Java': '#f89820',
  'Python': '#3776ab',
  '공통개념': '#4a90e2',
};

const languages = Object.keys(languageIcons);

// DEBUG: [2026-06-09] 수정계획안12 - TheoryScreen 패턴으로 재구현
// 언어별 카드 필터링 키워드 (frontText/category 기준)
const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  'C언어': ['[C]', '[c]', 'C언어', 'c언어', 'C ', 'c '],
  'Java': ['[Java]', '[java]', 'Java', 'java'],
  'Python': ['[Python]', '[python]', 'Python', 'python'],
  '공통개념': ['[공통]', '[common]', '공통개념'],
};

export default function ProgrammingScreen() {
  const route = useRoute() as any;
  const navigation = useNavigation<NavigationProp<MainTabParamList, 'Programming'>>();
  const { darkMode, sessionId: storedSessionId } = useAuthStore();
  const targetProblemId = route?.params?.problemId;
  const sessionId = route?.params?.sessionId ?? route?.params?.studySessionId ?? storedSessionId ?? null;
  const [currentLanguage, setCurrentLanguage] = useState(route?.params?.language || 'C언어');

  // DEBUG: [2026-06-09] TheoryCard 타입 사용 (TheoryScreen과 동일)
  const [allCards, setAllCards] = useState<TheoryCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);

  // DEBUG: [2026-06-09] 수정계획안13 - 2개 탭 (flash/subjective)
  const [activeTab, setActiveTab] = useState<'flash' | 'subjective'>('flash');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const isMountedRef = useRef(true);

  const isDark = darkMode;
  const themeColor = languageColors[currentLanguage] || '#4a90e2';

  // DEBUG: [수정41 2026-06-11] 백엔드가 이미 언어별 필터링 수행 → 프론트엔드는 탭만 필터
  // 원인: LANGUAGE_KEYWORDS 기반 이중 필터링이 card.category=undefined로 인해 플래시카드를 모두 걸러냄
  // 해결: 백엔드 API가 언어별 카드를 반환하므로 프론트엔드는 탭(cardType)만 필터링
  const filteredCards = allCards.filter(card => {
    const tabMatch = activeTab === 'flash' ? card.cardType === 'FLASHCARD' : card.cardType === 'SUBJECTIVE';
    return tabMatch;
  });

  const currentCard = filteredCards[currentIndex] || null;
  const totalInTab = filteredCards.length;

  // [지상 최고 개발자 조치] 오답 노트 연동: 특정 문제 포커싱 및 언어 자동 전환
  useEffect(() => {
    if (route.params?.problemId && allCards.length > 0) {
      const targetId = Number(route.params.problemId);
      const targetCard = allCards.find(c => c.id === targetId);

      if (targetCard) {
        // 1. 해당 문제가 속한 언어 찾기
        const searchText = `${targetCard.frontText} ${targetCard.category}`.toLowerCase();
        let matchedLang = '공통개념';
        for (const [lang, keywords] of Object.entries(LANGUAGE_KEYWORDS)) {
          if (keywords.some(k => searchText.includes(k.toLowerCase()))) {
            matchedLang = lang;
            break;
          }
        }

        // 2. 탭 결정 (SUBJECTIVE면 subjective 탭으로)
        const targetTab = targetCard.cardType === 'SUBJECTIVE' ? 'subjective' : 'flash';
        setActiveTab(targetTab);

        // 3. 언어 변경
        setCurrentLanguage(matchedLang);

        // 4. 인덱스 설정 (다음 렌더링 후에)
        setTimeout(() => {
          const filtered = allCards.filter(card => {
            const tabMatch = targetTab === 'flash' ? card.cardType === 'FLASHCARD' : card.cardType === 'SUBJECTIVE';
            if (!tabMatch) return false;
            const keywords = LANGUAGE_KEYWORDS[matchedLang] || [];
            const text = `${card.frontText} ${card.category}`.toLowerCase();
            return keywords.some(k => text.includes(k.toLowerCase()));
          });
          const idx = filtered.findIndex(c => c.id === targetId);
          if (idx !== -1) {
            setCurrentIndex(idx);
            setIsFlipped(false);
            setShowAnswer(false);
            setSelectedOption(null);
          }
        }, 100);

        navigation.setParams({ problemId: undefined } as any);
      }
    }
  }, [route.params?.problemId, allCards]);

  useEffect(() => {
    if (!targetProblemId) return;
    console.log(`[ProgrammingScreen] targetProblemId received: ${targetProblemId}`);
  }, [targetProblemId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadProgrammingData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (allCards.length > 0 && isMountedRef.current) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowAnswer(false);
      setSelectedOption(null);
    }
  }, [currentLanguage, activeTab]);

  // DEBUG: [2026-06-09] TheoryScreen과 동일한 API 사용
  const loadProgrammingData = async () => {
    if (!isMountedRef.current) return;

    if (allCards.length > 0) {
      setIsContentLoading(true);
    } else {
      setIsLoading(true);
    }

    try {
      // DEBUG: [2026-06-09] 수정계획안14 - 모든 언어별 카드 가져오기
      console.log(`[ProgrammingScreen] fetchProgrammingCards 호출 - 모든 언어`);
      const languages = ['C언어', 'Java', 'Python', '공통개념'];
      const allProgrammingCards: TheoryCard[] = [];

      for (const lang of languages) {
        const data = await fetchProgrammingCards(lang);
        if (isMountedRef.current) {
          console.log(`[ProgrammingScreen] ${lang} loaded cards: ${data?.length ?? 0}`);
          if (data && data.length > 0) {
            allProgrammingCards.push(...data);
          }
        }
      }

      if (isMountedRef.current) {
        console.log(`[ProgrammingScreen] total loaded cards: ${allProgrammingCards.length}`);
        if (allProgrammingCards.length > 0) {
          const subjectiveCount = allProgrammingCards.filter(c => c.cardType === 'SUBJECTIVE').length;
          const flashcardCount = allProgrammingCards.filter(c => c.cardType === 'FLASHCARD').length;
          console.log(`[ProgrammingScreen] 카드 유형별 개수 - SUBJECTIVE: ${subjectiveCount}, FLASHCARD: ${flashcardCount}`);
        }
        setAllCards(allProgrammingCards || []);
      }
    } catch (error) {
      console.error('Error loading programming data:', error);
      Alert.alert('오류', '데이터베이스에서 프로그래밍 데이터를 불러오지 못했습니다.');
      if (isMountedRef.current) {
        setAllCards([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsContentLoading(false);
      }
    }
  };

  // DEBUG: [2026-06-09] 수정계획안13 - 오답노트 탭 삭제 (사용자 요청)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastConfig({ message, type });
    setToastVisible(true);
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleNext = () => {
    if (totalInTab === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalInTab);
    setIsFlipped(false);
    setShowAnswer(false);
    setSelectedOption(null);
  };

  const handlePrev = () => {
    if (totalInTab === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalInTab) % totalInTab);
    setIsFlipped(false);
    setShowAnswer(false);
    setSelectedOption(null);
  };

  // DEBUG: [2026-06-09] 주관식 보기 선택 핸들러
  const handleOptionSelect = (option: string) => {
    if (showAnswer) return;
    setSelectedOption(option);
  };

  // DEBUG: [2026-06-09] Fisher-Yates 셔플 알고리즘
  const shuffleArray = (array: string[]): string[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // DEBUG: [2026-06-09] 현재 카드 변경 시 보기 셔플
  useEffect(() => {
    if (currentCard && currentCard.options && currentCard.options.length > 0) {
      setShuffledOptions(shuffleArray(currentCard.options));
    } else {
      setShuffledOptions([]);
    }
    setSelectedOption(null);
    setShowAnswer(false);
  }, [currentCard?.id]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={themeColor} />
        <Text style={[styles.loadingText, isDark && styles.textWhite]}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerWrapper}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={[styles.container, isDark && styles.containerDark]}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 상단 헤더 */}
          <View style={[styles.header, { backgroundColor: themeColor }]}>
            <Text style={styles.categoryIcon}>{languageIcons[currentLanguage]}</Text>
            <View>
              <Text style={styles.headerSubtitle}>프로그래밍 언어</Text>
              <Text style={styles.headerTitle}>{currentLanguage}</Text>
              <Text style={styles.headerHint}>오답 노트에서 들어오면 해당 문제와 언어로 자동 정렬됩니다.</Text>
            </View>
          </View>

          {/* DEBUG: [2026-06-09] 수정계획안13 - 2개 탭 (flash/subjective) */}
          <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'flash' && styles.activeTab]}
              onPress={() => setActiveTab('flash')}
            >
              <Text style={[styles.tabText, activeTab === 'flash' && { color: themeColor, fontWeight: 'bold' }]}>
                플래시카드{allCards.filter(c => c.cardType === 'FLASHCARD').length > 0 ? ` (${allCards.filter(c => c.cardType === 'FLASHCARD').length})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'subjective' && styles.activeTab]}
              onPress={() => setActiveTab('subjective')}
            >
              <Text style={[styles.tabText, activeTab === 'subjective' && { color: themeColor, fontWeight: 'bold' }]}>
                주관식 퀴즈{allCards.filter(c => c.cardType === 'SUBJECTIVE').length > 0 ? ` (${allCards.filter(c => c.cardType === 'SUBJECTIVE').length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* DEBUG: [2026-06-09] 플래시카드 & 주관식 탭 콘텐츠 (TheoryScreen 패턴) */}
          {(activeTab === 'flash' || activeTab === 'subjective') && (
            <>
              <View style={styles.content}>
                {isContentLoading ? (
                  <View style={styles.contentLoadingContainer}>
                    <ActivityIndicator size="large" color={themeColor} />
                    <Text style={[styles.loadingText, isDark && styles.textWhite]}>언어 변경 중...</Text>
                  </View>
                ) : totalInTab > 0 ? (
                  <>
                    <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
                      {currentIndex + 1} / {totalInTab}
                    </Text>

                    <View style={styles.cardWrapper}>
                      <TouchableOpacity style={[styles.sideNavButton, styles.sideNavLeft]} onPress={handlePrev}>
                        <Text style={styles.sideNavText}>{"<"}</Text>
                      </TouchableOpacity>

                      <View style={styles.cardStage}>
                        {activeTab === 'flash' ? (
                          // 플래시카드 (TheoryScreen과 동일)
                          <TouchableOpacity
                            activeOpacity={0.9}
                            style={[styles.flashCard, isDark && styles.flashCardDark, { borderColor: themeColor }]}
                            onPress={() => setIsFlipped(!isFlipped)}
                          >
                            {isFlipped ? (
                              <View style={styles.cardContent}>
                                <Text style={[styles.termTitle, { color: themeColor }]}>정답</Text>
                                <Text style={[styles.termText, isDark && styles.textWhite]}>{currentCard.backText}</Text>
                                {currentCard.explanation && (
                                  <View style={styles.explanationBox}>
                                    <Text style={[styles.explanationText, isDark && styles.textWhite]}>{currentCard.explanation}</Text>
                                  </View>
                                )}
                              </View>
                            ) : (
                              <View style={styles.cardContent}>
                                <Text style={styles.hintTitle}>문제</Text>
                                <Text style={[styles.definitionText, isDark && styles.textWhite]}>{currentCard.frontText}</Text>
                              </View>
                            )}
                            <Text style={styles.flipGuide}>탭하여 뒤집기 🔄</Text>
                          </TouchableOpacity>
                        ) : (
                          // 주관식 퀴즈 (TheoryScreen과 동일 - 5개 보기 선택)
                          <View style={[styles.subjectiveCard, isDark && styles.flashCardDark]}>
                            <Text style={styles.hintTitle}>문제</Text>
                            <View style={styles.definitionBox}>
                              <Text style={[styles.definitionText, isDark && styles.textWhite]}>{currentCard.frontText}</Text>
                            </View>

                            {/* DEBUG: [2026-06-09] 5개 보기 버튼 (TheoryScreen 패턴) */}
                            {shuffledOptions.length > 0 ? (
                              <View style={styles.optionsContainer}>
                                {shuffledOptions.map((option, index) => {
                                  const isSelected = selectedOption === option;
                                  const isCorrect = option.toLowerCase() === (currentCard.backText || '').toLowerCase();
                                  const showResult = showAnswer;

                                  let buttonStyle = [styles.optionButton, isDark && styles.optionButtonDark];
                                  let textStyle = [styles.optionText, isDark && styles.textWhite];

                                  if (showResult) {
                                    if (isCorrect) {
                                      buttonStyle = [...buttonStyle, styles.optionButtonCorrect];
                                      textStyle = [...textStyle, styles.optionTextCorrect];
                                    } else if (isSelected && !isCorrect) {
                                      buttonStyle = [...buttonStyle, styles.optionButtonWrong];
                                      textStyle = [...textStyle, styles.optionTextWrong];
                                    }
                                  } else if (isSelected) {
                                    buttonStyle = [...buttonStyle, styles.optionButtonSelected, { backgroundColor: 'transparent', borderColor: themeColor }];
                                    textStyle = [...textStyle, { color: themeColor }];
                                  }

                                  return (
                                    <TouchableOpacity
                                      key={option}
                                      style={buttonStyle}
                                      onPress={() => handleOptionSelect(option)}
                                      disabled={showAnswer}
                                    >
                                      <Text style={styles.optionNumber}>{index + 1}</Text>
                                      <Text style={textStyle}>{option}</Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            ) : (
                              <View style={styles.noOptionsContainer}>
                                <Text style={[styles.noOptionsText, isDark && styles.textWhite]}>
                                  보기 정보가 없는 문제입니다.
                                </Text>
                              </View>
                            )}

                            {/* 정답 확인 버튼 */}
                            {shuffledOptions.length > 0 && selectedOption && !showAnswer && (
                              <TouchableOpacity
                                style={[styles.checkButton, { backgroundColor: themeColor, marginTop: 16 }]}
                                onPress={() => {
                                  const isCorrect = selectedOption.toLowerCase() === (currentCard.backText || '').toLowerCase();
                                  if (isCorrect) {
                                    showToast('정답입니다! 🎉', 'success');
                                  } else {
                                    showToast('오답입니다. ✍️', 'error');
                                  }
                                  setShowAnswer(true);

                                  // DEBUG: [2026-06-09] 답안 제출 (TheoryScreen과 동일)
                                  problemService.submitAnswer(
                                    currentCard.id,
                                    selectedOption,
                                    'PROGRAMMING_LANGUAGE',
                                    sessionId ?? undefined
                                  ).catch(err => {
                                    console.error('[ProgrammingScreen] 답안 제출 실패:', err);
                                  });
                                }}
                              >
                                <Text style={styles.checkButtonText}>정답 확인</Text>
                              </TouchableOpacity>
                            )}

                            {/* 정답 결과 표시 */}
                            {showAnswer && (
                              <View style={styles.answerResult}>
                                <Text style={[styles.answerLabel, { color: themeColor }]}>정답: {currentCard.backText}</Text>
                                {currentCard.explanation && (
                                  <Text style={[styles.resultExplanationText, isDark && styles.textWhite]}>{currentCard.explanation}</Text>
                                )}
                              </View>
                            )}
                          </View>
                        )}
                      </View>

                      <TouchableOpacity style={[styles.sideNavButton, styles.sideNavRight]} onPress={handleNext}>
                        <Text style={styles.sideNavText}>{">"}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, isDark && styles.textWhite]}>
                      {activeTab === 'subjective' ? '주관식 문제' : '플래시카드'}가 없습니다.
                    </Text>
                    <Text style={[styles.emptySubText, isDark && styles.textWhite]}>
                      언어: {currentLanguage}
                    </Text>
                    <TouchableOpacity
                      style={[styles.retryButton, { backgroundColor: themeColor }]}
                      onPress={() => loadProgrammingData()}
                    >
                      <Text style={styles.retryButtonText}>다시 불러오기</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* 언어 선택 그리드 */}
              <View style={[styles.categoryGrid, isDark && styles.categoryGridDark]}>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.categoryTab,
                      currentLanguage === lang && { backgroundColor: themeColor + '20', borderColor: themeColor }
                    ]}
                    onPress={() => setCurrentLanguage(lang)}
                  >
                    <Text style={styles.catTabIcon}>{languageIcons[lang]}</Text>
                    <Text style={[styles.catTabText, isDark && styles.textWhite, currentLanguage === lang && { color: themeColor, fontWeight: 'bold' }]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {toastVisible && (
        <Animated.View style={[
          styles.toastContainer,
          { opacity: fadeAnim },
          toastConfig.type === 'success' ? styles.toastSuccess : styles.toastError
        ]}>
          <Text style={styles.toastText}>{toastConfig.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#111111',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
  },
  //c언어배경패딩
  header: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  categoryIcon: {
    fontSize: 40,
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  headerHint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 15,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  categoryGridDark: {
    backgroundColor: '#222222',
  },
  categoryTab: {
    width: '48%',
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  catTabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  catTabText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -5,
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tabBarDark: {
    backgroundColor: '#222222',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabText: {
    fontSize: 13,
    color: '#64748b',
  },
  content: {
    padding: 20,
    paddingTop: 30,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 0, // DEBUG: [2026-06-10] "1 / 4" 인디케이터 하단 마진 제거 (요청)
  },
  progressTextDark: {
    color: '#94a3b8',
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStage: {
    flex: 1,
  },
  sideNavButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 3,
  },
  sideNavLeft: {
    marginRight: -20,
  },
  sideNavRight: {
    marginLeft: -20,
  },
  sideNavText: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: 'bold',
  },
  flashCard: {
    width: '100%',
    minHeight: 450,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  flashCardDark: {
    backgroundColor: '#222',
    borderColor: '#333',
  },
  subjectiveCard: {
    width: '100%',
    minHeight: 450,
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardContent: {
    alignItems: 'center',
    width: '100%',
  },
  hintTitle: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  termTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  termText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  definitionText: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'left',
    lineHeight: 24,
    width: '100%',
  },
  definitionBox: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  explanationBox: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%',
  },
  explanationText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  flipGuide: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#94a3b8',
  },
  optionsContainer: {
    marginTop: 20,
    width: '100%',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  optionButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  optionButtonSelected: {
    borderWidth: 2,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  optionButtonCorrect: {
    backgroundColor: 'rgba(72, 187, 120, 0.2)',
    borderColor: '#48bb78',
    borderWidth: 2,
  },
  optionButtonWrong: {
    backgroundColor: 'rgba(245, 101, 101, 0.2)',
    borderColor: '#f56565',
    borderWidth: 2,
  },
  optionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  optionTextCorrect: {
    color: '#22543d',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#c53030',
    fontWeight: '600',
  },
  noOptionsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noOptionsText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  checkButton: {
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
  },
  checkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  answerResult: {
    marginTop: 20,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
  },
  answerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultExplanationText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  textWhite: {
    color: '#fff',
  },
  contentLoadingContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    // top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  toastSuccess: {
    backgroundColor: '#48bb78',
  },
  toastError: {
    backgroundColor: '#f56565',
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  wrongAnswerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wrongAnswerTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 20,
  },
  wrongAnswerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  wrongAnswerLabel: {
    fontSize: 13,
    color: '#64748b',
    width: 60,
    fontWeight: '500',
  },
  wrongAnswerValue: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  wrongAnswerRed: {
    color: '#ef4444',
  },
  wrongAnswerGreen: {
    color: '#22c55e',
  },
  wrongAnswerDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'right',
  },
});
