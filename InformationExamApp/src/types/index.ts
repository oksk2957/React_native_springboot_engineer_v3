export interface User {
  id: number;
  email: string;
  nickname: string;
  profileImage?: string;
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

export interface WrongAnswer {
  id: number;
  problemType: ProblemType;
  referenceId: number;
  problemTitle: string;
  submittedAnswer: string;
  correctAnswer: string;
  submittedAt: string;
}
