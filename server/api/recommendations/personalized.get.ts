import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCookie } from "h3";
import apiDocs from "~/utilities/apiDocs";
import type {
  LearnerAnalysisOverview,
  PersonalizedRecommendation,
  PersonalizedRecommendationsResponse,
  RecommendationAction,
  RecommendationReasonCode,
  SubjectLearningAnalysis,
  TopicQuizHistoryResponse,
  TopicAssessmentStatus,
  TopicLearningAnalysis,
  TopicLearningStatus,
} from "~/types/recommendation.interface";
import {
  getCachedRecommendations,
  setCachedRecommendations,
} from "../../utils/recommendationCache";

type TopicCandidate = TopicLearningAnalysis;

type RankedRecommendation = Omit<
  PersonalizedRecommendation,
  "explanation" | "attainmentFocus" | "seedPrompt"
>;

type TopicAssessmentMetrics = {
  assessmentScore: number | null;
  assessmentAttempts: number;
  passedAssessments: number;
  failedAssessments: number;
  assessmentStatus: TopicAssessmentStatus;
};

type TopicChapterMetrics = {
  totalChapters: number;
  completedChapters: number;
};

type UserLevelContext = {
  keys: Set<string>;
  name: string | null;
};

type RecommendationLanguage = "english" | "kiswahili";

function normalizeRecommendationLanguage(
  value: unknown
): RecommendationLanguage {
  return value === "kiswahili" ? "kiswahili" : "english";
}

function createUnauthorizedError(): never {
  throw createError({
    statusCode: 401,
    message: "No authorization token provided. Please sign in.",
  });
}

function clampPercent(value: number | null | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeNullablePercent(
  value: number | null | undefined
): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getValueAtPath(source: any, path: string[]): unknown {
  let current = source;
  for (const segment of path) {
    if (!isRecord(current) && !Array.isArray(current)) return undefined;
    current = (current as any)?.[segment];
  }
  return current;
}

function getFirstNumber(source: any, paths: string[][]): number | null {
  for (const path of paths) {
    const value = getValueAtPath(source, path);
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return null;
}

function getFirstBoolean(source: any, paths: string[][]): boolean | null {
  for (const path of paths) {
    const value = getValueAtPath(source, path);
    if (typeof value === "boolean") return value;
  }
  return null;
}

function getFirstArray(source: any, paths: string[][]): any[] {
  let longest: any[] = [];
  for (const path of paths) {
    const value = getValueAtPath(source, path);
    if (Array.isArray(value) && value.length > longest.length) {
      longest = value;
    }
  }
  return longest;
}

function getStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeKey(value: unknown): string {
  return getStringValue(value).trim().toLowerCase();
}

function isLikelyDatabaseId(value: string): boolean {
  return /^[a-f0-9]{24}$/i.test(value.trim());
}

function extractList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.levels)) return data.levels;
  if (Array.isArray(data?.topics)) return data.topics;
  if (Array.isArray(data?.chapters)) return data.chapters;
  return [];
}

function buildUrl(url: string, query: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) search.set(key, value);
  }

  const queryString = search.toString();
  return queryString ? `${url}?${queryString}` : url;
}

async function fetchLookupMap(
  url: string,
  token: string,
  valueKeys: string[]
): Promise<Map<string, string>> {
  const data = await fetchJson<any>(url, token, { tolerateFailure: true });
  const entries = extractList(data);
  const map = new Map<string, string>();

  for (const entry of entries) {
    const id = getStringValue(entry?._id || entry?.id);
    if (!id) continue;

    let label = "";
    for (const key of valueKeys) {
      label = getStringValue(entry?.[key]);
      if (label) break;
    }

    if (!label) continue;
    map.set(id, label);
  }

  return map;
}

function resolveDisplayValue(
  nestedValue: unknown,
  rawValue: unknown,
  lookupMap: Map<string, string>,
  fallback = ""
): string {
  const nested = getStringValue(nestedValue);
  if (nested) return nested;

  const raw = getStringValue(rawValue);
  if (!raw) return fallback;

  return lookupMap.get(raw) || raw;
}

function parseUserCookie(
  rawCookie: string | undefined
): Record<string, any> | null {
  if (!rawCookie) return null;
  try {
    return JSON.parse(rawCookie);
  } catch {
    try {
      return JSON.parse(decodeURIComponent(rawCookie));
    } catch {
      return null;
    }
  }
}

async function fetchJson<T>(
  url: string,
  token: string,
  options?: { tolerateFailure?: boolean }
): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (options?.tolerateFailure) return null;
      throw createError({
        statusCode: response.status,
        message: `Failed to fetch ${url}: ${response.statusText}`,
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (options?.tolerateFailure) return null;
    throw error;
  }
}

function extractProgressPercent(remoteProgress: any, topic: any): number {
  const remoteValue = getFirstNumber(remoteProgress, [
    ["avgProgress"],
    ["progressPercent"],
    ["progress", "avgProgress"],
    ["progress", "progressPercent"],
    ["data", "avgProgress"],
    ["data", "progressPercent"],
    ["videoProgress"],
  ]);

  if (remoteValue !== null) {
    return clampPercent(remoteValue);
  }

  const fallbackValue = getFirstNumber(topic, [
    ["progress", "avgProgress"],
    ["avgProgress"],
    ["progressPercent"],
  ]);

  return clampPercent(fallbackValue);
}

