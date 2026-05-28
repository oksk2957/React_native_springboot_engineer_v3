import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Problem, Answer, Statistics, WrongAnswer, ProblemType } from '../types';

// DEBUG: [B-2026-05-28] API URL 동적 설정
// 원인: 하드코딩된 IP로 인해 개발/스테이징/프로덕션 환경 전환이 어려움
// 해결: 환경변수를 통한 동적 URL 설정 + Platform별 자동 감지
// 사용법: .env 파일에서 EXPO_PUBLIC_API_HOST, EXPO_PUBLIC_API_PORT 설정
const getApiBaseUrl = () => {
  // DEBUG: [B-2026-05-28] 환경변수에서 API 호스트/포트 가져오기
  const envHost = process.env.EXPO_PUBLIC_API_HOST;
  const envPort = process.env.EXPO_PUBLIC_API_PORT;

  // DEBUG: [B-2026-05-28] Platform별 기본값 설정
  // Android 에뮬레이터: 10.0.2.2 (호스트 머신의 localhost)
  // iOS 에뮬레이터: localhost
  // 실제 기기: 환경변수 또는 OCI 서버 IP
  let host: string;
  let port: string;

  if (envHost && envPort) {
    // 환경변수가 설정된 경우 우선 사용
    host = envHost;
    port = envPort;
    console.log('[API Config] Using env vars:', { host, port });
  } else if (Platform.OS === 'android' && !envHost) {
    // Android 에뮬레이터 기본값
    host = '10.0.2.2';
    port = '9001';
    console.log('[API Config] Android emulator detected, using 10.0.2.2');
  } else if (Platform.OS === 'ios' && !envHost) {
    // iOS 에뮬레이터 기본값
    host = 'localhost';
    port = '9001';
    console.log('[API Config] iOS emulator detected, using localhost');
  } else {
    // 기본값: OCI 서버 IP
    host = '158.180.78.125';
    port = '9001';
    console.log('[API Config] Using default OCI server IP');
  }

  // DEBUG: 현재 환경 로깅
  console.log('[API Config] __DEV__:', __DEV__);
  console.log('[API Config] Platform:', Platform.OS);
  console.log('[API Config] Host:', host);
  console.log('[API Config] Port:', port);

  const apiUrl = `http://${host}:${port}/api`;
  console.log('[API Config] Using API URL:', apiUrl);
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

// DEBUG: [API-2026-05-28] Axios 인스턴스 설정 개선
// 원인: CORS preflight 실패 및 연결 문제
// 해결: withCredentials 제거, timeout 추가, headers 개선
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초 타임아웃 설정
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // DEBUG: withCredentials 제거 - CORS preflight 문제 해결
  // 원인: withCredentials: true로 인해 CORS preflight 실패
  // 해결: withCredentials 제거하여 simple request로 변경
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
      // DEBUG: [Supabase-OAuth-2026-05-27] Supabase access_token으로 로그인
      // 원인: Google ID Token → Supabase access_token으로 변경
      // 해결: Supabase JWT를 백엔드로 전달하여 검증
      console.log('[API Auth] Supabase access_token으로 로그인 시도:', `${API_BASE_URL}/auth/google`);
      const response = await api.post('/auth/google', { idToken });

      // DEBUG: [Supabase-OAuth-2026-05-27] 백엔드 응답 구조 정규화
      // 원인: Supabase JWT 검증 후 백엔드 JWT 발급
      // 해결: success/data 구조 유지하며 정규화
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

      // DEBUG: [JWT-2026-05-28] 토큰 저장 및 확인
      // 원인: 토큰 저장 후 즉시 확인하지 않아 저장 실패 파악 어려움
      // 해결: 저장 후 즉시 확인 로그 추가
      await AsyncStorage.setItem('authToken', normalizedResponse.token);
      const savedToken = await AsyncStorage.getItem('authToken');
      console.log('[API Auth] 토큰 저장 확인:', savedToken ? '성공' : '실패');
      
      // DEBUG: [JWT-2026-05-28] 토큰 만료 시간 저장 (12시간 후)
      const tokenExpiryTime = Date.now() + (12 * 60 * 60 * 1000); // 12시간 후
      await AsyncStorage.setItem('tokenExpiryTime', tokenExpiryTime.toString());
      console.log('[API Auth] 토큰 만료 시간 저장:', new Date(tokenExpiryTime).toLocaleString());
      
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
    await AsyncStorage.removeItem('tokenExpiryTime'); // DEBUG: [JWT-2026-05-28] 토큰 만료 시간 삭제
  },

  // DEBUG: [JWT-2026-05-28] 토큰 갱신 API 호출
  // 원인: 12시간 유효기간 만료 전 자동 갱신을 위해 토큰 재발급 필요
  // 해결: 백엔드 /auth/refresh 엔드포인트 호출하여 새로운 토큰 발급
  refreshToken: async (currentToken: string) => {
    try {
      console.log('[API Auth] 토큰 갱신 시도');
      const response = await api.post('/auth/refresh', { token: currentToken });
      
      if (response.data && response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        const tokenExpiryTime = Date.now() + (12 * 60 * 60 * 1000); // 12시간 후
        await AsyncStorage.setItem('tokenExpiryTime', tokenExpiryTime.toString());
        console.log('[API Auth] 토큰 갱신 완료 - 새로운 만료 시간:', new Date(tokenExpiryTime).toLocaleString());
        return response.data;
      }
      throw new Error('토큰 갱신 응답에 토큰이 없습니다.');
    } catch (error: any) {
      console.error('[API Auth] 토큰 갱신 실패:', error.message);
      throw error;
    }
  },

  // DEBUG: [API-2026-05-28] 백엔드 연결 테스트
  // 원인: /health 엔드포인트 부재로 인한 연결 테스트 실패
  // 해결: /health 엔드포인트 사용 (백엔드에 HealthController 추가됨)
  testConnection: async () => {
    try {
      console.log('[API] 백엔드 연결 테스트');
      const response = await api.get('/health');
      console.log('[API] 백엔드 연결 성공:', response.data);
      return true;
    } catch (error: any) {
      // 404는 엔드포인트가 없는 것, 그 외는 네트워크 오류
      if (error.response && error.response.status === 404) {
        console.error('[API] 백엔드 연결 실패: /health 엔드포인트 없음 (404)');
      } else if (error.request) {
        console.error('[API] 백엔드 연결 실패: 네트워크 오류 (CORS 또는 서버 다운)');
      } else {
        console.error('[API] 백엔드 연결 실패:', error.message);
      }
      return false;
    }
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
