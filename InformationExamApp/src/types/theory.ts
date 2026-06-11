export interface TheoryCard {
  id: number;
  cardType: 'FLASHCARD' | 'SUBJECTIVE';
  frontText: string;
  backText: string;
  explanation?: string;
  category: string;
  // DEBUG: [주관식 보기] 주관식 퀴즈를 5개 보기 중 선택하는 형태로 변경
  // 원인: 사용자가 TextInput 대신 5개 보기 버튼 형태로 변경 요청
  // 해결: options 필드 추가하여 프론트엔드에 보기 데이터 전달
  options?: string[]; // 주관식 문제의 보기 목록 (최대 5개)

  // DEBUG: [수정52 2026-06-11] 실제 시험지 스타일 상세 지문 (2~3줄 + 빈칸)
  // questionText가 있으면 상세 지문 표시, 없으면 frontText fallback
  questionText?: string;
}
