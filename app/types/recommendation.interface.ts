export type RecommendationAction =
  | "rewatch_video"
  | "review_notes"
  | "practice_quiz";

export type RecommendationReasonCode =
  | "low_progress"
  | "low_assessment"
  | "started_not_finished"
  | "needs_practice";

export interface PersonalizedRecommendation {
  topicId: string;
  topicName: string;
  subjectName: string;
  levelName: string | null;
  revisitPath: string;
  progressPercent: number;
  assessmentScore: number | null;
  priorityScore: number;
  recommendedAction: RecommendationAction;
  reasonCodes: RecommendationReasonCode[];
  explanation: string;
  attainmentFocus: string;
  seedPrompt: string;
}

export interface PersonalizedRecommendationsResponse {
  generatedAt: string;
  summary: string;
  recommendations: PersonalizedRecommendation[];
}
