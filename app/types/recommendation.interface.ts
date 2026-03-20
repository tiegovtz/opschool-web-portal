export type RecommendationAction =
  | "start_topic"
  | "rewatch_video"
  | "review_notes"
  | "practice_quiz";

export type RecommendationReasonCode =
  | "not_started"
  | "low_progress"
  | "low_assessment"
  | "started_not_finished"
  | "needs_practice";

export type TopicLearningStatus =
  | "covered"
  | "in_progress"
  | "opened_only"
  | "not_started";

export type TopicAssessmentStatus = "passed" | "failed" | "not_attempted";

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

export interface TopicLearningAnalysis {
  topicId: string;
  topicName: string;
  subjectName: string;
  levelName: string | null;
  revisitPath: string;
  isViewed: boolean;
  progressPercent: number;
  topicStatus: TopicLearningStatus;
  assessmentStatus: TopicAssessmentStatus;
  assessmentScore: number | null;
  assessmentAttempts: number;
  passedAssessments: number;
  failedAssessments: number;
  totalChapters: number;
  completedChapters: number;
}

export interface SubjectLearningAnalysis {
  subjectName: string;
  levelName: string | null;
  totalTopics: number;
  coveredTopics: number;
  inProgressTopics: number;
  openedTopics: number;
  notStartedTopics: number;
  averageProgress: number;
  assessmentAttempts: number;
  passedTopics: number;
  failedTopics: number;
  topics: TopicLearningAnalysis[];
}

export interface LearnerAnalysisOverview {
  totalSubjects: number;
  subjectsOpened: number;
  totalTopics: number;
  coveredTopics: number;
  inProgressTopics: number;
  openedTopics: number;
  notStartedTopics: number;
  averageProgress: number;
  averageAssessmentScore: number | null;
  totalAssessmentAttempts: number;
  passedTopics: number;
  failedTopics: number;
}

export interface PersonalizedRecommendationsResponse {
  generatedAt: string;
  summary: string;
  overview: LearnerAnalysisOverview;
  subjectBreakdown: SubjectLearningAnalysis[];
  topicBreakdown: TopicLearningAnalysis[];
  recommendations: PersonalizedRecommendation[];
}
