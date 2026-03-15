import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCookie } from "h3";
import apiDocs from "~/utilities/apiDocs";
import type {
  PersonalizedRecommendation,
  PersonalizedRecommendationsResponse,
  RecommendationAction,
  RecommendationReasonCode,
} from "~/types/recommendation.interface";

type TopicCandidate = {
  topicId: string;
  topicName: string;
  subjectName: string;
  levelName: string | null;
  progressPercent: number;
  assessmentScore: number | null;
  isViewed: boolean;
};

type RankedRecommendation = Omit<
  PersonalizedRecommendation,
  "explanation" | "attainmentFocus" | "seedPrompt"
>;

const CACHE_TTL_MS = 10 * 60 * 1000;
const recommendationCache = new Map<
  string,
  { timestamp: number; value: PersonalizedRecommendationsResponse }
>();

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

function normalizeNullablePercent(value: number | null | undefined): number | null {
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
    current = current?.[segment];
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

function getStringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
  return [];
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

function parseUserCookie(rawCookie: string | undefined): Record<string, any> | null {
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

function normalizeTopicCandidate(
  topic: any,
  remoteProgress: any,
  subjectLookup: Map<string, string>,
  levelLookup: Map<string, string>
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
  const isViewed =
    getFirstBoolean(remoteProgress, [["isViewed"], ["progress", "isViewed"]]) ??
    Boolean(topic?.isViewed);

  return {
    topicId,
    topicName,
    subjectName,
    levelName: levelName || null,
    progressPercent: extractProgressPercent(remoteProgress, topic),
    assessmentScore: extractAssessmentScore(remoteProgress),
    isViewed,
  };
}

function getAssessmentGap(
  assessmentScore: number | null,
  averageScore: number | null
): number {
  if (assessmentScore !== null) {
    return Math.max(0, 60 - assessmentScore);
  }
  return averageScore !== null && averageScore < 60 ? 10 : 0;
}

function getReasonCodes(
  topic: TopicCandidate,
  averageScore: number | null,
  recommendedAction: RecommendationAction
): RecommendationReasonCode[] {
  const reasons: RecommendationReasonCode[] = [];

  if (topic.progressPercent < 60) {
    reasons.push("low_progress");
  }
  if (topic.assessmentScore !== null && topic.assessmentScore < 60) {
    reasons.push("low_assessment");
  }
  if (topic.isViewed && topic.progressPercent < 80) {
    reasons.push("started_not_finished");
  }
  if (
    recommendedAction === "practice_quiz" ||
    (topic.assessmentScore === null && averageScore !== null && averageScore < 60)
  ) {
    reasons.push("needs_practice");
  }

  return Array.from(new Set(reasons));
}

function deriveRecommendedAction(topic: TopicCandidate): RecommendationAction {
  if (topic.progressPercent < 40) {
    return "rewatch_video";
  }
  if (topic.assessmentScore !== null && topic.assessmentScore < 60) {
    return "practice_quiz";
  }
  return "review_notes";
}

function buildRevisitPath(topic: TopicCandidate): string {
  const levelPart = topic.levelName || "Form 1";
  return `/interactive/${levelPart}/${topic.subjectName}/${topic.topicName}/${topic.topicId}`;
}

function shouldExcludeRecommendation(topic: TopicCandidate): boolean {
  return (
    topic.progressPercent >= 85 &&
    (topic.assessmentScore === null || topic.assessmentScore >= 70)
  );
}

function rankRecommendations(
  topics: TopicCandidate[],
  averageScore: number | null
): RankedRecommendation[] {
  return topics
    .filter((topic) => !shouldExcludeRecommendation(topic))
    .map((topic) => {
      const progressGap = 100 - topic.progressPercent;
      const assessmentGap = getAssessmentGap(topic.assessmentScore, averageScore);
      const startedButIncompleteBoost =
        topic.isViewed && topic.progressPercent < 80 ? 15 : 0;
      const priorityScore =
        progressGap + assessmentGap + startedButIncompleteBoost;
      const recommendedAction = deriveRecommendedAction(topic);

      return {
        topicId: topic.topicId,
        topicName: topic.topicName,
        subjectName: topic.subjectName,
        levelName: topic.levelName,
        revisitPath: buildRevisitPath(topic),
        progressPercent: topic.progressPercent,
        assessmentScore: topic.assessmentScore,
        priorityScore,
        recommendedAction,
        reasonCodes: getReasonCodes(topic, averageScore, recommendedAction),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore)
    .slice(0, 3);
}

function buildFallbackSummary(recommendations: RankedRecommendation[]): string {
  if (recommendations.length === 0) {
    return "You are keeping up well with your recent learning topics. Continue reviewing your latest lessons and keep practicing.";
  }

  const readableSubjects = Array.from(
    new Set(
      recommendations
        .map((item) => item.subjectName)
        .filter((item) => item && !isLikelyDatabaseId(item))
    )
  );

  const focusLabel =
    readableSubjects.length > 0
      ? readableSubjects.join(", ")
      : recommendations.map((item) => item.topicName).join(", ");

  return `Focus next on ${focusLabel}. The recommendations below prioritize the topics where finishing the lesson or practicing a little more should improve your performance fastest.`;
}

function buildFallbackExplanation(recommendation: RankedRecommendation): string {
  if (recommendation.recommendedAction === "rewatch_video") {
    return `Your progress in ${recommendation.topicName} is still low, so revisiting the lesson from the start should help you rebuild the foundation before moving on.`;
  }
  if (recommendation.recommendedAction === "practice_quiz") {
    return `You have started ${recommendation.topicName}, but your quiz performance shows you need more practice to strengthen your understanding.`;
  }
  return `You have already started ${recommendation.topicName}. A focused review of the notes should help you close the remaining gaps and improve retention.`;
}

function buildFallbackAttainmentFocus(
  recommendation: RankedRecommendation
): string {
  if (recommendation.recommendedAction === "rewatch_video") {
    return `When you revisit this topic, focus on understanding the core ideas from the beginning and aim to explain the main concept in your own words before moving forward.`;
  }
  if (recommendation.recommendedAction === "practice_quiz") {
    return `When you revisit this topic, focus on the parts that appear in practice questions and aim to answer short quiz items correctly without guessing.`;
  }
  return `When you revisit this topic, focus on the key notes and examples and aim to remember the main points well enough to apply them in classwork or revision.`;
}

function buildFallbackSeedPrompt(recommendation: RankedRecommendation): string {
  const levelPart = recommendation.levelName
    ? ` for ${recommendation.levelName}`
    : "";
  const scorePart =
    recommendation.assessmentScore !== null
      ? ` My latest assessment score is ${recommendation.assessmentScore}%.`
      : "";

  return `Help me improve in ${recommendation.topicName} in ${recommendation.subjectName}${levelPart}. My current progress is ${recommendation.progressPercent}%.${scorePart} Please give me a short study plan, explain the key ideas I should review first, and end with a few practice questions.`;
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
  recommendations: RankedRecommendation[],
  averageScore: number | null
): Promise<Pick<PersonalizedRecommendationsResponse, "summary" | "recommendations">> {
  const fallback = {
    summary: buildFallbackSummary(recommendations),
    recommendations: recommendations.map((recommendation) => ({
      ...recommendation,
      explanation: buildFallbackExplanation(recommendation),
      attainmentFocus: buildFallbackAttainmentFocus(recommendation),
      seedPrompt: buildFallbackSeedPrompt(recommendation),
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
      learner_average_score: averageScore,
      recommendations,
    };

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      system: [
        "You write personalized study recommendations for a student.",
        "You must preserve the exact topic order and topic IDs from the input.",
        "You must not add, remove, or rename topics.",
        "You must not recommend subjects outside the provided list.",
        "Return valid JSON only with this shape:",
        '{"summary":"string","recommendations":[{"topicId":"string","explanation":"string","attainmentFocus":"string","seedPrompt":"string"}]}',
        "Use English only.",
        "Explanation must be 1 to 2 sentences.",
        "Attainment focus must be 1 sentence that tells the student what to look for and what they should attain when revisiting the topic.",
        "Seed prompt must be a ready-to-send prompt for an AI teacher that asks for help on that exact topic.",
      ].join(" "),
      prompt: `Generate friendly learner-facing explanations for this ranked recommendation payload:\n${JSON.stringify(
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
            buildFallbackExplanation(recommendation)
          ),
          attainmentFocus: getStringValue(
            aiItem?.attainmentFocus,
            buildFallbackAttainmentFocus(recommendation)
          ),
          seedPrompt: getStringValue(
            aiItem?.seedPrompt,
            buildFallbackSeedPrompt(recommendation)
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

  const userCookie = parseUserCookie(getCookie(event, "signInUserToken"));
  const cachedUserId = getStringValue(userCookie?._id || userCookie?.id);
  if (cachedUserId) {
    const cached = recommendationCache.get(cachedUserId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value;
    }
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
    const cached = recommendationCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.value;
    }
  }

  const recentTopics = Array.isArray(profile.recentTopics)
    ? profile.recentTopics
    : [];
  const averageScore = normalizeNullablePercent(
    getFirstNumber(profile, [["questionStats", "averageScore"]])
  );
  const [subjectLookup, levelLookup] = await Promise.all([
    fetchLookupMap(apiDocs.subjects.getSubjects, authToken, ["name", "title"]),
    fetchLookupMap(apiDocs.levels.getLevels, authToken, ["name", "title"]),
  ]);

  const topicSnapshots = (
    await Promise.all(
      recentTopics.map(async (topic: any) => {
        const topicId = getStringValue(topic?._id || topic?.id || topic?.topicId);
        const remoteProgress = topicId
          ? await fetchJson<any>(
              apiDocs.progressTracking.getProgressTopicsTopicId.replace(
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
          levelLookup
        );
      })
    )
  ).filter(Boolean) as TopicCandidate[];

  const rankedRecommendations = rankRecommendations(topicSnapshots, averageScore);
  const explained = await explainRecommendations(
    rankedRecommendations,
    averageScore
  );

  const response: PersonalizedRecommendationsResponse = {
    generatedAt: new Date().toISOString(),
    summary: explained.summary,
    recommendations: explained.recommendations,
  };

  if (userId) {
    recommendationCache.set(userId, {
      timestamp: Date.now(),
      value: response,
    });

    if (recommendationCache.size > 100) {
      const firstKey = recommendationCache.keys().next().value;
      if (firstKey) recommendationCache.delete(firstKey);
    }
  }

  return response;
});
