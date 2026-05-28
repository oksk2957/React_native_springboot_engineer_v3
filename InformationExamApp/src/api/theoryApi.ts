import { TheoryCard } from '../types/theory';

// DEBUG: [OCI-Prod-2026-05-27] OCI 서버 IP 업데이트
// 원인: OCI 서버 IP 변경 (168.110.119.132 → 158.180.78.125)
// 해결: 환경변수로 OCI IP 관리, 하드코딩 제거
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://158.180.78.125:9001';

// DEBUG: API Base URL 로깅 (개발/배포 환경 확인용)
console.log('[TheoryAPI] Base URL:', API_BASE_URL);
console.log('[TheoryAPI] Environment:', process.env.NODE_ENV);

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
