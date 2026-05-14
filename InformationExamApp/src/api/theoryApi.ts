import { TheoryCard } from '../types/theory';

// Expo 프로젝트 환경 변수에서 API 기본 URL을 가져오며, 없을 경우 기본값 사용
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:9001';

export const fetchTheoryCards = async (category: string): Promise<TheoryCard[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/problems/theory?category=${encodeURIComponent(category)}`);

    if (!response.ok) {
      throw new Error(`이론 카드 불러오기 실패: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as TheoryCard[]) : [];
  } catch (error) {
    console.error('이론 카드 조회 중 오류 발생:', error);
    throw error;
  }
};
