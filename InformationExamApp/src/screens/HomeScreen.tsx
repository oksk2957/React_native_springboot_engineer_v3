import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { useNavigation } from '@react-navigation/native';
import { statisticsService } from '../services/api';
import { SAMPLE_PROBLEMS as problemsData } from '../data/problems';

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
  const navigation = useNavigation();
  const { user, darkMode } = useAuthStore();
  const [subjectiveCount, setSubjectiveCount] = useState<number>(0);
  const totalObjectiveCount = problemsData.length;
  
  const today = new Date();
  const todayDate = today.getDate();
  const weekNumber = Math.ceil(todayDate / 7);
  const currentMonth = today.getMonth() + 1;
  const studyRecord = Array.from({ length: 30 }, (_, i) => i + 1 <= todayDate);

  const isDark = darkMode;

  useEffect(() => {
    const fetchSubjectiveCount = async () => {
      try {
        const count = await statisticsService.getSubjectiveCount();
        setSubjectiveCount(count);
      } catch (error) {
        console.error('Failed to fetch subjective count:', error);
      }
    };
    fetchSubjectiveCount();
  }, []);

  const menuItems = [
    {
      title: '실기 주관식 랜덤 학습',
      subtitle: `잔여 주관식: ${subjectiveCount}문제`,
      icon: '📝',
      onPress: () => navigation.navigate('Problem', { mode: 'subjective' }),
    },
    {
      title: '이어서 풀기',
      subtitle: '지난 문제부터',
      icon: '▶️',
      onPress: () => navigation.navigate('Problem'),
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
      onPress: () => navigation.navigate('Problem', { mode: 'random' }),
    },
  ];

  return (
    <ScrollView style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.greeting, isDark && styles.greetingDark]}>
          안녕하세요, {user?.nickname || '사용자'}님! 합격을 기원합니다🎉
        </Text>
        <Text style={[styles.dDay, isDark && styles.dDayDark]}>
          {currentMonth}월 {weekNumber}번째 주
        </Text>
      </View>

      <View style={[styles.grassSection, isDark && styles.sectionDark]}>
        <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
          {new Date().getMonth() + 1}월 학습 기록
        </Text>
        <View style={styles.grassGrid}>
          {studyRecord.map((done, index) => (
            <View
              key={index}
              style={[
                styles.grassBlock,
                done && styles.grassActive,
              ]}
            />
          ))}
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
    padding: 20,
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
  grassGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  grassBlock: {
    width: 14,
    height: 14,
    backgroundColor: '#ebedf0',
    borderRadius: 2,
    marginRight: 3,
    marginBottom: 3,
  },
  grassActive: {
    backgroundColor: '#48bb78',
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