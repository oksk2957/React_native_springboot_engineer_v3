export interface TheoryCard {
  id: number;
  cardType: 'FLASHCARD' | 'SUBJECTIVE';
  frontText: string;
  backText: string;
  explanation?: string;
  category: string;
}
