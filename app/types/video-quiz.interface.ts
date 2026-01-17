// Quiz types that can appear in videos
export type VideoQuizType = 'multiple_choice' | 'true_false' | 'short_answer' | 'drag_and_drop';

// Branching action types
export type BranchAction = 'continue' | 'jump_to_timestamp' | 'jump_to_video' | 'show_explanation' | 'repeat_segment';

// Branch condition types
export type BranchCondition = 'correct' | 'incorrect' | 'score_threshold' | 'custom';

// Video Quiz Interface
export interface VideoQuiz {
  id: string;
  videoId: string;
  timestamp: number; // When quiz appears (in seconds)
  type: VideoQuizType;
  question: string;
  options?: QuizOption[]; // For multiple choice
  correctAnswer: string | number | boolean;
  explanation?: string;
  points: number;
  required: boolean; // Must answer before continuing
  timeLimit?: number; // Optional time limit in seconds
  branching?: VideoBranch; // Branching configuration
  metadata?: {
    difficulty: 'easy' | 'medium' | 'hard';
    topic?: string;
    learningObjective?: string;
  };
}

// Quiz Option (for multiple choice)
export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string; // Shown when selected
  branchAction?: BranchAction;
  branchTarget?: number | string; // Timestamp or video ID
}

// Branching Configuration
export interface VideoBranch {
  defaultAction: BranchAction;
  defaultTarget?: number | string;
  branches: BranchRule[];
}

// Branch Rule
export interface BranchRule {
  condition: BranchCondition;
  value?: number | string; // For score_threshold or custom
  action: BranchAction;
  target: number | string; // Timestamp or video ID
  message?: string; // Feedback message
}

// Video Interaction Data
export interface VideoInteraction {
  id: string;
  videoId: string;
  userId: string;
  quizId: string;
  timestamp: number;
  response: any;
  isCorrect: boolean;
  timeSpent: number;
  score: number;
  createdAt: Date;
}

// Video Session (tracks branching path)
export interface VideoSession {
  id: string;
  videoId: string;
  userId: string;
  currentPath: string[]; // Array of branch IDs taken
  interactions: VideoInteraction[];
  totalScore: number;
  completionPercentage: number;
  startedAt: Date;
  lastUpdatedAt: Date;
}

// Branch Result
export interface BranchResult {
  action: BranchAction;
  target: number | string;
  message?: string;
  branchId?: string;
}

// Quiz Result
export interface QuizResult {
  quizId: string;
  isCorrect: boolean;
  score: number;
  response: any;
  timeSpent: number;
}

// Extended video interface
import type { Videos } from './video.iunterface';

export interface InteractiveVideo extends Videos {
  quizzes?: VideoQuiz[];
  branches?: VideoBranch[];
  defaultPath?: number[]; // Default timestamp sequence
  metadata?: {
    hasQuizzes: boolean;
    hasBranching: boolean;
    estimatedDuration: number; // Varies based on path
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
}