function extractAssessmentScore(remoteProgress: any): number | null {
  const value = getFirstNumber(remoteProgress, [
    ["assessmentScore"],
    ["averageScore"],
    ["avgScore"],
    ["score"],
    ["quizScore"],
    ["assessment", "score"],
    ["progress", "assessmentScore"],
    ["progress", "averageScore"],
    ["questionStats", "averageScore"],
    ["data", "assessmentScore"],
    ["data", "averageScore"],
  ]);

  return normalizeNullablePercent(value);
}

function extractAttemptScore(item: any): number | null {
  return normalizeNullablePercent(
    getFirstNumber(item, [
      ["score"],
      ["averageScore"],
      ["quizScore"],
      ["percentage"],
      ["result", "score"],
      ["assessment", "score"],
    ])
  );
}

function extractQuizHistoryScore(
  quizHistory: TopicQuizHistoryResponse | null | undefined
): number | null {
  if (!quizHistory) return null;

  return normalizeNullablePercent(
    getFirstNumber(quizHistory, [["latestScore"], ["bestScore"], ["accuracy"]])
  );
}

function inferAssessmentOutcome(item: any): boolean | null {
  const explicit = getFirstBoolean(item, [
    ["passed"],
    ["isPassed"],
    ["result", "passed"],
    ["assessment", "passed"],
  ]);
  if (explicit !== null) return explicit;

  const status = normalizeKey(
    item?.status || item?.result?.status || item?.assessment?.status
  );
  if (status.includes("pass")) return true;
  if (status.includes("fail")) return false;

  const score = extractAttemptScore(item);
  if (score !== null) return score >= 50;

  return null;
}

function extractAssessmentMetrics(
  remoteProgress: any,
  quizHistory?: TopicQuizHistoryResponse | null
): TopicAssessmentMetrics {
  const assessmentScore =
    extractAssessmentScore(remoteProgress) ?? extractQuizHistoryScore(quizHistory);
  const attemptItems = getFirstArray(remoteProgress, [
    ["assessmentAttempts"],
    ["assessments"],
    ["progress", "assessmentAttempts"],
    ["progress", "assessments"],
    ["questionStats", "attempts"],
    ["data", "assessmentAttempts"],
    ["data", "assessments"],
  ]);

  let assessmentAttempts = attemptItems.length;
  let passedAssessments = 0;
  let failedAssessments = 0;

  for (const item of attemptItems) {
    const passed = inferAssessmentOutcome(item);
    if (passed === true) passedAssessments += 1;
    if (passed === false) failedAssessments += 1;
  }

  if (!assessmentAttempts) {
    const numericAttempts = getFirstNumber(remoteProgress, [
      ["assessmentsAttempted"],
      ["assessmentAttemptsCount"],
      ["assessmentAttempts"],
      ["questionStats", "totalAttempted"],
      ["progress", "assessmentsAttempted"],
      ["progress", "assessmentAttempts"],
      ["data", "assessmentAttempts"],
    ]);
    assessmentAttempts = Math.max(0, Math.round(numericAttempts ?? 0));
  }

  if (!assessmentAttempts) {
    assessmentAttempts = Math.max(
      0,
      Math.round(quizHistory?.totalAttempts ?? 0)
    );
  }

  if (!passedAssessments) {
    const numericPassed = getFirstNumber(remoteProgress, [
      ["passedAssessments"],
      ["passedAssessmentAttempts"],
      ["questionStats", "passed"],
      ["progress", "passedAssessments"],
      ["data", "passedAssessments"],
    ]);
    if (numericPassed !== null) {
      passedAssessments = Math.max(0, Math.round(numericPassed));
    }
  }

  if (!failedAssessments) {
    const numericFailed = getFirstNumber(remoteProgress, [
      ["failedAssessments"],
      ["failedAssessmentAttempts"],
      ["questionStats", "failed"],
      ["progress", "failedAssessments"],
      ["data", "failedAssessments"],
    ]);
    if (numericFailed !== null) {
      failedAssessments = Math.max(0, Math.round(numericFailed));
    }
  }

  if (
    assessmentAttempts > 0 &&
    passedAssessments === 0 &&
    failedAssessments === 0 &&
    assessmentScore !== null
  ) {
    if (assessmentScore >= 50) {
      passedAssessments = 1;
    } else {
      failedAssessments = 1;
    }
  }

  const assessmentStatus: TopicAssessmentStatus =
    assessmentScore !== null
      ? assessmentScore >= 50
        ? "passed"
        : "failed"
      : failedAssessments > 0
        ? "failed"
        : passedAssessments > 0
          ? "passed"
          : "not_attempted";

  if (assessmentAttempts > 0 && passedAssessments === 0 && failedAssessments === 0) {
    if (assessmentStatus === "passed") passedAssessments = 1;
    if (assessmentStatus === "failed") failedAssessments = 1;
  }

  return {
    assessmentScore,
    assessmentAttempts,
    passedAssessments,
    failedAssessments,
    assessmentStatus,
  };
}

