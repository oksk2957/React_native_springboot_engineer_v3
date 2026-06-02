import { create } from 'zustand';

// DEBUG: [카테고리 중앙화] DB subject 테이블과 동기화된 카테고리 정의
// 원인: HomeScreen과 TheoryScreen이 각각 하드코딩된 카테고리를 사용하여 불일치 발생
// 해결: Zustand Store에서 카테고리를 중앙 관리하여 단일 소스(SSOT) 적용

export interface Category {
  id: string;
  name: string;        // DB subject.name과 일치
  icon: string;
  color: string;
  subjectId: number;   // DB subject.id 매핑
}

// DEBUG: [카테고리 중앙화] DB subject 테이블 기반 카테고리 상수
// DB 조회 결과: 7개 과목 (운영체제, 네트워크, 데이터베이스, 소프트웨어공학, 정보보안, 애플리케이션테스트, 프로그래밍언어)
export const CATEGORIES: Category[] = [
  { id: 'os', name: '운영체제', icon: '💻', color: '#4a90e2', subjectId: 1 },
  { id: 'network', name: '네트워크', icon: '🌐', color: '#48bb78', subjectId: 2 },
  { id: 'database', name: '데이터베이스', icon: '🗄️', color: '#f6ad55', subjectId: 3 },
  { id: 'software', name: '소프트웨어공학', icon: '📋', color: '#9f7aea', subjectId: 4 },
  { id: 'security', name: '정보보안', icon: '🔒', color: '#f56565', subjectId: 5 },
  { id: 'test', name: '애플리케이션테스트', icon: '🧪', color: '#ed64a6', subjectId: 6 },
  { id: 'programming', name: '프로그래밍언어', icon: '👨‍💻', color: '#667eea', subjectId: 7 },
];

// DEBUG: [카테고리 중앙화] 헬퍼 함수 - 카테고리 이름으로 조회
export const getCategoryByName = (name: string): Category | undefined =>
  CATEGORIES.find(c => c.name === name);

// DEBUG: [카테고리 중앙화] 헬퍼 함수 - 카테고리 ID로 조회
export const getCategoryById = (id: string): Category | undefined =>
  CATEGORIES.find(c => c.id === id);

// DEBUG: [카테고리 중앙화] 헬퍼 함수 - 모든 카테고리 이름 배열 반환
export const getCategoryNames = (): string[] =>
  CATEGORIES.map(c => c.name);

// DEBUG: [카테고리 중앙화] 헬퍼 함수 - 카테고리 아이콘 Record 반환 (TheoryScreen 호환)
export const getCategoryIcons = (): Record<string, string> =>
  Object.fromEntries(CATEGORIES.map(c => [c.name, c.icon]));

// DEBUG: [카테고리 중앙화] 헬퍼 함수 - 카테고리 색상 Record 반환 (TheoryScreen 호환)
export const getCategoryColors = (): Record<string, string> =>
  Object.fromEntries(CATEGORIES.map(c => [c.name, c.color]));

// DEBUG: [카테고리 중앙화] Zustand Store 인터페이스
interface CategoryState {
  categories: Category[];
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category | null) => void;
  getCategoryByName: (name: string) => Category | undefined;
  getCategoryById: (id: string) => Category | undefined;
}

// DEBUG: [카테고리 중앙화] Zustand Store 생성
export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: CATEGORIES,
  selectedCategory: null,

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  getCategoryByName: (name) =>
    get().categories.find(c => c.name === name),

  getCategoryById: (id) =>
    get().categories.find(c => c.id === id),
}));
