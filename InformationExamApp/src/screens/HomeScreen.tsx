import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { statisticsService } from '../services/api';
// DEBUG: [수정39-2026-06-10] default import → named import 변경
// 원인: theoryApi.ts는 named export만 제공하므로 default import 시 undefined
import { fetchTheoryCards } from '../api/theoryApi';
import type { MainTabParamList } from '../navigation/AppNavigator';

const categories = [
  { id: 'os', name: '운영체제', icon: '💻' },
  { id: 'network', name: '네트워크', icon: '🌐' },
  { id: 'database', name: '데이터베이스', icon: '🗄️' },
  { id: 'software', name: '소프트웨어공학', icon: '📋' },
  { id: 'security', name: '정보보안', icon: '🔒' },
  { id: 'test', name: '애플리케이션테스트', icon: '🧪' },
  { id: 'programming', name: '프로그래밍언어', icon: '👨‍💻' },
];

export default function HomeScreen() {
  // DEBUG: [타입수정] useNavigation에 타입 파라미터 추가하여 'never' 에러 해결
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const { user, darkMode } = useAuthStore();
  const [subjectiveCount, setSubjectiveCount] = useState<number>(0);
  const [totalObjectiveCount, setTotalObjectiveCount] = useState<number>(0);

  // DEBUG: [수정42-2026-06-11] 로그인 미니달력 상태 — 실제 로그인 기록 기반
  const today = new Date();
  const todayDate = today.getDate();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const weekNumber = Math.ceil(todayDate / 7);
  const [loginDates, setLoginDates] = useState<string[]>([]);

  // DEBUG: [수정42-2026-06-11] 로그인 기록 기반 잔디 배열 생성 — 실제 월별 일수 반영
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const studyRecord = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dateString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return loginDates.includes(dateString);
  });

  const isDark = darkMode;

  useEffect(() => {
    // DEBUG: [수정42-2026-06-11] 로그인 기록 조회 — 미니달력 표시용
    const fetchLoginDates = async () => {
      try {
        const dates = await statisticsService.getLoginCalendar(currentYear, currentMonth);
        setLoginDates(dates);
      } catch (error) {
        console.error('Failed to fetch login dates:', error);
      }
    };

    const fetchSubjectiveCount = async () => {
      try {
        const count = await statisticsService.getSubjectiveCount();
        setSubjectiveCount(count);
      } catch (error) {
        console.error('Failed to fetch subjective count:', error);
      }
    };
    const allCategories = ['운영체제', '네트워크', '데이터베이스', '소프트웨어공학', '정보보안', '애플리케이션테스트', '프로그래밍언어'];
    const fetchObjectiveCount = async () => {
      try {
        const results = await Promise.all(
          allCategories.map(cat => fetchTheoryCards(cat))
        );
        // DEBUG: [2026-06-11] cardType === 'OBJECTIVE' 비교 제거
        // 원인: TheoryCard.cardType은 'SUBJECTIVE' | 'FLASHCARD'만 포함 → 'OBJECTIVE' 비교는 TS 에러
        // 해결: fetchTheoryCards는 problem 테이블(객관식)만 반환 → 전체 개수가 곧 객관식 수
        const total = results.reduce((sum, cards) => sum + cards.length, 0);
        setTotalObjectiveCount(total);
      } catch (error) {
        console.error('Failed to fetch objective count:', error);
      }
    };
    fetchLoginDates();
    fetchSubjectiveCount();
    fetchObjectiveCount();
  }, [currentYear, currentMonth]);

  const menuItems = [
    {
      title: '실기 주관식 랜덤 학습',
      subtitle: `잔여 주관식: ${subjectiveCount}문제`,
      icon: '📝',
      // DEBUG: [UX-개선] 실기 주관식 랜덤 학습 클릭 시 이론 탭으로 이동
      onPress: () => {
        console.log('[Navigation] 실기 주관식 랜덤 학습 → TheoryTab 이동');
        navigation.navigate('Theory' as never);
      },
    },
    {
      title: '취약 과목',
      subtitle: '약점 분야 연습',
      icon: '⚠️',
      onPress: () => navigation.navigate('Wrong'),
    },
    {
      title: '객관식 랜덤학습',
      subtitle: `전체 과목 객관식 ${totalObjectiveCount}문제`,
      icon: '🎲',
      // DEBUG: [타입수정] mode 리터럴 타입 보존을 위해 as const 적용
      onPress: () => navigation.navigate('Problem', { mode: 'random' as const }),
    },
  ];

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.greeting, isDark && styles.greetingDark]}>
          안녕하세요, {user?.nickname || '사용자'}님!{'\n'}합격을 기원합니다🎉
        </Text>
        <Text style={[styles.dDay, isDark && styles.dDayDark]}>
          {currentMonth}월 {weekNumber}번째 주
        </Text>
      </View>

      <View style={[styles.grassSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          {currentMonth}월 학습 기록
        </Text>
        {/* DEBUG: [수정42-2026-06-11] UX 개선 — 날짜 숫자 표시 + 오늘 하이라이트 + 범례 */}
        <View style={styles.grassGrid}>
          {studyRecord.map((done, index) => {
            const day = index + 1;
            const isToday = day === todayDate;
            return (
              <View
                key={index}
                style={[
                  styles.grassBlock,
                  done && styles.grassActive,
                  isToday && styles.grassToday,
                  isDark && styles.grassBlockDark,
                  isDark && done && styles.grassActiveDark,
                ]}
              >
                <Text style={[
                  styles.grassText,
                  done && styles.grassTextActive,
                  isToday && styles.grassTextToday,
                ]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
        {/* DEBUG: [수정42-2026-06-11] 범례 — 미학습(회색) vs 학습완료(초록) */}
        <View style={styles.grassLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBlock, { backgroundColor: '#ebedf0' }]} />
            <Text style={[styles.legendText, isDark && styles.legendTextDark]}>미학습</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBlock, { backgroundColor: '#48bb78' }]} />
            <Text style={[styles.legendText, isDark && styles.legendTextDark]}>학습 완료</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBlock, styles.legendToday]} />
            <Text style={[styles.legendText, isDark && styles.legendTextDark]}>오늘</Text>
          </View>
        </View>
      </View>

      <View style={[styles.menuSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>퀵 메뉴</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, isDark && styles.menuItemDark]}
            onPress={item.onPress}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, isDark && styles.menuTitleDark]}>{item.title}</Text>
              <Text style={[styles.menuSubtitle, isDark && styles.menuSubtitleDark]}>
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.categorySection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>과목별 학습</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryItem, isDark && styles.categoryItemDark]}
              onPress={() => {
                if (cat.id === 'programming') {
                  navigation.navigate('Programming');
                } else {
                  navigation.navigate('Theory', { category: cat.name });
                }
              }}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryName, isDark && styles.categoryNameDark]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.noticeSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>공지사항</Text>
        <View style={[styles.noticeItem, isDark && styles.noticeItemDark]}>
          <Text style={[styles.noticeTitle, isDark && styles.noticeTitleDark]}>
            2026년 정처기 시험 일정
          </Text>
          <Text style={[styles.noticeDate, isDark && styles.noticeDateDark]}>
            2026.04.15
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#4a90e2',
  },
  greeting: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  dDay: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  grassSection: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  // DEBUG: [수정42-2026-06-11] UX 개선 — 블록 크기 증가로 날짜 표시 + 범례 추가
  grassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  grassBlock: {
    width: 28,
    height: 28,
    backgroundColor: '#ebedf0',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  grassBlockDark: {
    backgroundColor: '#3d3d3d',
  },
  grassActive: {
    backgroundColor: '#48bb78',
  },
  grassActiveDark: {
    backgroundColor: '#38a169',
  },
  grassToday: {
    borderWidth: 2,
    borderColor: '#e53e3e',
  },
  grassText: {
    fontSize: 10,
    color: '#a0aec0',
    fontWeight: '500',
  },
  grassTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  grassTextToday: {
    color: '#e53e3e',
    fontWeight: 'bold',
  },
  grassLegend: {
    flexDirection: 'row',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendBlock: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendToday: {
    backgroundColor: '#ebedf0',
    borderWidth: 2,
    borderColor: '#e53e3e',
  },
  legendText: {
    fontSize: 11,
    color: '#718096',
  },
  legendTextDark: {
    color: '#aaa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2d3748',
  },
  menuSection: {
    padding: 20,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f4f7f6',
    borderRadius: 8,
    marginBottom: 12,
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  categorySection: {
    padding: 20,
    marginTop: 8,
    backgroundColor: '#fff',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#f4f7f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  noticeSection: {
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  noticeItem: {
    padding: 12,
    backgroundColor: '#f4f7f6',
    borderRadius: 8,
  },
  noticeTitle: {
    fontSize: 14,
    color: '#2d3748',
  },
  noticeDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  // Dark mode
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  headerDark: {
    backgroundColor: '#2d2d2d',
  },
  greetingDark: {
    color: '#fff',
  },
  dDayDark: {
    color: '#fff',
  },
  sectionDark: {
    backgroundColor: '#2d2d2d',
  },
  sectionTitleDark: {
    color: '#fff',
  },
  menuItemDark: {
    backgroundColor: '#3d3d3d',
  },
  menuTitleDark: {
    color: '#fff',
  },
  menuSubtitleDark: {
    color: '#aaa',
  },
  categoryItemDark: {
    backgroundColor: '#3d3d3d',
  },
  categoryNameDark: {
    color: '#fff',
  },
  noticeItemDark: {
    backgroundColor: '#3d3d3d',
  },
  noticeTitleDark: {
    color: '#fff',
  },
  noticeDateDark: {
    color: '#aaa',
  },
});