function isChapterCompleted(item: any): boolean {
  const explicit = getFirstBoolean(item, [
    ["isCompleted"],
    ["completed"],
    ["progress", "isCompleted"],
  ]);
  if (explicit !== null) return explicit;

  const chapterScore = getFirstNumber(item, [
    ["avgProgress"],
    ["progressPercent"],
    ["videoProgress"],
    ["notesProgress"],
    ["score"],
  ]);
  if (chapterScore !== null) {
    return clampPercent(chapterScore) >= 80;
  }

  return false;
}

function extractTopicChapterMetrics(
  topic: any,
  remoteProgress: any,
  fetchedChapterCount: number,
  progressPercent: number
): TopicChapterMetrics {
  const chapterItems = getFirstArray(remoteProgress, [
    ["chapters"],
    ["chapterProgress"],
    ["progress", "chapters"],
    ["progress", "chapterProgress"],
    ["data", "chapters"],
    ["data", "chapterProgress"],
  ]);

  const rawTotalChapters = getFirstNumber(remoteProgress, [
    ["totalChapters"],
    ["chapterCount"],
    ["progress", "totalChapters"],
    ["data", "totalChapters"],
  ]);
  const rawCompletedChapters = getFirstNumber(remoteProgress, [
    ["completedChapters"],
    ["progress", "completedChapters"],
    ["data", "completedChapters"],
  ]);

  const topicChapterCount = getFirstNumber(topic, [
    ["chapterCount"],
    ["totalChapters"],
  ]);

  const totalChapters = Math.max(
    0,
    Math.round(
      rawTotalChapters ??
        topicChapterCount ??
        fetchedChapterCount ??
        chapterItems.length ??
        0
    )
  );

  let completedChapters = rawCompletedChapters !== null
    ? Math.max(0, Math.round(rawCompletedChapters))
    : chapterItems.filter((item) => isChapterCompleted(item)).length;

  if (!completedChapters && totalChapters > 0 && progressPercent >= 85) {
    completedChapters = totalChapters;
  }

  if (!completedChapters && totalChapters > 0 && progressPercent > 0) {
    completedChapters = Math.min(
      totalChapters,
      Math.max(1, Math.round((progressPercent / 100) * totalChapters))
    );
  }

  return {
    totalChapters,
    completedChapters: Math.min(completedChapters, totalChapters || completedChapters),
  };
}

function resolveTopicStatus(
  isViewed: boolean,
  progressPercent: number,
  chapterMetrics: TopicChapterMetrics
): TopicLearningStatus {
  if (
    progressPercent >= 85 ||
    (chapterMetrics.totalChapters > 0 &&
      chapterMetrics.completedChapters >= chapterMetrics.totalChapters)
  ) {
    return "covered";
  }

  if (isViewed && progressPercent < 5 && chapterMetrics.completedChapters === 0) {
    return "opened_only";
  }

  if (isViewed || progressPercent > 0 || chapterMetrics.completedChapters > 0) {
    return "in_progress";
  }

  return "not_started";
}

function buildRevisitPath(topic: {
  levelName: string | null;
  subjectName: string;
  topicName: string;
  topicId: string;
}): string {
  const levelPart = topic.levelName || "Form 1";
  return `/interactive/${encodeURIComponent(levelPart)}/${encodeURIComponent(
    topic.subjectName
  )}/${encodeURIComponent(topic.topicName)}/${topic.topicId}`;
}

function buildLevelContext(
  profile: Record<string, any>,
  userCookie: Record<string, any> | null,
  levelLookup: Map<string, string>
): UserLevelContext {
  const keys = new Set<string>();

  const register = (value: unknown) => {
    const normalized = normalizeKey(value);
    if (normalized) keys.add(normalized);
  };

  const profileLevel = profile?.level;
  const cookieLevel = userCookie?.level;

  register(profile?.levelName);
  register(profile?.classLevel);
  register(profileLevel?.name);
  register(profileLevel?._id);
  register(profileLevel?.id);
  register(profileLevel);
  register(cookieLevel?.name);
  register(cookieLevel?._id);
  register(cookieLevel?.id);
  register(cookieLevel);

  const profileLevelId =
    getStringValue(profileLevel?._id || profileLevel?.id) ||
    getStringValue(profileLevel);
  const resolvedName =
    getStringValue(profileLevel?.name) ||
    getStringValue(cookieLevel?.name) ||
    levelLookup.get(profileLevelId) ||
    levelLookup.get(getStringValue(cookieLevel)) ||
    null;

  if (resolvedName) register(resolvedName);
  if (profileLevelId && levelLookup.get(profileLevelId)) {
    register(levelLookup.get(profileLevelId));
  }

  return { keys, name: resolvedName };
}

function extractTopicLevelKeys(
  topic: any,
  levelLookup: Map<string, string>
): Set<string> {
  const keys = new Set<string>();
  const register = (value: unknown) => {
    const normalized = normalizeKey(value);
    if (normalized) keys.add(normalized);
  };

  register(topic?.level?.name);
  register(topic?.levelName);
  register(topic?.classLevel?.name);
  register(topic?.classLevel);
  register(topic?.level);

  const rawLevel = getStringValue(topic?.level?._id || topic?.level?.id || topic?.level);
  if (rawLevel && levelLookup.get(rawLevel)) {
    register(levelLookup.get(rawLevel));
  }

  return keys;
}

