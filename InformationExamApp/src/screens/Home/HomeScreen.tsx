import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore, CATEGORIES, Category } from '../../stores/categoryStore';
import { Card, ProgressBar } from '../../components';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

// DEBUG: [카테고리 중앙화] 하드코딩 제거 - useCategoryStore에서 가져옴
// 원인: HomeScreen과 TheoryScreen의 카테고리 불일치
// 해결: categoryStore의 CATEGORIES를 import하여 사용

type RootStackParamList = {
  Home: undefined;
  Problem: { categoryId?: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const examDate = new Date('2026-06-14');

// DEBUG: [카테고리 중앙화] sampleProblemCount도 CATEGORIES 기반으로 동적 생성
const sampleProblemCount: Record<string, number> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, 3])
);

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  // DEBUG: [탭 전환 카테고리 유지] categoryStore에서 setSelectedCategory 가져옴
  const { setSelectedCategory } = useCategoryStore();
  
  const todayStats = {
    solved: 15,
    correct: 12,
    progress: 0.65,
  };
  
  const getDaysUntilExam = () => {
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const daysUntilExam = getDaysUntilExam();
  
  const handleCategoryPress = (categoryId: string) => {
    // DEBUG: [과목 동기화] 과목 클릭 시 category 이름을 파라미터로 직접 전달
    // 원인: Zustand Store 방식에서 타이밍 문제 발생
    // 해결: Navigation 파라미터로 직접 전달하여 TheoryScreen에서 즉시 반영
    const selectedCat = CATEGORIES.find(c => c.id === categoryId);
    if (selectedCat) {
      console.log('[HomeScreen] 과목 선택:', selectedCat.name, '→ Theory 탭 이동');
      navigation.navigate('Theory' as never, { category: selectedCat.name } as never);
    }
  };
  
  const recentActivities = [
    { id: 1, text: '소프트웨어 설계를 학습했습니다', time: '10분 전', correct: true },
    { id: 2, text: '데이터베이스 문제를 풀었습니다', time: '1시간 전', correct: true },
    { id: 3, text: '정보보안을 복습했습니다', time: '2시간 전', correct: false },
  ];
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>안녕하세요</Text>
            <Text style={styles.userName}>{user?.nickname || '학습자'}님 👋</Text>
          </View>
          <View style={styles.examCountdown}>
            <Text style={styles.examCountdownLabel}>D-{daysUntilExam}</Text>
            <Text style={styles.examDateText}>
              {examDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>
        
        {/* Progress Card */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>오늘의 학습</Text>
            <TouchableOpacity>
              <Text style={styles.progressMore}>자세히</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContent}>
            <View style={styles.progressStats}>
              <View style={styles.progressStatItem}>
                <Text style={styles.progressStatNumber}>{todayStats.solved}</Text>
                <Text style={styles.progressStatLabel}>푼 문제</Text>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatNumber, { color: colors.success }]}>
                  {todayStats.correct}
                </Text>
                <Text style={styles.progressStatLabel}>정답</Text>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStatItem}>
                <Text style={[styles.progressStatNumber, { color: colors.error }]}>
                  {todayStats.solved - todayStats.correct}
                </Text>
                <Text style={styles.progressStatLabel}>오답</Text>
              </View>
            </View>
            
            <View style={styles.progressBarContainer}>
              <ProgressBar
                progress={todayStats.progress}
                showLabel
                height={8}
                color={colors.primary}
              />
            </View>
          </View>
        </Card>
        
        {/* Category Selection */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>📚 대과목 선택</Text>
          <Text style={styles.sectionSubtitle}>학습할 과목을 선택하세요</Text>
          
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryItem, { borderLeftColor: category.color }]}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{sampleProblemCount[category.id]}문제</Text>
                </View>
                <Text style={styles.categoryArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Quick Menu */}
        <View style={styles.quickMenuSection}>
          <Text style={styles.sectionTitle}>⚡ 빠른 메뉴</Text>
          <View style={styles.quickMenuGrid}>
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => navigation.navigate('Problem', {})}
              activeOpacity={0.7}
            >
              <View style={[styles.quickMenuIcon, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.quickMenuEmoji}>📝</Text>
              </View>
              <Text style={styles.quickMenuTitle}>오늘의 퀴즈</Text>
              <Text style={styles.quickMenuSubtitle}>전체 문제 풀기</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => navigation.navigate('Wrong' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickMenuIcon, { backgroundColor: colors.error + '20' }]}>
                <Text style={styles.quickMenuEmoji}>📋</Text>
              </View>
              <Text style={styles.quickMenuTitle}>오답 복습</Text>
              <Text style={styles.quickMenuSubtitle}>복습하기</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => navigation.navigate('Theory' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickMenuIcon, { backgroundColor: colors.secondary + '20' }]}>
                <Text style={styles.quickMenuEmoji}>📚</Text>
              </View>
              <Text style={styles.quickMenuTitle}>이론 학습</Text>
              <Text style={styles.quickMenuSubtitle}>플래시 카드</Text>
            </TouchableOpacity>

            {/* DEBUG: [UX-개선] 실기 주관식 랜덤 학습 → 이론 탭으로 이동 */}
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => {
                console.log('[Navigation] 실기 주관식 랜덤 학습 → TheoryTab 이동');
                navigation.navigate('Theory' as never);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.quickMenuIcon, { backgroundColor: '#FF9500' + '20' }]}>
                <Text style={styles.quickMenuEmoji}>✍️</Text>
              </View>
              <Text style={styles.quickMenuTitle}>실기 주관식</Text>
              <Text style={styles.quickMenuSubtitle}>랜덤 학습</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickMenuItem}
              onPress={() => navigation.navigate('Statistics' as never)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickMenuIcon, { backgroundColor: colors.accent + '20' }]}>
                <Text style={styles.quickMenuEmoji}>📊</Text>
              </View>
              <Text style={styles.quickMenuTitle}>학습 통계</Text>
              <Text style={styles.quickMenuSubtitle}>확인하기</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>최근 활동</Text>
            <TouchableOpacity>
              <Text style={styles.activityMore}>전체 보기</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[
                styles.activityIcon,
                activity.correct ? styles.activityIconCorrect : styles.activityIconWrong
              ]}>
                <Text>{activity.correct ? '✓' : '✗'}</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  welcomeText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  examCountdown: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  examCountdownLabel: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  examDateText: {
    ...typography.caption,
    color: colors.primary,
  },
  progressCard: {
    marginBottom: spacing.base,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  progressMore: {
    ...typography.button,
    color: colors.primary,
  },
  progressContent: {},
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.base,
  },
  progressStatItem: {
    alignItems: 'center',
  },
  progressStatNumber: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  progressStatLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  progressStatDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  progressBarContainer: {
    marginTop: spacing.sm,
  },
  categorySection: {
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.base,
  },
  categoryGrid: {
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...typography.button,
    color: colors.textPrimary,
  },
  categoryCount: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  categoryArrow: {
    ...typography.body,
    color: colors.textTertiary,
  },
  quickMenuSection: {
    marginBottom: spacing.base,
  },
  quickMenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickMenuItem: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
  },
  quickMenuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickMenuEmoji: {
    fontSize: 20,
  },
  quickMenuTitle: {
    ...typography.button,
    color: colors.textPrimary,
  },
  quickMenuSubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  activityCard: {
    marginBottom: spacing.base,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activityMore: {
    ...typography.button,
    color: colors.primary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  activityIconCorrect: {
    backgroundColor: colors.success + '20',
  },
  activityIconWrong: {
    backgroundColor: colors.error + '20',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  activityTime: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
