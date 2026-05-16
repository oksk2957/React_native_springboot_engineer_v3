export type UserRole = 'admin' | 'free_user' | 'money_user';

export interface User {
  id: number | string;
  email: string;
  nickname: string;
  username?: string;
  profileImage?: string;
  role?: UserRole;
  isAdmin?: boolean;
  trialExpired?: boolean;
  requiresPayment?: boolean;
  canAccessApp?: boolean;
}

/**
 * 백엔드 /auth/google API를 프론트에서 정규화한 응답 타입
 */
export interface AuthLoginResponse {
  token: string;
  user: User;
  requiresNickname?: boolean;
  isNewUser?: boolean;
  trialExpired?: boolean;
  requiresPayment?: boolean;
  canAccessApp?: boolean;
  paymentMessage?: string | null;
}

export type ProblemType = 'OBJECTIVE' | 'SUBJECTIVE' | 'PROGRAMMING_LANGUAGE';

export interface Problem {
  id: number;
  question: string;
  options?: {
    [key: string]: string;
  };
  correctAnswer: string;
  explanation: string;
  category: string;
  type: ProblemType;
  isAiGenerated: boolean;
  year?: number;
}

export interface TheoryCardDto {
  id: number;
  subjectId: number;
  cardType: 'SUBJECTIVE' | 'FLASHCARD';
  frontText: string;
  backText: string;
  explanation?: string;
  difficulty?: number;
}

export interface SubjectiveProblem {
  id: number;
  question: string;
  answer: string;
  explanation?: string;
  difficulty: number;
  subjectId: number;
  isAiGenerated: boolean;
}

export interface ProgrammingProblem {
  id: number;
  question: string;
  answer: string;
  explanation?: string;
  programmingLanguage: string;
  difficulty?: number;
  subjectId?: number;
  isAiGenerated: boolean;
}

export interface Answer {
  problemId: number;
  problemType: ProblemType;
  submittedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export interface Statistics {
  totalProblems: number;
  solvedProblems: number;
  correctCount: number;
  wrongCount: number;
  accuracyRate?: number;
  userId?: number;
  studyHeatmap?: StudyHeatmapCell[];
  branchPerformance?: BranchPerformanceRow[];
  branchStats?: {
    problemType: ProblemType;
    totalProblems: number;
    solvedProblems: number;
    correctCount: number;
    accuracyRate: number;
  }[];
  categoryStats: {
    category: string;
    total: number;
    correct: number;
    accuracyRate?: number;
  }[];
}

export interface StudyHeatmapCell {
  date: string;
  count: number;
  level: number;
}

export interface CalendarDayCell extends StudyHeatmapCell {
  day: number;
  isCurrentMonth: boolean;
}

export interface BranchPerformanceRow {
  branch: ProblemType | string;
  attempted: number;
  wrong: number;
  numerator: number;
  poolTotal: number;
  achievementRate: number;
}

export interface WrongAnswer {
  id: number;
  problemType: ProblemType;
  referenceId: number;
  problemTitle: string;
  submittedAnswer: string;
  correctAnswer: string;
  submittedAt: string;
}
