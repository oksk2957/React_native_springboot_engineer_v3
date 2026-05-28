import axios from 'axios';

// DEBUG: [OCI-Prod-2026-05-27] OCI 서버 IP 업데이트
// 원인: OCI 서버 IP 변경 (168.110.119.132 → 158.180.78.125)
// 해결: 환경변수로 OCI IP 관리, 하드코딩 제거
// OCI 서버 배포시 .env 파일에 REACT_APP_API_BASE_URL=http://158.180.78.125:9001/api 설정 필요
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:9001/api';

// DEBUG: API Base URL 로깅 (개발/배포 환경 확인용)
console.log('[API Config] Base URL:', API_BASE_URL);
console.log('[API Config] Environment:', process.env.NODE_ENV);

const api = axios.create({
  baseURL: API_BASE_URL,
});

// DEBUG: 요청/응답 인터셉터 추가 (디버깅용)
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      params: config.params,
    });
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error('[API Response Error] Status:', error.response.status);
      console.error('[API Response Error] Data:', error.response.data);
    } else if (error.request) {
      console.error('[API Network Error] No response received. Check server status and CORS settings.');
      console.error('[API Network Error] Request URL:', error.config?.url);
    } else {
      console.error('[API Config Error]', error.message);
    }
    return Promise.reject(error);
  }
);

export const subjectService = {
  getAllSubjects: () => api.get('/subjects'),
  getSubjectById: (id) => api.get(`/subjects/${id}`),
  createSubject: (subject) => api.post('/subjects', subject),
  updateSubject: (id, subject) => api.put(`/subjects/${id}`, subject),
  deleteSubject: (id) => api.delete(`/subjects/${id}`)
};

export const problemService = {
  getAllProblems: () => api.get('/problems'),
  getProblemById: (id) => api.get(`/problems/${id}`),
  getProblemsBySubject: (subjectId) => api.get(`/subjects/${subjectId}/problems`),
  createProblem: (problem) => api.post('/problems', problem),
  updateProblem: (id, problem) => api.put(`/problems/${id}`, problem),
  deleteProblem: (id) => api.delete(`/problems/${id}`)
};