function matchesLearnerLevel(
  topic: any,
  levelContext: UserLevelContext,
  levelLookup: Map<string, string>
): boolean {
  if (!levelContext.keys.size) return true;
  const topicLevelKeys = extractTopicLevelKeys(topic, levelLookup);
  if (!topicLevelKeys.size) return true;

  for (const key of topicLevelKeys) {
    if (levelContext.keys.has(key)) return true;
  }

  return false;
}

async function fetchAllTopicsForLearner(
  token: string,
  userId: string,
  levelContext: UserLevelContext,
  levelLookup: Map<string, string>,
  fallbackTopics: any[]
): Promise<any[]> {
  const primaryUrl = buildUrl(apiDocs.topics.filterTopics, {
    userId: userId || undefined,
  });
  const primaryTopics = extractList(
    (await fetchJson<any>(primaryUrl, token, { tolerateFailure: true })) ?? []
  );

  const byUserUrl = userId
    ? apiDocs.topics.filterTopicsByUser.replace("{userId}", userId)
    : "";
  const byUserTopics = userId
    ? extractList(
        (await fetchJson<any>(byUserUrl, token, { tolerateFailure: true })) ?? []
      )
    : [];

  const merged = [...primaryTopics, ...byUserTopics];
  const seen = new Set<string>();
  const deduped = merged.filter((topic) => {
    const topicId = getStringValue(topic?._id || topic?.id || topic?.topicId);
    if (!topicId || seen.has(topicId)) return false;
    seen.add(topicId);
    return true;
  });

  const filtered = deduped.filter((topic) =>
    matchesLearnerLevel(topic, levelContext, levelLookup)
  );

  if (filtered.length > 0) return filtered;
  if (deduped.length > 0) return deduped;
  return Array.isArray(fallbackTopics) ? fallbackTopics : [];
}

async function fetchTopicChapterCount(topicId: string, token: string): Promise<number> {
  if (!topicId) return 0;
  const response = await fetchJson<any>(
    apiDocs.chapters.getByTopicId.replace("{topicId}", topicId),
    token,
    { tolerateFailure: true }
  );

  return extractList(response).length;
}

function normalizeTopicCandidate(
  topic: any,
  remoteProgress: any,
  subjectLookup: Map<string, string>,
  levelLookup: Map<string, string>,
  chapterCount: number,
  quizHistory?: TopicQuizHistoryResponse | null
): TopicCandidate | null {
  const topicId = getStringValue(topic?._id || topic?.id || topic?.topicId);
  const topicName = getStringValue(topic?.name || topic?.title);
  if (!topicId || !topicName) return null;

  const subjectName = resolveDisplayValue(
    topic?.subject?.name || topic?.subjectName,
    topic?.subject,
    subjectLookup,
    "General"
  );
  const levelName = resolveDisplayValue(
    topic?.level?.name || topic?.levelName,
    topic?.level,
    levelLookup,
    ""
  );
  const progressPercent = extractProgressPercent(remoteProgress, topic);
  const isViewed =
    getFirstBoolean(remoteProgress, [["isViewed"], ["progress", "isViewed"]]) ??
    Boolean(topic?.isViewed);
  const assessmentMetrics = extractAssessmentMetrics(remoteProgress, quizHistory);
  const chapterMetrics = extractTopicChapterMetrics(
    topic,
    remoteProgress,
    chapterCount,
    progressPercent
  );
  const topicStatus = resolveTopicStatus(
    isViewed,
    progressPercent,
    chapterMetrics
  );

  return {
    topicId,
    topicName,
    subjectName,
    levelName: levelName || null,
    revisitPath: buildRevisitPath({
      topicId,
      topicName,
      subjectName,
      levelName: levelName || null,
    }),
    isViewed,
    progressPercent,
    topicStatus,
    assessmentStatus: assessmentMetrics.assessmentStatus,
    assessmentScore: assessmentMetrics.assessmentScore,
    assessmentAttempts: assessmentMetrics.assessmentAttempts,
    passedAssessments: assessmentMetrics.passedAssessments,
    failedAssessments: assessmentMetrics.failedAssessments,
    totalChapters: chapterMetrics.totalChapters,
    completedChapters: chapterMetrics.completedChapters,
  };
}

function getAssessmentGap(topic: TopicCandidate): number {
  if (topic.assessmentStatus === "failed") {
    return Math.max(20, 70 - (topic.assessmentScore ?? 0));
  }
  if (topic.assessmentStatus === "not_attempted") {
    return 10;
  }
  return 0;
}

function deriveRecommendedAction(topic: TopicCandidate): RecommendationAction {
  if (topic.topicStatus === "not_started" || topic.topicStatus === "opened_only") {
    return "start_topic";
  }
  if (topic.assessmentStatus === "failed") {
    return "practice_quiz";
  }
  if (topic.progressPercent < 40) {
    return "rewatch_video";
  }
  return "review_notes";
}

