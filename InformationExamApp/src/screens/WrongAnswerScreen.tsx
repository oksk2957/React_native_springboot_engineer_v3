import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import type { WrongAnswer, ProblemType } from '../types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { statisticsService } from '../services/api';

type RootStackParamList = {
  Home: undefined;
  Problem: undefined;
  Wrong: undefined;
  Theory: undefined;
  Stats: undefined;
};

type WrongAnswerScreenProps = {
  navigation: BottomTabNavigationProp<RootStackParamList, 'Wrong'>;
};

const problemTypes: { id: ProblemType | 'all'; name: string }[] = [
  { id: 'all', name: '전체' },
  { id: 'OBJECTIVE', name: '객관식' },
  { id: 'SUBJECTIVE', name: '주관식' },
  { id: 'PROGRAMMING_LANGUAGE', name: '프로그래밍' },
];

export default function WrongAnswerScreen({ navigation }: WrongAnswerScreenProps) {
  const { darkMode } = useAuthStore();
  const [selectedType, setSelectedType] = useState<ProblemType | 'all'>('all');
  const [wrongProblems, setWrongProblems] = useState<WrongAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = darkMode;

  useEffect(() => {
    fetchWrongAnswers();
  }, [selectedType]);

  const fetchWrongAnswers = async () => {
    setIsLoading(true);
    try {
      let data: WrongAnswer[];
      if (selectedType === 'all') {
        data = await statisticsService.getWrongAnswers();
      } else {
        data = await statisticsService.getWrongAnswersByType(selectedType);
      }
      setWrongProblems(data);
    } catch (error) {
      console.error('Failed to fetch wrong answers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = (wrongAnswer: WrongAnswer) => {
    // Navigate to problem screen with problem type and id
    navigation.navigate('Problem', { 
      problemId: wrongAnswer.referenceId,
      problemType: wrongAnswer.problemType 
    } as any);
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

  if (isLoading) {
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
          틀린 문제: {wrongProblems.length}개
        </Text>
      </View>

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
            {selectedType === 'all' ? '오답이 없습니다!' : `${getTypeLabel(selectedType as ProblemType)} 오답이 없습니다!`}
          </Text>
        </View>
      ) : (
        <FlatList
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
              </View>
              <Text style={[styles.problemQuestion, isDark && styles.problemQuestionDark]} numberOfLines={2}>
                {item.problemTitle}
              </Text>
              <View style={styles.answerContainer}>
                <Text style={[styles.answerLabel, isDark && styles.answerLabelDark]}>
                  내 답변:
                </Text>
                <Text style={[styles.wrongAnswer, isDark && styles.wrongAnswerDark]}>
                  {item.submittedAnswer}
                </Text>
              </View>
              <View style={styles.answerContainer}>
                <Text style={[styles.answerLabel, isDark && styles.answerLabelDark]}>
                  정답:
                </Text>
                <Text style={[styles.correctAnswer, isDark && styles.correctAnswerDark]}>
                  {item.correctAnswer}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a90e2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
  },
  categoryFilter: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#4a90e2',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  problemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
  },
  problemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  problemType: {
    fontSize: 12,
    color: '#4a90e2',
    fontWeight: 'bold',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  problemQuestion: {
    fontSize: 14,
    color: '#2d3748',
    marginBottom: 12,
    lineHeight: 20,
  },
  answerContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  answerLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  wrongAnswer: {
    fontSize: 12,
    color: '#e53e3e',
    flex: 1,
  },
  correctAnswer: {
    fontSize: 12,
    color: '#38a169',
    fontWeight: 'bold',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  // Dark mode styles
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  headerDark: {
    backgroundColor: '#2d2d2d',
  },
  titleDark: {
    color: '#fff',
  },
  subtitleDark: {
    color: '#aaa',
  },
  categoryFilterDark: {
    backgroundColor: '#2d2d2d',
  },
  categoryButtonDark: {
    backgroundColor: '#3d3d3d',
  },
  categoryTextDark: {
    color: '#aaa',
  },
  problemCardDark: {
    backgroundColor: '#3d3d3d',
  },
  problemTypeDark: {
    color: '#4a90e2',
    backgroundColor: '#2a3a5c',
  },
  problemQuestionDark: {
    color: '#fff',
  },
  emptyTextDark: {
    color: '#aaa',
  },
  answerLabelDark: {
    color: '#aaa',
  },
  wrongAnswerDark: {
    color: '#fc8181',
  },
  correctAnswerDark: {
    color: '#68d391',
  },
});