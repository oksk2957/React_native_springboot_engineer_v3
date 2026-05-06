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
  
  // 통합된 카드 데이터 관리
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavLoading, setIsNavLoading] = useState(false);

  // Toast 애니메이션 상태
  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState({ message: '', type: 'success' });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isDark = darkMode;
  const themeColor = categoryColors[currentCategory] || '#4a90e2';
  
  // 현재 탭에 맞는 카드 필터링
  const filteredCards = cards.filter(card => 
    activeTab === 'flash' ? card.card_type === 'FLASHCARD' : card.card_type === 'SUBJECTIVE'
  );
  
  const currentCard = filteredCards[currentIndex] || null;
  const totalInTab = filteredCards.length;

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

  const loadTheoryCards = async () => {
    setIsLoading(true);
    try {
      const data = await problemService.getTheoryCards(currentCategory);
      setCards(data || []);
      setCurrentIndex(0);
      setIsFlipped(false);
      setAnswer('');
      setShowAnswer(false);
    } catch (error) {
      console.error('Error loading theory cards:', error);
      Alert.alert('오류', '데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
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
  };

  const handlePrev = () => {
    if (totalInTab === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalInTab) % totalInTab);
    setIsFlipped(false);
    setShowAnswer(false);
    setAnswer('');
  };

  const handleCheckAnswer = () => {
    if (!currentCard) return;
    const userAnswer = answer.trim().toLowerCase();
    const correctAnswer = (currentCard.back_text || '').toLowerCase();
    
    const possibleAnswers = [
      correctAnswer,
      ...correctAnswer.split(/[()/,]/).map(s => s.trim()).filter(s => s.length > 0)
    ];

    if (possibleAnswers.some(ans => ans === userAnswer)) {
      showToast('정답입니다! 🎉', 'success');
      setShowAnswer(true);
    } else {
      showToast(`오답입니다. ✍️`, 'error');
    }
  };

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

          <View style={styles.content}>
            {totalInTab > 0 ? (
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
                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        style={[styles.flashCard, isDark && styles.flashCardDark, { borderColor: themeColor }]} 
                        onPress={() => setIsFlipped(!isFlipped)}
                      >
                        {isFlipped ? (
                          <View style={styles.cardContent}>
                            <Text style={[styles.termTitle, { color: themeColor }]}>정답</Text>
                            <Text style={[styles.termText, isDark && styles.textWhite]}>{currentCard.back_text}</Text>
                            {currentCard.explanation && (
                              <View style={styles.explanationBox}>
                                <Text style={[styles.explanationText, isDark && styles.textWhite]}>{currentCard.explanation}</Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <View style={styles.cardContent}>
                            <Text style={styles.hintTitle}>문제</Text>
                            <Text style={[styles.definitionText, isDark && styles.textWhite]}>{currentCard.front_text}</Text>
                          </View>
                        )}
                        <Text style={styles.flipGuide}>탭하여 뒤집기 🔄</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.subjectiveCard, isDark && styles.flashCardDark]}>
                        <Text style={styles.hintTitle}>문제</Text>
                        <View style={styles.definitionBox}>
                          <Text style={[styles.definitionText, isDark && styles.textWhite]}>{currentCard.front_text}</Text>
                        </View>
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
                        {showAnswer && (
                          <View style={styles.answerResult}>
                            <Text style={[styles.answerLabel, { color: themeColor }]}>정답: {currentCard.back_text}</Text>
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
                <Text style={[styles.emptyText, isDark && styles.textWhite]}>데이터가 없습니다.</Text>
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
  emptyText: { color: '#64748b', fontSize: 16 },
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
});