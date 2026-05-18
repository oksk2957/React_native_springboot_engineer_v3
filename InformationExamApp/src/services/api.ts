import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Problem, Answer, Statistics, WrongAnswer, ProblemType } from '../types';

// 개발 환경에서 PC 브릿지 사용을 위한 URL 설정
const getApiBaseUrl = () => {
  if (__DEV__) {
    // 웹 환경에서는 로컬 서버 우선 접근
    if (Platform.OS === 'web') {
      return 'http://localhost:9001/api';
    }

    // 안드로이드/ios 환경에서는 PC IP 사용
    const PC_IP = '172.30.1.6';
    return `http://${PC_IP}:9001/api`;
  }

  return 'https://your-production-api.com/api';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS 관련 설정 (백엔드)와 일치)
});

// 요청 인터셉터: 모든 요청 시 토큰
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
    headers: config.headers,
    params: config.params,
    data: config.data,
  });

  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// 응답 인터셉터: 응답 로그
api.interceptors.response.use((response) => {
  console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
  return response;
}, (error) => {
  if (error.response) {
    // 서버가 2xx 외의 상태로 응답한 경우
    console.error('[API Response Error] Data:', error.response.data);
    console.error('[API Response Error] Status:', error.response.status);
    console.error('[API Response Error] Headers:', error.response.headers);
  } else if (error.request) {
    // 요청이 전송되었으나 응답을 받지 못한 경우 (CORS, 서버 다운 등)
    console.error('[API Network Error] No response received. Possible CORS or connection refused.', error.request);
  } else {
    // 요청 설정 중 에러 발생
    console.error('[API Config Error]', error.message);
  }
  return Promise.reject(error);
});

export const authService = {
  /**
   * Google 로그인 - 백엔드 응답 정규화
   *
   * 백엔드 응답: { success: true, data: { token, username, nickname, email, role, isAdmin, userId, ... } }
   * 프론트 정규화: { token, user: { id, email, nickname, username, role, isAdmin, ... } }
   */
  loginWithGoogle: async (idToken: string) => {
    try {
      console.log('Attempting Google login with API:', `${API_BASE_URL}/auth/google`);
      const response = await api.post('/auth/google', { idToken });

      // 백엔드 success/data 구조 정규화
      const responseBody = response.data;
      const authData =
        responseBody?.success === true && responseBody?.data
          ? responseBody.data
          : responseBody;

      if (!authData || !authData.token) {
        throw new Error('서버 응답에 JWT 토큰이 없습니다.');
      }

      // 프론트에서 기대하는 구조로 정규화
      const normalizedResponse = {
        token: authData.token,
        user: {
          id: authData.userId ?? authData.user?.id,
          email: authData.email ?? authData.user?.email ?? '',
          nickname: authData.nickname ?? authData.user?.nickname ?? '',
          username: authData.username ?? authData.user?.username ?? '',
          profileImage: authData.profileImage ?? authData.user?.profileImage,
          role: authData.role ?? authData.user?.role,
          isAdmin: authData.isAdmin ?? authData.user?.isAdmin ?? false,
          trialExpired: authData.trialExpired ?? false,
          requiresPayment: authData.requiresPayment ?? false,
          canAccessApp: authData.canAccessApp ?? true,
        },
        requiresNickname: authData.requiresNickname ?? false,
        isNewUser: authData.isNewUser ?? false,
        trialExpired: authData.trialExpired ?? false,
        requiresPayment: authData.requiresPayment ?? false,
        canAccessApp: authData.canAccessApp ?? true,
        paymentMessage: authData.paymentMessage ?? null,
      };

      if (!normalizedResponse.user.id || !normalizedResponse.user.email) {
        throw new Error('서버 응답에 사용자 정보가 없습니다.');
      }

      await AsyncStorage.setItem('authToken', normalizedResponse.token);
      return normalizedResponse;
    } catch (error: any) {
      console.error('Google Login API Error:', error.message);
      if (error.response) {
        console.error('Error Status:', error.response.status);
        console.error('Error Data:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Check CORS or Server status.');
      }
      await AsyncStorage.removeItem('authToken');
      throw error;
    }
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
    problemType: ProblemType = 'OBJECTIVE',
    sessionId?: number
  ): Promise<Answer> => {
    const response = await api.post('/answers/submit', {
      problemId,
      problemType,
      submittedAnswer,
      ...(sessionId != null ? { sessionId } : {}),
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

  /** 필드: 총 문제 ID 목록만 조회 (빠른 순회 UX용) */
  getTheoryProblemMeta: async (
    category: string
  ): Promise<{ total: number; ids: number[] }> => {
    const response = await api.get('/problems/theory/meta', { params: { category } });
    const rawIds = response.data.ids as unknown[];
    const ids = rawIds.map((id) => Number(id));
    return { total: Number(response.data.total) || ids.length, ids };
  },

  /**
   * 학습 화면: id 목록만 조회 후 problems/{id}로 개별 조회 (더 빠른 검색 가능)
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
  getStatistics: async (userId?: number | string): Promise<Statistics> => {
    const params =
      userId != null && userId !== ''
        ? { userId: typeof userId === 'string' ? userId : String(userId) }
        : undefined;
    const response = await api.get('/statistics', { params });
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

  getWrongAnswersByDate: async (date: string): Promise<WrongAnswer[]> => {
    const response = await api.get('/wrong-answers/by-date', {
      params: { date },
    });
    return response.data;
  },

  getWrongBookmarksByDate: async (date: string): Promise<WrongAnswer[]> => {
    const response = await api.get('/wrong-answers/bookmarks/by-date', {
      params: { date },
    });
    return response.data;
  },
};

export default api;
