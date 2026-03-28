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
export type RecommendationSnapshotStatus = "active" | "superseded" | "archived";
export type RecommendationOutcomeStatus =
  | "not_started"
  | "in_progress"
  | "improved"
  | "resolved"
  | "regressed";

export interface RecommendationBaselineMetrics {
  progressPercent: number;
  assessmentScore: number | null;
  assessmentAttempts: number;
  topicStatus: TopicLearningStatus | string;
  assessmentStatus: TopicAssessmentStatus | string;
  totalChapters: number;
  completedChapters: number;
}

export interface PersonalizedRecommendation {
  recommendationId?: string;
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
  baseline?: RecommendationBaselineMetrics;
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

export interface TalkToDataResponse {
  generatedAt: string;
  question: string;
  answer: string;
}

export interface RecommendationSnapshotPayload
  extends PersonalizedRecommendationsResponse {}

export interface RecommendationSnapshotCreateResponse {
  snapshotId: string;
  generatedAt: string;
  status: RecommendationSnapshotStatus;
}

export interface RecommendationSnapshot
  extends RecommendationSnapshotPayload,
    RecommendationSnapshotCreateResponse {}

export interface RecommendationComparisonMetricGroup {
  averageProgress?: number;
  averageAssessmentScore?: number | null;
  totalAssessmentAttempts?: number;
  coveredTopics?: number;
  failedTopics?: number;
}

export interface RecommendationComparisonTopicMetric {
  progressPercent: number;
  assessmentScore: number | null;
  assessmentAttempts: number;
}

export interface RecommendationComparisonTopic {
  topicId: string;
  topicName: string;
  recommendedAction: RecommendationAction;
  status: RecommendationOutcomeStatus;
  before: RecommendationComparisonTopicMetric;
  after: RecommendationComparisonTopicMetric;
  delta: RecommendationComparisonTopicMetric;
  quizSummarySinceSnapshot?: {
    attemptCount: number;
    correctCount: number;
    incorrectCount: number;
  };
}

export interface RecommendationSnapshotComparisonResponse {
  snapshotId: string;
  generatedAt: string;
  comparedAt: string;
  overview: {
    before: RecommendationComparisonMetricGroup;
    after: RecommendationComparisonMetricGroup;
    delta: RecommendationComparisonMetricGroup;
  };
  topics: RecommendationComparisonTopic[];
}

export interface RecommendationProgressSummaryResponse {
  activeSnapshotId: string | null;
  totalRecommendations: number;
  resolved: number;
  improving: number;
  notStarted: number;
  regressed: number;
}

export interface QuizAttemptSessionPayload {
  topicId?: string | null;
  subjectId?: string | null;
  levelId?: string | null;
  chapterId?: string | null;
  videoId?: string | null;
  sourceType: "chapter_quiz" | "interactive_video_quiz";
  sourceId: string;
  recommendationSnapshotId?: string | null;
  quizId: string;
  totalQuestions: number;
  correctAnswers: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  startedAt?: string | null;
  submittedAt: string;
}

export type QuizAttemptQuestionType =
  | "multiple_choice"
  | "drag_and_drop"
  | "true_false"
  | "short_answer";

export interface QuizAttemptPayload {
  topicId?: string | null;
  subjectId?: string | null;
  levelId?: string | null;
  chapterId?: string | null;
  videoId?: string | null;
  sourceType: "chapter_quiz" | "interactive_video_quiz";
  sourceId: string;
  recommendationSnapshotId?: string | null;
  quizId: string;
  questionId: string;
  questionType: QuizAttemptQuestionType;
  questionText: string;
  selectedAnswer: unknown;
  correctAnswer?: unknown;
  isCorrect: boolean;
  scoreEarned: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds?: number | null;
  startedAt?: string | null;
  submittedAt: string;
  metadata?: {
    difficulty?: string | null;
    learningObjective?: string | null;
    videoTimestamp?: number | null;
    quizSessionId?: string | null;
    chapterQuestionNumber?: string | null;
  };
}

export interface QuizAttemptsWritePayload {
  sessionId?: string | null;
  attempts: QuizAttemptPayload[];
}

export interface TopicQuizHistoryResponse {
  topicId: string;
  totalAttempts: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  latestScore: number | null;
  bestScore: number | null;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
}
