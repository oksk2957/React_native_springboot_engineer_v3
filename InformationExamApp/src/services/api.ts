import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Problem, Answer, Statistics, WrongAnswer, ProblemType } from '../types';

// 개발 환경에서 PC 서버에 연결하기 위한 URL 설정
const getApiBaseUrl = () => {
  if (__DEV__) {
    // 1. 웹 브라우저(Web)에서 테스트하는 경우
    if (Platform.OS === 'web') {
      return 'http://localhost:8088/api';
    }

    // 2. 모바일(Android/iOS) 실제 기기 또는 에뮬레이터에서 테스트하는 경우
    // PC의 실제 로컬 IP 주소를 입력하세요 (Windows cmd에서 'ipconfig'로 확인 가능)
    const PC_IP = '172.30.1.6';

    return `http://${PC_IP}:8088/api`;
  }
  // 프로덕션 URL
  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  loginWithGoogle: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },
  setNickname: async (nickname: string) => {
    const response = await api.post('/users/nickname', { nickname });
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('authToken');
  },
};

export const problemService = {
  getProblems: async (category?: string, type?: string, limit?: number) => {
    const params: Record<string, string | number> = {};
    if (category) params.category = category;
    if (type) params.type = type;
    if (limit != null) params.limit = limit;
    console.log('API Request: /problems with params:', params);
    const response = await api.get('/problems', { params });
    console.log('API Response: /problems', response.data.length, 'items');
    return response.data;
  },
  getProblem: async (id: number) => {
    const response = await api.get(`/problems/${id}`);
    return response.data;
  },
  getRandomProblems: async (limit: number = 10): Promise<Problem[]> => {
    const response = await api.get('/problems/random', { params: { limit } });
    return response.data;
  },
  getOneRandomProblemPerSubject: async (): Promise<Problem[]> => {
    const response = await api.get('/problems/random/objective');
    return response.data;
  },
  submitAnswer: async (
    problemId: number, 
    submittedAnswer: string, 
    problemType: ProblemType = 'OBJECTIVE'
  ): Promise<Answer> => {
    const response = await api.post('/answers/submit', {
      problemId,
      problemType,
      submittedAnswer,
    });
    return response.data;
  },
  getTheoryProblems: async (category: string): Promise<Problem[]> => {
    try {
      console.log(`Fetching theory problems for category: ${category}`);
      const response = await api.get('/problems/theory', { params: { category } });
      console.log(`Successfully fetched ${response.data.length} problems for ${category}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch theory problems for ${category}:`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  },
  /** 이론: 총 개수와 ID 목록만 (단건 조회 UX용) */
  getTheoryProblemMeta: async (
    category: string
  ): Promise<{ total: number; ids: number[] }> => {
    const response = await api.get('/problems/theory/meta', { params: { category } });
    const rawIds = response.data.ids as unknown[];
    const ids = rawIds.map((id) => Number(id));
    return { total: Number(response.data.total) || ids.length, ids };
  },
  /**
   * 학습 화면: id 목록만 조회 후 problems/{id}로 순차 조회 (매 클릭마다 서버 검색 가능)
   */
  getStudyProblemMeta: async (params: {
    randomSample?: boolean;
    category?: string;
    type?: string;
    difficulty?: number;
    excludeCategories?: string[];
    limit?: number;
  }): Promise<{ total: number; ids: number[] }> => {
    const qp: Record<string, string | number | boolean> = {};
    if (params.randomSample) qp.randomSample = true;
    if (params.category) qp.category = params.category;
    if (params.type) qp.type = params.type;
    if (params.difficulty != null) qp.difficulty = params.difficulty;
    if (params.excludeCategories && params.excludeCategories.length > 0) {
      qp.excludeCategories = params.excludeCategories.join(',');
    }
    if (params.limit != null) qp.limit = params.limit;
    const response = await api.get('/problems/study/meta', { params: qp });
    const rawIds = response.data.ids as unknown[];
    const ids = rawIds.map((id) => Number(id));
    return { total: Number(response.data.total) || ids.length, ids };
  },
  /**
   * 주관식 문제 조회
   */
  getSubjectiveProblems: async (params?: {
    subjectId?: number;
    limit?: number;
  }): Promise<Problem[]> => {
    const qp: Record<string, string | number> = {};
    if (params?.subjectId) qp.subjectId = params.subjectId;
    if (params?.limit) qp.limit = params.limit;
    const response = await api.get('/problems/subjective', { params: qp });
    return response.data;
  },
  /**
   * 프로그래밍 문제 조회
   */
  getProgrammingProblems: async (params?: {
    subjectId?: number;
    language?: string;
    limit?: number;
  }): Promise<Problem[]> => {
    const qp: Record<string, string | number> = {};
    if (params?.subjectId) qp.subjectId = params.subjectId;
    if (params?.language) qp.language = params.language;
    if (params?.limit) qp.limit = params.limit;
    const response = await api.get('/problems/programming', { params: qp });
    return response.data;
  },
};

export const statisticsService = {
  getStatistics: async (): Promise<Statistics> => {
    const response = await api.get('/statistics');
    return response.data;
  },
  getSubjectiveCount: async (): Promise<number> => {
    const response = await api.get('/statistics/subjective-count');
    return response.data.count;
  },
  getWrongAnswers: async (): Promise<WrongAnswer[]> => {
    const response = await api.get('/wrong-answers');
    return response.data;
  },
  getWrongAnswersByType: async (problemType: ProblemType): Promise<WrongAnswer[]> => {
    const response = await api.get(`/wrong-answers/${problemType}`);
    return response.data;
  },
};

export default api;