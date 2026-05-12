import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useRoute } from '@react-navigation/native';
import { problemService } from '../services/api';
import type { Problem } from '../types';

const { width } = Dimensions.get('window');

const languageIcons: Record<string, string> = {
  'C언어': '🅒',
  'Java': '☕',
  'Python': '🐍',
  '공통개념': '📚',
};

const languageColors: Record<string, string> = {
  'C언어': '#555555',
  'Java': '#f89820',
  'Python': '#3776ab',
  '공통개념': '#4a90e2',
};

const languages = Object.keys(languageIcons);

// 언어별 문제 필터링 키워드
const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  'C언어': ['[C]', '[c]', 'C언어', 'c언어'],
  'Java': ['[Java]', '[java]', 'Java', 'java'],
  'Python': ['[Python]', '[python]', 'Python', 'python'],
  '공통개념': ['[공통]', '[common]', '공통개념'],
};

export default function ProgrammingScreen() {
  const route = useRoute() as any;
  const { darkMode } = useAuthStore();
  const [currentLanguage, setCurrentLanguage] = useState(route?.params?.language || 'C언어');
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // 무한 루프 방지: isMounted 플래그
  const isMountedRef = useRef(true);

  const isDark = darkMode;
  const themeColor = languageColors[currentLanguage] || '#4a90e2';

  // 언어별 문제 필터링
  const problems = React.useMemo(() => {
    const keywords = LANGUAGE_KEYWORDS[currentLanguage] || [];
    return allProblems.filter(problem =>
      keywords.some(keyword => problem.question.includes(keyword))
    );
  }, [allProblems, currentLanguage]);

  useEffect(() => {
    isMountedRef.current = true;
    loadProgrammingData();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (allProblems.length > 0 && isMountedRef.current) {
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [currentLanguage]);

  const loadProgrammingData = async () => {
    if (!isMountedRef.current) return;
    
    if (allProblems.length > 0) {
      setIsContentLoading(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const data = await problemService.getTheoryProblems('프로그래밍언어');
      if (isMountedRef.current) {
        setAllProblems(data || []);
      }
    } catch (error) {
      console.error('Error loading programming data:', error);
      Alert.alert('오류', '데이터베이스에서 프로그래밍 데이터를 불러오지 못했습니다.');
      if (isMountedRef.current) {
        setAllProblems([]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsContentLoading(false);
      }
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

  const handleFlipCard = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    if (problems.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % problems.length);
  };

  const handlePrev = () => {
    if (problems.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + problems.length) % problems.length);
  };

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
            </View>
          </View>

          {/* 학습 영역 */}
          <View style={styles.content}>
            {isContentLoading ? (
              <View style={styles.contentLoadingContainer}>
                <ActivityIndicator size="large" color={themeColor} />
                <Text style={[styles.loadingText, isDark && styles.textWhite]}>언어 변경 중...</Text>
              </View>
            ) : problems.length > 0 ? (
              <>
                <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
                  {currentIndex + 1} / {problems.length}
                </Text>

                <View style={styles.cardWrapper}>
                  <TouchableOpacity style={[styles.sideNavButton, styles.sideNavLeft]} onPress={handlePrev}>
                    <Text style={styles.sideNavText}>{"<"}</Text>
                  </TouchableOpacity>

                  <View style={styles.flashContainer}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={[styles.flashCard, isDark && styles.flashCardDark, { borderColor: themeColor }]}
                      onPress={handleFlipCard}
                    >
                      {isFlipped ? (
                        <View style={styles.cardContent}>
                          <Text style={[styles.termTitle, { color: themeColor }]}>출력 결과 / 정답</Text>
                          <Text style={[styles.termText, isDark && styles.textWhite]}>{problems[currentIndex].correctAnswer}</Text>
                          {problems[currentIndex].explanation ? (
                            <View style={styles.explanationBox}>
                              <Text style={[styles.explanationText, isDark && styles.textWhite]}>
                                {problems[currentIndex].explanation}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      ) : (
                        <View style={styles.cardContent}>
                          <Text style={styles.hintTitle}>코드 / 문제</Text>
                          <Text style={[styles.definitionText, isDark && styles.textWhite, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                            {problems[currentIndex].question}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.flipGuide}>탭하여 결과 확인 🔄</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={[styles.sideNavButton, styles.sideNavRight]} onPress={handleNext}>
                    <Text style={styles.sideNavText}>{">"}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDark && styles.textWhite]}>등록된 프로그래밍 문제가 없습니다.</Text>
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
    paddingTop: 60,
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
    backgroundColor: '#222',
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
    marginTop: -15,
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
    paddingTop: 30,
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
    minHeight: 400,
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
  definitionText: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'left',
    lineHeight: 24,
    width: '100%',
  },
  flipGuide: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
    color: '#94a3b8',
  },
  subjectiveCard: {
    width: '100%',
    minHeight: 400,
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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
});
