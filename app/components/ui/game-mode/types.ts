export interface GameStats {
  totalQuestions: number;
  completedQuestions: number;
  correctQuestions: number;
  timeSpent: number;
  timeTaken: number;
}

export interface GameProgressItem {
  id: string | number;
  isCompleted: boolean;
  isCorrect?: boolean;
  isCurrent?: boolean;
  label?: string;
  timeSpent?: number;
}
