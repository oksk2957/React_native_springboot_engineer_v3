import React, { useState, useEffect, useRef } from 'react';
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
import { useRoute } from '@react-navigation/native';
import { problemService } from '../services/api';
import type { Problem } from '../types';

const categoryIcons: Record<string, string> = {
  '운영체제': '💻',
  '네트워크': '🌐',
  '데이터베이스': '🗄️',
  '소프트웨어공학': '📋',
  '정보보안': '🔒',
  '애플리케이션테스트': '🧪',
};

const categoryColors: Record<string, string> = {
  '운영체제': '#4a90e2',
  '네트워크': '#48bb78',
  '데이터베이스': '#f6ad55',
  '소프트웨어공학': '#9f7aea',
  '정보보안': '#f56565',
  '애플리케이션테스트': '#ed64a6',
};

const categories = Object.keys(categoryIcons);

export default function TheoryScreen() {
  const route = useRoute() as any;
  const { darkMode } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'flash' | 'subjective'>('flash');
  const [currentCategory, setCurrentCategory] = useState(route?.params?.category || '운영체제');
  const [theoryIds, setTheoryIds] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState<Problem | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [isNavLoading, setIsNavLoading] = useState(false);

  const loadTokenRef = useRef(0);
  const theoryIdsRef = useRef<number[]>([]);
  const currentIndexRef = useRef(0);

  // Toast 애니메이션 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const isDark = darkMode;
  const themeColor = categoryColors[currentCategory] || '#4a90e2';
  const theoryTotal = theoryIds.length;
  const navLocked = isNavLoading || isContentLoading;

  useEffect(() => {
    theoryIdsRef.current = theoryIds;
  }, [theoryIds]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // 과목이 변경될 때마다 데이터 로드
  useEffect(() => {
    loadTheoryData();
  }, [currentCategory]);

  // route 파라미터가 변경될 때 과목 상태 업데이트
  useEffect(() => {
    if (route?.params?.category && route.params.category !== currentCategory) {
      setCurrentCategory(route.params.category);
    }
  }, [route?.params?.category]);

  const fetchProblemAtIndex = async (ids: number[], index: number, token: number) => {
    if (ids.length === 0 || index < 0 || index >= ids.length) {
      return null;
    }
    const problem = await problemService.getProblem(ids[index]);
    if (token !== loadTokenRef.current) {
      return null;
    }
    return problem;
  };

  const loadTheoryData = async () => {
    const token = ++loadTokenRef.current;

    if (theoryIds.length > 0) {
      setIsContentLoading(true);
    } else {
      setIsLoading(true);
    }

    setIsNavLoading(false);
    setCurrentCard(null);

    try {
      const meta = await problemService.getTheoryProblemMeta(currentCategory);
      if (token !== loadTokenRef.current) {
        return;
      }

      const ids = meta.ids || [];
      setTheoryIds(ids);
      setCurrentIndex(0);
      setIsFlipped(false);
      setAnswer('');
      setShowAnswer(false);

      if (ids.length === 0) {
        return;
      }

      const first = await fetchProblemAtIndex(ids, 0, token);
      if (first) {
        setCurrentCard(first);
      }
    } catch (error) {
      console.error('Error loading theory data:', error);
      if (token !== loadTokenRef.current) {
        return;
      }
      Alert.alert('오류', '데이터베이스에서 이론 데이터를 불러오지 못했습니다.');
      setTheoryIds([]);
      setCurrentIndex(0);
      setCurrentCard(null);
    } finally {
      if (token !== loadTokenRef.current) {
        return;
      }
      setIsLoading(false);
      setIsContentLoading(false);
    }
  };

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

  const handleFlipCard = () => {
    if (navLocked || !currentCard) return;
    setIsFlipped(!isFlipped);
  };

  const handleNext = async () => {
    const ids = theoryIdsRef.current;
    const len = ids.length;
    if (len === 0 || isContentLoading || isNavLoading) {
      return;
    }
    const idx = currentIndexRef.current;
    const nextIndex = (idx + 1) % len;
    const sessionAtTap = loadTokenRef.current;

    setIsNavLoading(true);
    setIsFlipped(false);
    setShowAnswer(false);
    setAnswer('');
    try {
      const problem = await problemService.getProblem(ids[nextIndex]);
      if (sessionAtTap !== loadTokenRef.current) {
        return;
      }
      currentIndexRef.current = nextIndex;
      setCurrentIndex(nextIndex);
      setCurrentCard(problem);
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '다음 문제를 불러오지 못했습니다.');
    } finally {
      setIsNavLoading(false);
    }
  };

  const handlePrev = async () => {
    const ids = theoryIdsRef.current;
    const len = ids.length;
    if (len === 0 || isContentLoading || isNavLoading) {
      return;
    }
    const idx = currentIndexRef.current;
    const prevIndex = (idx - 1 + len) % len;
    const sessionAtTap = loadTokenRef.current;

    setIsNavLoading(true);
    setIsFlipped(false);
    setShowAnswer(false);
    setAnswer('');
    try {
      const problem = await problemService.getProblem(ids[prevIndex]);
      if (sessionAtTap !== loadTokenRef.current) {
        return;
      }
      currentIndexRef.current = prevIndex;
      setCurrentIndex(prevIndex);
      setCurrentCard(problem);
    } catch (e) {
      console.error(e);
      Alert.alert('오류', '이전 문제를 불러오지 못했습니다.');
    } finally {
      setIsNavLoading(false);
    }
  };

  const handleCheckAnswer = () => {
    if (!currentCard || isNavLoading) return;
    const userAnswer = answer.trim().toLowerCase();
    const correctAnswer = currentCard.correctAnswer.toLowerCase();
    
    // 정답 후보군 추출 (한글(영어), 한글/영어 등 대응)
    const possibleAnswers = [
      correctAnswer, // 전체 정답 (예: "운영체제(os)")
      ...correctAnswer.split(/[()/,]/).map(s => s.trim()).filter(s => s.length > 0) // 분리된 정답 (예: ["운영체제", "os"])
    ];

    const isCorrect = possibleAnswers.some(ans => ans === userAnswer);
    
    if (isCorrect) {
      showToast('정답입니다! 🎉\n정확하게 알고 계시네요.', 'success');
      setShowAnswer(true);
    } else {
      showToast(`아쉽네요 ✍️\n정답은 "${currentCard.correctAnswer}" 입니다.`, 'error');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color={themeColor} />
        <Text style={[styles.loadingText, isDark && styles.textWhite]}>
          이론 문제 정보를 불러오는 중...
        </Text>
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
          {/* 탭 네비게이션 (최상단으로 이동) */}
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

      {/* 학습 영역 */}
      <View style={styles.content}>
        {isContentLoading ? (
          <View style={styles.contentLoadingContainer}>
            <ActivityIndicator size="large" color={themeColor} />
            <Text style={[styles.loadingText, isDark && styles.textWhite]}>
              문제 개수를 확인하고 첫 문제를 불러오는 중...
            </Text>
          </View>
        ) : theoryTotal > 0 ? (
          <>
            <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
              {currentIndex + 1} / {theoryTotal}
              {isNavLoading ? ' · 불러오는 중' : ''}
            </Text>

            {/* 카드 영역 + 사이드 네비게이션 */}
            <View style={styles.cardWrapper}>
              {/* 이전 버튼 (왼쪽) */}
              <TouchableOpacity
                style={[
                  styles.sideNavButton,
                  styles.sideNavLeft,
                  navLocked && styles.sideNavDisabled,
                ]}
                onPress={handlePrev}
                disabled={navLocked}
                accessibilityRole="button"
                accessibilityLabel="이전 문제"
              >
                <Text style={styles.sideNavText}>{"<"}</Text>
              </TouchableOpacity>

              <View style={styles.cardStage}>
                {activeTab === 'flash' ? (
                  <View style={styles.flashContainer}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.flashCard, isDark && styles.flashCardDark, { borderColor: themeColor }]}
                      onPress={handleFlipCard}
                      disabled={navLocked || !currentCard}
                    >
                      {currentCard ? (
                        isFlipped ? (
                          <View style={styles.cardContent}>
                            <Text style={[styles.termTitle, { color: themeColor }]}>정답</Text>
                            <Text style={[styles.termText, isDark && styles.textWhite]}>
                              {currentCard.correctAnswer}
                            </Text>
                            {currentCard.explanation ? (
                              <View style={styles.explanationBox}>
                                <Text style={[styles.explanationText, isDark && styles.textWhite]}>
                                  {currentCard.explanation}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : (
                          <View style={styles.cardContent}>
                            <Text style={styles.hintTitle}>문제</Text>
                            <Text style={[styles.definitionText, isDark && styles.textWhite]}>
                              {currentCard.question}
                            </Text>
                          </View>
                        )
                      ) : (
                        <View style={styles.cardContent}>
                          <ActivityIndicator size="large" color={themeColor} />
                          <Text style={[styles.definitionText, isDark && styles.textWhite, { marginTop: 16 }]}>
                            문제를 불러오는 중...
                          </Text>
                        </View>
                      )}
                      {currentCard ? (
                        <Text style={styles.flipGuide}>탭하여 뒤집기 🔄</Text>
                      ) : null}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.subjectiveCard, isDark && styles.flashCardDark]}>
                    {currentCard ? (
                      <>
                        <Text style={styles.hintTitle}>문제</Text>
                        <View style={styles.definitionBox}>
                          <Text style={[styles.definitionText, isDark && styles.textWhite]}>
                            {currentCard.question}
                          </Text>
                        </View>
                        <TextInput
                          style={[styles.answerInput, isDark && styles.inputDark]}
                          placeholder="정답을 입력하세요"
                          placeholderTextColor={isDark ? '#888' : '#999'}
                          value={answer}
                          onChangeText={setAnswer}
                          editable={!isNavLoading}
                        />
                        <TouchableOpacity
                          style={[
                            styles.checkButton,
                            { backgroundColor: themeColor },
                            isNavLoading && styles.checkButtonDisabled,
                          ]}
                          onPress={handleCheckAnswer}
                          disabled={isNavLoading}
                        >
                          <Text style={styles.checkButtonText}>정답 확인</Text>
                        </TouchableOpacity>
                        {showAnswer && (
                          <View style={styles.answerResult}>
                            <Text style={[styles.answerLabel, { color: themeColor }]}>
                              정답: {currentCard.correctAnswer}
                            </Text>
                            {currentCard.explanation ? (
                              <Text style={[styles.resultExplanationText, isDark && styles.textWhite]}>
                                {currentCard.explanation}
                              </Text>
                            ) : null}
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={styles.cardContent}>
                        <ActivityIndicator size="large" color={themeColor} />
                        <Text style={[styles.definitionText, isDark && styles.textWhite, { marginTop: 16 }]}>
                          문제를 불러오는 중...
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {isNavLoading && currentCard ? (
                  <View style={[styles.cardLoadingOverlay, isDark && styles.cardLoadingOverlayDark]}>
                    <ActivityIndicator size="large" color={themeColor} />
                  </View>
                ) : null}
              </View>

              {/* 다음 버튼 (오른쪽) */}
              <TouchableOpacity
                style={[
                  styles.sideNavButton,
                  styles.sideNavRight,
                  navLocked && styles.sideNavDisabled,
                ]}
                onPress={handleNext}
                disabled={navLocked}
                accessibilityRole="button"
                accessibilityLabel="다음 문제"
              >
                <Text style={styles.sideNavText}>{">"}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDark && styles.textWhite]}>이 과목에 등록된 데이터가 없습니다.</Text>
          </View>
        )}
      </View>

      {/* 과목 선택 그리드 (하단으로 이동) */}
      <View style={[styles.categoryGrid, isDark && styles.categoryGridDark, { marginBottom: 30 }]}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryTab,
              currentCategory === cat && { backgroundColor: themeColor + '20', borderColor: themeColor }
            ]}
            onPress={() => setCurrentCategory(cat)}
          >
            <Text style={styles.catTabIcon}>{categoryIcons[cat]}</Text>
            <Text style={[styles.catTabText, isDark && styles.textWhite, currentCategory === cat && { color: themeColor, fontWeight: 'bold' }]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
        </View>

        {/* 상단 과목 매칭 헤더 (최하단으로 이동) */}
        <View style={[styles.header, { backgroundColor: themeColor, borderRadius: 20, margin: 20 }]}>
          <Text style={styles.categoryIcon}>{categoryIcons[currentCategory]}</Text>
          <View>
            <Text style={styles.headerSubtitle}>이론 학습</Text>
            <Text style={styles.headerTitle}>{currentCategory}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

      {/* 토스트 메시지 */}
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
    backgroundColor: '#111',
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
  header: {
    padding: 24,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  categoryIcon: {
    fontSize: 40,
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    backgroundColor: '#fff',
    marginTop: 10,
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
    backgroundColor: '#222',
  },
  categoryTab: {
    width: '31%',
    padding: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  catTabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  catTabText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 15,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tabBarDark: {
    backgroundColor: '#222',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    padding: 20,
  },
  progressText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  progressTextDark: {
    color: '#94a3b8',
  },
  flashContainer: {
    alignItems: 'center',
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
  cardContent: {
    alignItems: 'center',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  explanationBox: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%',
  },
  explanationText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  definitionText: {
    fontSize: 18,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 28,
  },
  flipGuide: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#94a3b8',
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
  definitionBox: {
    backgroundColor: '#f1f5f9',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  answerInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 15,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  inputDark: {
    backgroundColor: '#333',
    borderColor: '#444',
    color: '#fff',
  },
  checkButton: {
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
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
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 40,
  },
  navButton: {
    width: '48%',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  navButtonDark: {
    backgroundColor: '#222',
  },
  navButtonText: {
    fontWeight: '600',
    color: '#475569',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
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
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: '#48bb78', // 초록색 배경
  },
  toastError: {
    backgroundColor: '#f56565', // 빨간색 배경
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
  },
  cardWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: -10,
  },
  sideNavButton: {
    position: 'absolute',
    top: '45%',
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sideNavLeft: {
    left: 5,
  },
  sideNavRight: {
    right: 5,
  },
  sideNavText: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: 'bold',
  },
  sideNavDisabled: {
    opacity: 0.35,
  },
  cardStage: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  cardLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 250, 252, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  cardLoadingOverlayDark: {
    backgroundColor: 'rgba(17, 17, 17, 0.65)',
  },
  checkButtonDisabled: {
    opacity: 0.55,
  },
});