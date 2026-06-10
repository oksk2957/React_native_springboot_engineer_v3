import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore, getCategoryIcons, getCategoryColors, getCategoryNames, Category } from '../stores/categoryStore';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchTheoryCards } from '../api/theoryApi';
import { TheoryCard } from '../types/theory';

// DEBUG: [카테고리 중앙화] 하드코딩 제거 - categoryStore에서 가져옴
// 원인: HomeScreen과 TheoryScreen의 카테고리 불일치
// 해결: categoryStore의 헬퍼 함수를 사용하여 동적으로 생성

const categoryIcons = getCategoryIcons();
const categoryColors = getCategoryColors();
const categories = getCategoryNames();

export default function TheoryScreen() {
  const route = useRoute() as any;
  const navigation = useNavigation() as any;
  const { darkMode } = useAuthStore();
  const targetProblemId = route?.params?.problemId;
  const [activeTab, setActiveTab] = useState<'flash' | 'subjective'>('flash');
  const [currentCategory, setCurrentCategory] = useState(route?.params?.category || '운영체제');

  // DEBUG: [과목 동기화] route.params.category 변경 감지
  // 원인: HomeScreen에서 navigation.navigate('Theory', { category: name })로 전달
  // 해결: route.params.category가 변경되면 currentCategory를 즉시 업데이트
  useEffect(() => {
    const paramCategory = route?.params?.category;
    if (paramCategory && paramCategory !== currentCategory) {
      console.log('[TheoryScreen] route.params.category 변경 감지:', paramCategory);
      setCurrentCategory(paramCategory);
    }
  }, [route?.params?.category]);

  // 통합된 카드 데이터 관리 (TheoryCard 타입 사용)
  const [cards, setCards] = useState<TheoryCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // DEBUG: [수정25] 빈 상태 AJAX 로딩 — 재로딩 시 콘텐츠 영역만 로딩 (전체 화면 덮기 방지)
  // 원인: "다시 불러오기" 클릭 시 isLoading=true → 전체 화면 early return → 헤더/탭/카테고리 소실
  // 해결: isContentLoading으로 콘텐츠 영역만 ActivityIndicator 표시
  const [isContentLoading, setIsContentLoading] = useState(false);

  // Toast 애니메이션 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // DEBUG: [주관식 보기] 주관식 퀴즈를 5개 보기 중 선택하는 형태로 변경
  // 원인: 사용자가 TextInput 대신 5개 보기 버튼 형태로 변경 요청
  // 해결: 선택된 보기와 셔플된 보기 상태 추가
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const isDark = darkMode;
  const themeColor = categoryColors[currentCategory] || '#4a90e2';

  // 현재 탭에 맞는 카드 필터링 (cardType 카멜케이스 사용)
  const filteredCards = cards.filter(card =>
    activeTab === 'flash' ? card.cardType === 'FLASHCARD' : card.cardType === 'SUBJECTIVE'
  );

  const currentCard = filteredCards[currentIndex] || null;
  const totalInTab = filteredCards.length;

  // [지상 최고 개발자 조치] 오답 노트 연동: 특정 문제 포커싱 로직
  useEffect(() => {
    if (route.params?.problemId && filteredCards.length > 0) {
      const targetId = Number(route.params.problemId);
      const foundIndex = filteredCards.findIndex(c => c.id === targetId);
      if (foundIndex !== -1) {
        setCurrentIndex(foundIndex);
        setActiveTab('subjective'); // 주관식은 퀴즈 모드로 즉시 전환
        // 파라미터 처리 완료 후 초기화 (무한 루프 방지)
        navigation.setParams({ problemId: undefined } as any);
      }
    }
  }, [route.params?.problemId, filteredCards]);

  useEffect(() => {
    loadTheoryCards();
  }, [currentCategory]);

  // 탭이 바뀌면 인덱스 초기화
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
    setAnswer('');
  }, [activeTab]);

  useEffect(() => {
    if (!targetProblemId) return;
    console.log(`[TheoryScreen] targetProblemId received: ${targetProblemId}`);
  }, [targetProblemId]);

  useEffect(() => {
    if (!targetProblemId || cards.length === 0) return;

    const matchedCard = cards.find((card) => Number(card.id) === Number(targetProblemId));
    if (!matchedCard) return;

    const nextTab = matchedCard.cardType === 'SUBJECTIVE' ? 'subjective' : 'flash';
    if (nextTab !== activeTab) {
      return;
    }

    const targetIndex = filteredCards.findIndex((card) => Number(card.id) === Number(targetProblemId));
    if (targetIndex >= 0 && currentIndex !== targetIndex) {
      console.log(`[TheoryScreen] syncing currentIndex after filteredCards update - problemId: ${targetProblemId}, index: ${targetIndex}`);
      setCurrentIndex(targetIndex);
      setIsFlipped(false);
      setShowAnswer(false);
      setAnswer('');
    }
  }, [activeTab, cards, currentIndex, filteredCards, targetProblemId]);

  const loadTheoryCards = async () => {
    // DEBUG: [수정25] 빈 상태 AJAX 로딩 — 첫 로딩만 전체 isLoading, 재로딩은 콘텐츠 영역만
    // 원인: "다시 불러오기" 클릭 시 isLoading=true → 전체 화면 early return → 헤더/탭/카테고리 소실
    // 해결: cards.length > 0이면 isContentLoading=true로 콘텐츠 영역만 로딩
    if (cards.length > 0) {
      setIsContentLoading(true);
    } else {
      setIsLoading(true);
    }
    try {
      // DEBUG: [이론카드 로딩] API 호출 시작
      console.log(`[TheoryScreen] fetchTheoryCards 호출 - category: ${currentCategory}`);
      const data = await fetchTheoryCards(currentCategory);
      console.log(`[TheoryScreen] loaded cards: ${data?.length ?? 0}, category: ${currentCategory}`);
      // DEBUG: [이론카드 로딩] 응답 데이터 상세 로깅
      if (data && data.length > 0) {
        console.log(`[TheoryScreen] 첫 번째 카드 샘플:`, JSON.stringify(data[0], null, 2));
        const subjectiveCount = data.filter(c => c.cardType === 'SUBJECTIVE').length;
        const flashcardCount = data.filter(c => c.cardType === 'FLASHCARD').length;
        console.log(`[TheoryScreen] 카드 유형별 개수 - SUBJECTIVE: ${subjectiveCount}, FLASHCARD: ${flashcardCount}`);
      } else {
        console.warn(`[TheoryScreen] 빈 데이터 응답 - category: ${currentCategory}`);
      }
      setCards(data || []);
      if (!targetProblemId) {
        setCurrentIndex(0);
        setIsFlipped(false);
        setAnswer('');
        setShowAnswer(false);
      }
    } catch (error: any) {
      // DEBUG: [이론카드 로딩] 에러 상세 로깅
      console.error('[TheoryScreen] Error loading theory cards:', error);
      console.error('[TheoryScreen] Error message:', error?.message);
      console.error('[TheoryScreen] Error stack:', error?.stack);
      Alert.alert(
        '데이터 로딩 실패',
        `서버에서 데이터를 불러올 수 없습니다.\n\n` +
        `카테고리: ${currentCategory}\n` +
        `오류: ${error?.message || '알 수 없는 오류'}\n\n` +
        `네트워크 연결을 확인하거나 서버 상태를 점검해주세요.`
      );
    } finally {
      setIsLoading(false);
      setIsContentLoading(false); // DEBUG: [수정25] 콘텐츠 로딩 완료
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToastConfig({ message, type });
    setToastVisible(true);
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start(() => setToastVisible(false));
  };

  const handleNext = () => {
    if (totalInTab === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalInTab);
    setIsFlipped(false);
    setShowAnswer(false);
    setAnswer('');
    // DEBUG: [주관식 보기] 다음 문제로 이동 시 선택 상태 초기화
    setSelectedOption(null);
  };

  const handlePrev = () => {
    if (totalInTab === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalInTab) % totalInTab);
    setIsFlipped(false);
    setShowAnswer(false);
    setAnswer('');
    // DEBUG: [주관식 보기] 이전 문제로 이동 시 선택 상태 초기화
    setSelectedOption(null);
  };

  const handleCheckAnswer = () => {
    if (!currentCard) return;
    const userAnswer = answer.trim().toLowerCase();
    // backText 카멜케이스 사용
    const correctAnswer = (currentCard.backText || '').toLowerCase();

    const possibleAnswers = [
      correctAnswer,
      ...correctAnswer.split(/[()/,]/).map(s => s.trim()).filter(s => s.length > 0)
    ];

    if (possibleAnswers.some(ans => ans === userAnswer)) {
      showToast('정답입니다! 🎉', 'success');
      setShowAnswer(true);
    } else {
      showToast('오답입니다. ✍️', 'error');
    }
  };

  // DEBUG: [주관식 보기] 주관식 퀴즈를 5개 보기 중 선택하는 형태로 변경
  // 원인: 사용자가 TextInput 대신 5개 보기 버튼 형태로 변경 요청
  // 해결: 선택된 보기와 정답을 비교하는 핸들러 추가
  const handleOptionSelect = (option: string) => {
    if (showAnswer) return; // 이미 정답을 확인한 경우 선택 불가
    setSelectedOption(option);
  };

  // DEBUG: [주관식 보기] Fisher-Yates 셔플 알고리즘으로 보기 순서 랜덤화
  // 원인: 보기가 항상 같은 순서로 표시되면 정답 위치를 외울 수 있음
  // 해결: 문제를 표시할 때마다 보기를 랜덤하게 섞음
  const shuffleArray = (array: string[]): string[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // DEBUG: [주관식 보기] 현재 카드가 변경될 때 보기를 셔플
  // 원인: 매번 같은 순서로 보기가 표시되는 것을 방지
  // 해결: currentCard가 변경될 때마다 options를 셔플하여 shuffledOptions에 저장
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
        <Text style={[styles.loadingText, isDark && styles.textWhite]}>이론 데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.containerWrapper}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={[styles.container, isDark && styles.containerDark]} contentContainerStyle={{ flexGrow: 1 }}>

          <View style={[styles.header, { backgroundColor: themeColor }]}>
            <Text style={styles.categoryIcon}>{categoryIcons[currentCategory]}</Text>
            <View>
              <Text style={styles.headerSubtitle}>이론 학습</Text>
              <Text style={styles.headerTitle}>{currentCategory}</Text>
              <Text style={styles.headerHint}>오답 노트에서 들어오면 해당 문제로 자동 이동합니다.</Text>
            </View>
          </View>

          <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'flash' && styles.activeTab]}
              onPress={() => setActiveTab('flash')}
            >
              <Text style={[styles.tabText, activeTab === 'flash' && { color: themeColor, fontWeight: 'bold' }]}>플래시 카드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'subjective' && styles.activeTab]}
              onPress={() => setActiveTab('subjective')}
            >
              <Text style={[styles.tabText, activeTab === 'subjective' && { color: themeColor, fontWeight: 'bold' }]}>주관식 퀴즈</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.programmingCtaWrap}>
            <TouchableOpacity
              style={[styles.programmingCtaButton, { backgroundColor: themeColor }]}
              onPress={() => navigation.navigate('Programming' as never)}
            >
              <Text style={styles.programmingCtaTitle}>실기 주관식 랜덤학습</Text>
              <Text style={styles.programmingCtaSubtitle}>코드 학습 화면으로 이동</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {totalInTab > 0 ? (
              <>
                <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
                  {currentIndex + 1} / {totalInTab}
                </Text>

                <View style={styles.cardWrapper}>
                  <TouchableOpacity style={[styles.sideNavButton, styles.sideNavLeft]} onPress={handlePrev}>
                    <Text style={styles.sideNavText}>{'<'}</Text>
                  </TouchableOpacity>

                  <View style={styles.cardStage}>
                    {activeTab === 'flash' ? (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={[styles.flashCard, isDark && styles.flashCardDark, { borderColor: themeColor }]}
                        onPress={() => setIsFlipped(!isFlipped)}
                      >
                        {isFlipped ? (
                          <View style={styles.cardContent}>
                            <Text style={[styles.termTitle, { color: themeColor }]}>정답</Text>
                            {/* backText 카멜케이스 사용 */}
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
                            {/* frontText 카멜케이스 사용 */}
                            <Text style={[styles.definitionText, isDark && styles.textWhite]}>{currentCard.frontText}</Text>
                          </View>
                        )}
                        <Text style={styles.flipGuide}>탭하여 뒤집기 🔄</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.subjectiveCard, isDark && styles.flashCardDark]}>
                        <Text style={styles.hintTitle}>문제</Text>
                        <View style={styles.definitionBox}>
                          {/* frontText 카멜케이스 사용 */}
                          <Text style={[styles.definitionText, isDark && styles.textWhite]}>{currentCard.frontText}</Text>
                        </View>

                        {/* DEBUG: [주관식 보기] TextInput을 5개 보기 버튼으로 변경 */}
                        {/* 원인: 사용자가 TextInput 대신 5개 보기 버튼 형태로 변경 요청 */}
                        {/* 해결: options가 있으면 보기 버튼 표시, 없으면 기존 TextInput 유지 */}
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
                                buttonStyle = [...buttonStyle, styles.optionButtonSelected, { borderColor: themeColor }];
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
                          <>
                            <TextInput
                              style={[styles.answerInput, isDark && styles.inputDark]}
                              placeholder="정답을 입력하세요"
                              placeholderTextColor="#999"
                              value={answer}
                              onChangeText={setAnswer}
                            />
                            <TouchableOpacity style={[styles.checkButton, { backgroundColor: themeColor }]} onPress={handleCheckAnswer}>
                              <Text style={styles.checkButtonText}>정답 확인</Text>
                            </TouchableOpacity>
                          </>
                        )}

                        {/* DEBUG: [주관식 보기] 보기 선택 후 정답 확인 버튼 */}
                        {/* 원인: 보기 버튼을 선택한 후 정답을 확인해야 함 */}
                        {/* 해결: 선택된 보기와 정답을 비교하는 버튼 추가 */}
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
                            }}
                          >
                            <Text style={styles.checkButtonText}>정답 확인</Text>
                          </TouchableOpacity>
                        )}

                        {showAnswer && (
                          <View style={styles.answerResult}>
                            {/* backText 카멜케이스 사용 */}
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
                    <Text style={styles.sideNavText}>{'>'}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                {/* DEBUG: [수정25] AJAX 로딩 인디케이터 — 콘텐츠 영역만 로딩, 헤더/탭 유지 */}
                {isContentLoading && (
                  <View style={{ marginBottom: 16, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={themeColor} />
                    <Text style={[styles.emptySubText, isDark && styles.textWhite, { marginTop: 8 }]}>
                      카드를 불러오는 중...
                    </Text>
                  </View>
                )}
                {/* DEBUG: [빈 상태] 데이터가 없을 때 표시되는 메시지 */}
                <Text style={[styles.emptyText, isDark && styles.textWhite]}>
                  {activeTab === 'subjective' ? '주관식 문제' : '플래시카드'}가 없습니다.
                </Text>
                <Text style={[styles.emptySubText, isDark && styles.textWhite]}>
                  카테고리: {currentCategory}
                </Text>
                <TouchableOpacity
                  style={[styles.retryButton, { backgroundColor: themeColor }]}
                  onPress={() => loadTheoryCards()}
                >
                  <Text style={styles.retryButtonText}>다시 불러오기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[styles.categoryGrid, isDark && styles.categoryGridDark]}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryTab, currentCategory === cat && { backgroundColor: themeColor + '20', borderColor: themeColor }]}
                onPress={() => setCurrentCategory(cat)}
              >
                <Text style={styles.catTabIcon}>{categoryIcons[cat]}</Text>
                <Text style={[styles.catTabText, isDark && styles.textWhite, currentCategory === cat && { color: themeColor, fontWeight: 'bold' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {toastVisible && (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }, toastConfig.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toastConfig.message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  containerDark: { backgroundColor: '#111' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#64748b' },
  header: { padding: 24, paddingTop: 40, flexDirection: 'row', alignItems: 'center' },
  categoryIcon: { fontSize: 40, marginRight: 16, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  headerHint: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, backgroundColor: '#fff', margin: 20, borderRadius: 15, justifyContent: 'space-between' },
  categoryGridDark: { backgroundColor: '#222' },
  categoryTab: { width: '31%', padding: 10, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginBottom: 8 },
  catTabIcon: { fontSize: 20, marginBottom: 4 },
  catTabText: { fontSize: 10, color: '#64748b', textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 15, borderRadius: 15, padding: 5 },
  tabBarDark: { backgroundColor: '#222' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: 'rgba(0,0,0,0.05)' },
  tabText: { fontSize: 14, color: '#64748b' },
  content: { padding: 20 },
  progressText: { textAlign: 'center', fontSize: 14, color: '#64748b', marginBottom: 20 },
  progressTextDark: { color: '#94a3b8' },
  flashCard: { width: '100%', minHeight: 450, backgroundColor: '#fff', borderRadius: 25, padding: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  flashCardDark: { backgroundColor: '#222', borderColor: '#333' },
  cardContent: { alignItems: 'center' },
  hintTitle: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  termTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  termText: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  explanationBox: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0', width: '100%' },
  explanationText: { fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 24 },
  definitionText: { fontSize: 18, color: '#334155', textAlign: 'center', lineHeight: 28 },
  flipGuide: { position: 'absolute', bottom: 20, fontSize: 12, color: '#94a3b8' },
  subjectiveCard: { width: '100%', minHeight: 450, backgroundColor: '#fff', borderRadius: 25, padding: 24 },
  definitionBox: { backgroundColor: '#f1f5f9', padding: 20, borderRadius: 15, marginBottom: 20 },
  answerInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 15, padding: 16, fontSize: 16, marginBottom: 16 },
  inputDark: { backgroundColor: '#333', borderColor: '#444', color: '#fff' },
  checkButton: { padding: 16, borderRadius: 15, alignItems: 'center' },
  checkButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  answerResult: { marginTop: 20, alignItems: 'center', padding: 15, backgroundColor: '#f8fafc', borderRadius: 10 },
  answerLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  resultExplanationText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16, marginBottom: 8 },
  emptySubText: { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  textWhite: { color: '#fff' },
  toastContainer: { position: 'absolute', top: 60, left: 20, right: 20, padding: 16, borderRadius: 12, alignItems: 'center', zIndex: 1000 },
  toastSuccess: { backgroundColor: '#48bb78' },
  toastError: { backgroundColor: '#f56565' },
  toastText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  cardWrapper: { flexDirection: 'row', alignItems: 'center' },
  sideNavButton: { width: 40, height: 40, backgroundColor: '#fff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 3 },
  sideNavLeft: { marginRight: -20 },
  sideNavRight: { marginLeft: -20 },
  sideNavText: { fontSize: 24, color: '#64748b', fontWeight: 'bold' },
  cardStage: { flex: 1 },
  // DEBUG: [주관식 보기] 5개 보기 버튼 스타일 추가
  // 원인: TextInput 대신 5개 보기 버튼 형태로 변경
  // 해결: 보기 버튼, 선택 상태, 정답/오답 표시 스타일 정의
  optionsContainer: { marginTop: 20, width: '100%' },
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
    borderColor: '#e2e8f0',
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
});
