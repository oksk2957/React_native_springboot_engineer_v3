import api from '../services/api';
import { TheoryCard } from '../types/theory';

// DEBUG: [2026-06-07] 하드코딩된 OCI IP 제거
// 원인: 이론 API만 별도로 하드코딩된 IP를 사용하여 CORS/네트워크 오류 발생
// 해결: api.ts의 axios 인스턴스를 공유받아 사용 (인터셉터, 타임아웃, baseURL 일관성)

export const fetchTheoryCards = async (category: string): Promise<TheoryCard[]> => {
  try {
    const response = await api.get('/problems/theory', { params: { category } });
    return Array.isArray(response.data) ? (response.data as TheoryCard[]) : [];
  } catch (error) {
    console.error('[TheoryAPI] 이론 카드 조회 실패:', error);
    throw error;
  }
};

// DEBUG: [2026-06-09] 수정계획안14 - 프로그래밍 언어별 카드 조회
export const fetchProgrammingCards = async (language: string): Promise<TheoryCard[]> => {
  try {
    const response = await api.get('/problems/programming-theory', { params: { language } });
    return Array.isArray(response.data) ? (response.data as TheoryCard[]) : [];
  } catch (error) {
    console.error('[TheoryAPI] 프로그래밍 카드 조회 실패:', error);
    throw error;
  }
};