function getReasonCodes(
  topic: TopicCandidate,
  recommendedAction: RecommendationAction
): RecommendationReasonCode[] {
  const reasons: RecommendationReasonCode[] = [];

  if (topic.topicStatus === "not_started") {
    reasons.push("not_started");
  }
  if (topic.progressPercent < 60) {
    reasons.push("low_progress");
  }
  if (topic.assessmentStatus === "failed") {
    reasons.push("low_assessment");
  }
  if (topic.topicStatus === "in_progress" || topic.topicStatus === "opened_only") {
    reasons.push("started_not_finished");
  }
  if (
    recommendedAction === "practice_quiz" ||
    topic.assessmentStatus === "failed" ||
    topic.assessmentStatus === "not_attempted"
  ) {
    reasons.push("needs_practice");
  }

  return Array.from(new Set(reasons));
}

function shouldExcludeRecommendation(topic: TopicCandidate): boolean {
  return topic.topicStatus === "covered" && topic.assessmentStatus !== "failed";
}

function rankRecommendations(topics: TopicCandidate[]): RankedRecommendation[] {
  return topics
    .filter((topic) => !shouldExcludeRecommendation(topic))
    .map((topic) => {
      const statusBoost =
        topic.topicStatus === "not_started"
          ? 28
          : topic.topicStatus === "opened_only"
            ? 20
            : topic.topicStatus === "in_progress"
              ? 12
              : 0;
      const progressGap = 100 - topic.progressPercent;
      const assessmentGap = getAssessmentGap(topic);
      const completedChapterRatio =
        topic.totalChapters > 0
          ? topic.completedChapters / topic.totalChapters
          : topic.progressPercent / 100;
      const chapterGap = Math.round((1 - Math.min(1, completedChapterRatio)) * 20);
      const recommendedAction = deriveRecommendedAction(topic);
      const priorityScore =
        progressGap + assessmentGap + chapterGap + statusBoost;

      return {
        topicId: topic.topicId,
        topicName: topic.topicName,
        subjectName: topic.subjectName,
        levelName: topic.levelName,
        revisitPath: topic.revisitPath,
        progressPercent: topic.progressPercent,
        assessmentScore: topic.assessmentScore,
        priorityScore,
        recommendedAction,
        reasonCodes: getReasonCodes(topic, recommendedAction),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, 3);
}

function buildSubjectBreakdown(topics: TopicCandidate[]): SubjectLearningAnalysis[] {
  const grouped = new Map<string, TopicCandidate[]>();

  for (const topic of topics) {
    const key = topic.subjectName || "General";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(topic);
  }

  return Array.from(grouped.entries())
    .map(([subjectName, subjectTopics]) => {
      const coveredTopics = subjectTopics.filter(
        (topic) => topic.topicStatus === "covered"
      ).length;
      const inProgressTopics = subjectTopics.filter(
        (topic) => topic.topicStatus === "in_progress"
      ).length;
      const openedTopics = subjectTopics.filter(
        (topic) => topic.topicStatus === "opened_only"
      ).length;
      const notStartedTopics = subjectTopics.filter(
        (topic) => topic.topicStatus === "not_started"
      ).length;
      const averageProgress =
        subjectTopics.length > 0
          ? clampPercent(
              subjectTopics.reduce((sum, topic) => sum + topic.progressPercent, 0) /
                subjectTopics.length
            )
          : 0;
      const assessmentAttempts = subjectTopics.reduce(
        (sum, topic) => sum + topic.assessmentAttempts,
        0
      );
      const passedTopics = subjectTopics.filter(
        (topic) => topic.assessmentStatus === "passed"
      ).length;
      const failedTopics = subjectTopics.filter(
        (topic) => topic.assessmentStatus === "failed"
      ).length;

      return {
        subjectName,
        levelName:
          subjectTopics.find((topic) => topic.levelName)?.levelName ?? null,
        totalTopics: subjectTopics.length,
        coveredTopics,
        inProgressTopics,
        openedTopics,
        notStartedTopics,
        averageProgress,
        assessmentAttempts,
        passedTopics,
        failedTopics,
        topics: [...subjectTopics].sort((left, right) => {
          if (left.topicStatus !== right.topicStatus) {
            const order: Record<TopicLearningStatus, number> = {
              in_progress: 0,
              opened_only: 1,
              not_started: 2,
              covered: 3,
            };
            return order[left.topicStatus] - order[right.topicStatus];
          }
          return left.progressPercent - right.progressPercent;
        }),
      };
    })
    .sort((left, right) => {
      const leftNeed = left.notStartedTopics + left.inProgressTopics + left.openedTopics;
      const rightNeed =
        right.notStartedTopics + right.inProgressTopics + right.openedTopics;
      return rightNeed - leftNeed || left.subjectName.localeCompare(right.subjectName);
    });
}

function buildOverview(
  topics: TopicCandidate[],
  subjects: SubjectLearningAnalysis[],
  profileAverageScore: number | null,
  profileAssessmentAttempts: number | null
): LearnerAnalysisOverview {
  const coveredTopics = topics.filter((topic) => topic.topicStatus === "covered").length;
  const inProgressTopics = topics.filter(
    (topic) => topic.topicStatus === "in_progress"
  ).length;
  const openedTopics = topics.filter(
    (topic) => topic.topicStatus === "opened_only"
  ).length;
  const notStartedTopics = topics.filter(
    (topic) => topic.topicStatus === "not_started"
  ).length;
  const averageProgress =
    topics.length > 0
      ? clampPercent(
          topics.reduce((sum, topic) => sum + topic.progressPercent, 0) /
            topics.length
        )
      : 0;
  const scoredTopics = topics
    .map((topic) => topic.assessmentScore)
    .filter((score): score is number => score !== null);
  const averageAssessmentScore =
    profileAverageScore ??
    (scoredTopics.length > 0
      ? clampPercent(
          scoredTopics.reduce((sum, score) => sum + score, 0) / scoredTopics.length
        )
      : null);
  const topicAssessmentAttempts = topics.reduce(
    (sum, topic) => sum + topic.assessmentAttempts,
    0
  );
  const totalAssessmentAttempts = Math.max(
    topicAssessmentAttempts,
    Math.max(0, Math.round(profileAssessmentAttempts ?? 0))
  );

  return {
    totalSubjects: subjects.length,
    subjectsOpened: subjects.filter(
      (subject) =>
        subject.coveredTopics > 0 ||
        subject.inProgressTopics > 0 ||
        subject.openedTopics > 0
    ).length,
    totalTopics: topics.length,
    coveredTopics,
    inProgressTopics,
    openedTopics,
    notStartedTopics,
    averageProgress,
    averageAssessmentScore,
    totalAssessmentAttempts,
    passedTopics: topics.filter((topic) => topic.assessmentStatus === "passed").length,
    failedTopics: topics.filter((topic) => topic.assessmentStatus === "failed").length,
  };
}

function buildFallbackSummary(
  overview: LearnerAnalysisOverview,
  subjectBreakdown: SubjectLearningAnalysis[],
  recommendations: RankedRecommendation[],
  language: RecommendationLanguage
): string {
  if (overview.totalTopics === 0) {
    return language === "kiswahili"
      ? "Bado hakuna taarifa za maendeleo ya ujifunzaji za mwanafunzi huyu."
      : "No learner progress data is available yet for this student.";
  }

  const weakSubjects = subjectBreakdown
    .filter((subject) => subject.notStartedTopics + subject.inProgressTopics > 0)
    .slice(0, 2)
    .map((subject) => subject.subjectName)
    .filter((subject) => subject && !isLikelyDatabaseId(subject));

  const subjectLine =
    weakSubjects.length > 0
      ? ` Focus first on ${weakSubjects.join(" and ")}.`
      : recommendations.length > 0
        ? ` Focus first on ${recommendations
            .map((item) => item.topicName)
            .slice(0, 2)
            .join(" and ")}.`
        : "";

  if (language === "kiswahili") {
    const subjectLineSw =
      weakSubjects.length > 0
        ? ` Anza kwanza na ${weakSubjects.join(" na ")}.`
        : recommendations.length > 0
          ? ` Anza kwanza na ${recommendations
              .map((item) => item.topicName)
              .slice(0, 2)
              .join(" na ")}.`
          : "";

    return `Umefunika mada ${overview.coveredTopics} kati ya ${overview.totalTopics} hadi sasa. Mada ${overview.inProgressTopics} bado zinaendelea, ${overview.openedTopics} zilifunguliwa lakini hazikuendelezwa vya kutosha, na ${overview.notStartedTopics} bado hazijaanzwa.${subjectLineSw}`;
  }

  return `You have covered ${overview.coveredTopics} of ${overview.totalTopics} topics so far. ${overview.inProgressTopics} are still in progress, ${overview.openedTopics} were opened but not meaningfully advanced, and ${overview.notStartedTopics} have not been started yet.${subjectLine}`;
}

function buildFallbackExplanation(
  recommendation: RankedRecommendation,
  language: RecommendationLanguage
): string {
  if (language === "kiswahili") {
    if (recommendation.recommendedAction === "start_topic") {
      return `Bado hujapiga hatua za kutosha kwenye ${recommendation.topicName}. Anza mada hii sasa ili isibaki pengo kwenye ufunikaji wa silabasi yako.`;
    }
    if (recommendation.recommendedAction === "rewatch_video") {
      return `Maendeleo yako kwenye ${recommendation.topicName} bado ni madogo, hivyo kurudia somo kuanzia mwanzo kutakusaidia kujenga msingi kabla ya kuendelea.`;
    }
    if (recommendation.recommendedAction === "practice_quiz") {
      return `Umeshajihusisha na ${recommendation.topicName}, lakini matokeo yako ya tathmini bado yanaonyesha eneo dhaifu linalohitaji mazoezi ya kulenga zaidi.`;
    }
    return `Umeshaanza ${recommendation.topicName}. Kupitia maelezo ya mada kwa umakini kutakusaidia kuziba mapengo yaliyobaki na kuboresha ukumbukaji.`;
  }

  if (recommendation.recommendedAction === "start_topic") {
    return `You have not yet made enough progress in ${recommendation.topicName}. Start this topic now so it does not remain a gap in your syllabus coverage.`;
  }
  if (recommendation.recommendedAction === "rewatch_video") {
    return `Your progress in ${recommendation.topicName} is still low, so revisiting the lesson from the start should help you rebuild the foundation before moving on.`;
  }
  if (recommendation.recommendedAction === "practice_quiz") {
    return `You have engaged with ${recommendation.topicName}, but your assessment result still shows a weak area that needs targeted practice.`;
  }
  return `You have already started ${recommendation.topicName}. A focused review of the notes should help you close the remaining gaps and improve retention.`;
}

function buildFallbackAttainmentFocus(
  recommendation: RankedRecommendation,
  language: RecommendationLanguage
): string {
  if (language === "kiswahili") {
    if (recommendation.recommendedAction === "start_topic") {
      return "Anza na mawazo makuu pamoja na mifano, kisha hakikisha unaweza kueleza dhana kuu kwa maneno yako mwenyewe kabla ya kuendelea.";
    }
    if (recommendation.recommendedAction === "rewatch_video") {
      return "Unaporudia mada hii, lenga kuelewa mawazo ya msingi tangu mwanzo na uweze kueleza dhana kuu kwa maneno yako mwenyewe kabla ya kuendelea.";
    }
    if (recommendation.recommendedAction === "practice_quiz") {
      return "Lenga sehemu zinazotokea kwenye maswali na hakikisha unaweza kujibu maswali mafupi ya zoezi kwa usahihi bila kubahatisha.";
    }
    return "Lenga maelezo na mifano muhimu, kisha hakikisha unakumbuka hoja kuu vizuri kiasi cha kuzitumia kwenye kazi ya darasani au marejeo.";
  }

  if (recommendation.recommendedAction === "start_topic") {
    return "Begin with the main ideas and examples, then make sure you can explain the core concept in your own words before moving forward.";
  }
  if (recommendation.recommendedAction === "rewatch_video") {
    return "When revisiting this topic, focus on understanding the core ideas from the beginning and aim to explain the main concept in your own words before moving forward.";
  }
  if (recommendation.recommendedAction === "practice_quiz") {
    return "Focus on the parts that appear in questions and aim to answer short quiz items correctly without guessing.";
  }
  return "Focus on the key notes and examples and aim to remember the main points well enough to apply them in classwork or revision.";
}

function buildFallbackSeedPrompt(
  recommendation: RankedRecommendation,
  language: RecommendationLanguage
): string {
  const levelPart = recommendation.levelName
    ? language === "kiswahili"
      ? ` kwa ${recommendation.levelName}`
      : ` for ${recommendation.levelName}`
    : "";
  const scorePart =
    recommendation.assessmentScore !== null
      ? language === "kiswahili"
        ? ` Alama yangu ya hivi karibuni ya tathmini ni ${recommendation.assessmentScore}%.`
        : ` My latest assessment score is ${recommendation.assessmentScore}%.`
      : "";

  if (language === "kiswahili") {
    return `Nisaidie kuboresha ${recommendation.topicName} katika ${recommendation.subjectName}${levelPart}. Maendeleo yangu ya sasa ni ${recommendation.progressPercent}%.${scorePart} Nipe mpango mfupi wa kujifunza, eleza mawazo muhimu ninayopaswa kupitia kwanza, kisha malizia na maswali machache ya mazoezi.`;
  }

  return `Help me improve in ${recommendation.topicName} in ${recommendation.subjectName}${levelPart}. My current progress is ${recommendation.progressPercent}%.${scorePart} Give me a short study plan, explain the key ideas I should review first, and finish with a few practice questions.`;
}

function extractJsonObject(text: string): any | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

async function explainRecommendations(
  overview: LearnerAnalysisOverview,
  subjectBreakdown: SubjectLearningAnalysis[],
  recommendations: RankedRecommendation[],
  language: RecommendationLanguage
): Promise<Pick<PersonalizedRecommendationsResponse, "summary" | "recommendations">> {
  const fallback = {
    summary: buildFallbackSummary(overview, subjectBreakdown, recommendations, language),
    recommendations: recommendations.map((recommendation) => ({
      ...recommendation,
      explanation: buildFallbackExplanation(recommendation, language),
      attainmentFocus: buildFallbackAttainmentFocus(recommendation, language),
      seedPrompt: buildFallbackSeedPrompt(recommendation, language),
    })),
  };

  if (recommendations.length === 0) {
    return fallback;
  }

  const config = useRuntimeConfig();
  const apiKey =
    config.openaiApiKey ||
    config.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";

  if (!apiKey) {
    return fallback;
  }

  try {
    const openai = createOpenAI({ apiKey });
    const promptPayload = {
      overview,
      subjects: subjectBreakdown.slice(0, 5).map((subject) => ({
        subjectName: subject.subjectName,
        totalTopics: subject.totalTopics,
        coveredTopics: subject.coveredTopics,
        inProgressTopics: subject.inProgressTopics,
        openedTopics: subject.openedTopics,
        notStartedTopics: subject.notStartedTopics,
        averageProgress: subject.averageProgress,
      })),
      recommendations,
    };

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      system: [
        "You write learner-facing study guidance for a student dashboard.",
        "You must preserve the exact topic order and topic IDs from the input.",
        "You must not add, remove, or rename topics.",
        "Return valid JSON only with this shape:",
        '{"summary":"string","recommendations":[{"topicId":"string","explanation":"string","attainmentFocus":"string","seedPrompt":"string"}]}',
        language === "kiswahili"
          ? "Use Kiswahili only."
          : "Use English only.",
        "The summary must explain overall learner coverage, progress gaps, and what the student should focus on next.",
        "Explanation must be 1 to 2 sentences.",
        "Attainment focus must be 1 sentence that tells the student what to look for and what they should attain when revisiting the topic.",
        "Seed prompt must be a ready-to-send prompt for an AI teacher that asks for help on that exact topic.",
      ].join(" "),
      prompt: `Generate concise learner-facing analysis for this payload:\n${JSON.stringify(
        promptPayload
      )}`,
    });

    const parsed = extractJsonObject(response.text);
    if (!isRecord(parsed)) {
      return fallback;
    }

    const aiItems = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [];
    const aiByTopicId = new Map<string, Record<string, any>>();
    for (const item of aiItems) {
      if (!isRecord(item)) continue;
      const topicId = getStringValue(item.topicId);
      if (!topicId) continue;
      aiByTopicId.set(topicId, item);
    }

    return {
      summary: getStringValue(parsed.summary, fallback.summary),
      recommendations: recommendations.map((recommendation) => {
        const aiItem = aiByTopicId.get(recommendation.topicId);
        return {
          ...recommendation,
          explanation: getStringValue(
            aiItem?.explanation,
            buildFallbackExplanation(recommendation, language)
          ),
          attainmentFocus: getStringValue(
            aiItem?.attainmentFocus,
            buildFallbackAttainmentFocus(recommendation, language)
          ),
          seedPrompt: getStringValue(
            aiItem?.seedPrompt,
            buildFallbackSeedPrompt(recommendation, language)
          ),
        };
      }),
    };
  } catch {
    return fallback;
  }
}

export default defineEventHandler(async (event) => {
  const authToken = getCookie(event, "signInAccessToken");
  if (!authToken) {
    createUnauthorizedError();
  }

  const language = normalizeRecommendationLanguage(
    getQuery(event).language
  );

  const userCookie = parseUserCookie(getCookie(event, "signInUserToken"));
  const cachedUserId = getStringValue(userCookie?._id || userCookie?.id);
  if (cachedUserId) {
    const cached = getCachedRecommendations(cachedUserId, language);
    if (cached) return cached;
  }

  const profile = await fetchJson<Record<string, any>>(
    apiDocs.auth.profile,
    authToken
  );
  if (!profile) {
    throw createError({
      statusCode: 500,
      message: "Failed to load profile data for personalized recommendations.",
    });
  }

  const userId = getStringValue(
    profile._id || profile.id || profile.userId || userCookie?._id || userCookie?.id
  );

  if (userId) {
    const cached = getCachedRecommendations(userId, language);
    if (cached) return cached;
  }

  const averageScore = normalizeNullablePercent(
    getFirstNumber(profile, [["questionStats", "averageScore"]])
  );
  const profileAssessmentAttempts = getFirstNumber(profile, [
    ["questionStats", "totalAttempted"],
    ["questionStats", "attempts"],
    ["assessmentAttempts"],
    ["assessmentsAttempted"],
  ]);
  const recentTopics = Array.isArray(profile.recentTopics) ? profile.recentTopics : [];
  const [subjectLookup, levelLookup] = await Promise.all([
    fetchLookupMap(apiDocs.subjects.getSubjects, authToken, ["name", "title"]),
    fetchLookupMap(apiDocs.levels.getLevels, authToken, ["name", "title"]),
  ]);

  const levelContext = buildLevelContext(profile, userCookie, levelLookup);
  const learnerTopics = await fetchAllTopicsForLearner(
    authToken,
    userId,
    levelContext,
    levelLookup,
    recentTopics
  );

  const topicSnapshots = (
    await Promise.all(
      learnerTopics.map(async (topic: any) => {
        const topicId = getStringValue(topic?._id || topic?.id || topic?.topicId);
        if (!topicId) return null;

        const [remoteProgress, chapterCount] = await Promise.all([
          fetchJson<any>(
            apiDocs.progressTracking.getProgressTopicsTopicId.replace(
              "{topicId}",
              topicId
            ),
            authToken,
            { tolerateFailure: true }
          ),
          fetchTopicChapterCount(topicId, authToken),
        ]);
        const shouldFetchQuizHistory =
          extractAssessmentMetrics(remoteProgress).assessmentAttempts === 0;
        const quizHistory = shouldFetchQuizHistory
          ? await fetchJson<TopicQuizHistoryResponse>(
              apiDocs.progressTracking.getTopicQuizHistory.replace(
                "{topicId}",
                topicId
              ),
              authToken,
              { tolerateFailure: true }
            )
          : null;

        return normalizeTopicCandidate(
          topic,
          remoteProgress,
          subjectLookup,
          levelLookup,
          chapterCount,
          quizHistory
        );
      })
    )
  ).filter(Boolean) as TopicCandidate[];

  const subjectBreakdown = buildSubjectBreakdown(topicSnapshots);
  const overview = buildOverview(
    topicSnapshots,
    subjectBreakdown,
    averageScore,
    profileAssessmentAttempts
  );
  const rankedRecommendations = rankRecommendations(topicSnapshots);
  const explained = await explainRecommendations(
    overview,
    subjectBreakdown,
    rankedRecommendations,
    language
  );

  const response: PersonalizedRecommendationsResponse = {
    generatedAt: new Date().toISOString(),
    summary: explained.summary,
    overview,
    subjectBreakdown,
    topicBreakdown: topicSnapshots,
    recommendations: explained.recommendations,
  };

  if (userId) {
    setCachedRecommendations(userId, language, response);
  }

  return response;
});
