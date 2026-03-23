import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getCookie, getHeader, readBody } from "h3";
import type {
  PersonalizedRecommendationsResponse,
  SubjectLearningAnalysis,
  TalkToDataResponse,
  TopicLearningAnalysis,
} from "~/types/recommendation.interface";

const MAX_QUESTION_LENGTH = 500;

function normalizeQuestion(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getCompactTopic(topic: TopicLearningAnalysis) {
  return {
    topicName: topic.topicName,
    subjectName: topic.subjectName,
    levelName: topic.levelName,
    topicStatus: topic.topicStatus,
    progressPercent: topic.progressPercent,
    assessmentStatus: topic.assessmentStatus,
    assessmentScore: topic.assessmentScore,
    assessmentAttempts: topic.assessmentAttempts,
    completedChapters: topic.completedChapters,
    totalChapters: topic.totalChapters,
  };
}

function rankWeakTopics(topics: TopicLearningAnalysis[]) {
  return [...topics]
    .sort((left, right) => {
      const leftRisk =
        (left.topicStatus === "not_started" ? 40 : 0) +
        (left.topicStatus === "opened_only" ? 25 : 0) +
        (left.topicStatus === "in_progress" ? 15 : 0) +
        (left.assessmentStatus === "failed" ? 35 : 0) +
        (100 - left.progressPercent);
      const rightRisk =
        (right.topicStatus === "not_started" ? 40 : 0) +
        (right.topicStatus === "opened_only" ? 25 : 0) +
        (right.topicStatus === "in_progress" ? 15 : 0) +
        (right.assessmentStatus === "failed" ? 35 : 0) +
        (100 - right.progressPercent);

      return rightRisk - leftRisk;
    })
    .slice(0, 5);
}

function formatTopicSummary(topic: TopicLearningAnalysis): string {
  const assessmentPart =
    topic.assessmentScore !== null
      ? `quiz ${topic.assessmentScore}% (${topic.assessmentStatus})`
      : `quiz ${topic.assessmentStatus}`;
  const chapterPart = topic.totalChapters
    ? `${topic.completedChapters}/${topic.totalChapters} chapters`
    : "no chapter count";

  return `${topic.topicName} in ${topic.subjectName}: ${topic.topicStatus}, progress ${topic.progressPercent}%, ${assessmentPart}, ${chapterPart}`;
}

function getWeakestSubject(subjects: SubjectLearningAnalysis[]) {
  return [...subjects]
    .sort((left, right) => {
      const leftNeed =
        left.notStartedTopics * 2 +
        left.inProgressTopics +
        left.openedTopics +
        left.failedTopics * 2 -
        left.coveredTopics;
      const rightNeed =
        right.notStartedTopics * 2 +
        right.inProgressTopics +
        right.openedTopics +
        right.failedTopics * 2 -
        right.coveredTopics;

      return rightNeed - leftNeed || left.averageProgress - right.averageProgress;
    })[0];
}

function buildDefaultFallback(
  analytics: PersonalizedRecommendationsResponse
): string {
  const { overview } = analytics;
  const weakestSubject = getWeakestSubject(analytics.subjectBreakdown);
  const weakTopics = rankWeakTopics(analytics.topicBreakdown)
    .slice(0, 3)
    .map((topic) => topic.topicName)
    .join(", ");

  const weakestSubjectLine = weakestSubject
    ? ` Your biggest current gap is ${weakestSubject.subjectName}, where you have covered ${weakestSubject.coveredTopics}/${weakestSubject.totalTopics} topics and failed ${weakestSubject.failedTopics} topic-level assessments.`
    : "";
  const weakTopicsLine = weakTopics
    ? ` Priority topics now are ${weakTopics}.`
    : "";

  return `You have covered ${overview.coveredTopics} of ${overview.totalTopics} topics. ${overview.inProgressTopics} topics are in progress, ${overview.openedTopics} were opened but not really advanced, and ${overview.notStartedTopics} have not been started. You have passed ${overview.passedTopics} topics and failed ${overview.failedTopics}.${weakestSubjectLine}${weakTopicsLine}`;
}

function buildFallbackTalkAnswer(
  question: string,
  analytics: PersonalizedRecommendationsResponse
): string {
  const normalized = question.toLowerCase();
  const notStarted = analytics.topicBreakdown.filter(
    (topic) => topic.topicStatus === "not_started"
  );
  const openedOnly = analytics.topicBreakdown.filter(
    (topic) => topic.topicStatus === "opened_only"
  );
  const failed = analytics.topicBreakdown.filter(
    (topic) => topic.assessmentStatus === "failed"
  );
  const passed = analytics.topicBreakdown.filter(
    (topic) => topic.assessmentStatus === "passed"
  );
  const weakTopics = rankWeakTopics(analytics.topicBreakdown);
  const weakestSubject = getWeakestSubject(analytics.subjectBreakdown);

  if (
    /(not started|not covered|haven't covered|have not covered|untouched|not yet covered)/i.test(
      normalized
    )
  ) {
    const untouched = notStarted.slice(0, 6).map(formatTopicSummary);
    if (!untouched.length) {
      return "You do not currently have any fully untouched topics in the snapshot. Your remaining gaps are mostly in topics you already opened or started.";
    }

    return `These are your main not-started topics:\n${untouched.join(
      "\n"
    )}\nNext step: begin one of these topics before spending more time on topics you already covered.`;
  }

  if (/(opened|started but not finished|in progress|unfinished)/i.test(normalized)) {
    const unfinished = [...openedOnly, ...analytics.topicBreakdown.filter(
      (topic) => topic.topicStatus === "in_progress"
    )]
      .slice(0, 6)
      .map(formatTopicSummary);

    if (!unfinished.length) {
      return "You do not currently have any opened-only or in-progress topics in the snapshot.";
    }

    return `These are the topics you opened or started but have not fully covered yet:\n${unfinished.join(
      "\n"
    )}\nNext step: finish these before jumping to many new topics.`;
  }

  if (/(fail|failed|weak|weakest|struggling|poor)/i.test(normalized)) {
    const failedLines = failed.slice(0, 6).map(formatTopicSummary);
    if (failedLines.length > 0) {
      return `Your weakest assessed topics right now are:\n${failedLines.join(
        "\n"
      )}\nNext step: revise these first because they show clear performance gaps.`;
    }

    if (weakTopics.length > 0) {
      return `You do not have recorded failed topics in the current snapshot, but these are still your weakest topics by progress and completion:\n${weakTopics
        .slice(0, 5)
        .map(formatTopicSummary)
        .join("\n")}\nNext step: improve these before the teacher reviews your profile.`;
    }
  }

  if (/(subject|subjects).*(weak|behind|lowest|worst)/i.test(normalized)) {
    if (!weakestSubject) {
      return "I cannot identify a weakest subject because there is no subject breakdown data in the current snapshot.";
    }

    return `Your weakest subject right now is ${weakestSubject.subjectName}. You have covered ${weakestSubject.coveredTopics}/${weakestSubject.totalTopics} topics, ${weakestSubject.notStartedTopics} are not started, ${weakestSubject.inProgressTopics + weakestSubject.openedTopics} are unfinished, and ${weakestSubject.failedTopics} topic-level assessments are failed. Next step: focus your revision there first.`;
  }

  if (/(pass|passed)/i.test(normalized)) {
    if (!passed.length) {
      return "You do not yet have any clearly passed topic-level assessments in the current snapshot.";
    }

    return `You have passed ${passed.length} topics so far. Stronger topics include:\n${passed
      .slice(0, 6)
      .map(formatTopicSummary)
      .join("\n")}\nNext step: keep these stable while improving failed or unfinished topics.`;
  }

  if (/(attempt|attempted|quiz|quizzes|assessment)/i.test(normalized)) {
    return `You have made ${analytics.overview.totalAssessmentAttempts} assessment attempts in total. ${analytics.overview.passedTopics} topics are currently in passed status and ${analytics.overview.failedTopics} are in failed status. Your average assessment score is ${
      analytics.overview.averageAssessmentScore !== null
        ? `${analytics.overview.averageAssessmentScore}%`
        : "not available yet"
    }.`;
  }

  return buildDefaultFallback(analytics);
}

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      message: "Method Not Allowed",
    });
  }

  const authToken =
    getCookie(event, "signInAccessToken") ||
    getHeader(event, "authorization")?.replace("Bearer ", "").trim();

  if (!authToken) {
    throw createError({
      statusCode: 401,
      message: "No authorization token provided. Please sign in.",
    });
  }

  const body = await readBody(event).catch(() => ({}));
  const question = normalizeQuestion(body?.question);

  if (!question) {
    throw createError({
      statusCode: 400,
      message: "Question is required.",
    });
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    throw createError({
      statusCode: 400,
      message: `Question is too long. Maximum length is ${MAX_QUESTION_LENGTH} characters.`,
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${authToken}`,
  };
  const cookieHeader = getHeader(event, "cookie");
  if (cookieHeader) {
    headers.cookie = cookieHeader;
  }

  const analytics = await $fetch<PersonalizedRecommendationsResponse>(
    "/api/recommendations/personalized",
    { headers }
  );

  const compactPayload = {
    overview: analytics.overview,
    subjectBreakdown: analytics.subjectBreakdown.map((subject) => ({
      subjectName: subject.subjectName,
      levelName: subject.levelName,
      totalTopics: subject.totalTopics,
      coveredTopics: subject.coveredTopics,
      inProgressTopics: subject.inProgressTopics,
      openedTopics: subject.openedTopics,
      notStartedTopics: subject.notStartedTopics,
      averageProgress: subject.averageProgress,
      assessmentAttempts: subject.assessmentAttempts,
      passedTopics: subject.passedTopics,
      failedTopics: subject.failedTopics,
    })),
    topicBreakdown: analytics.topicBreakdown.map(getCompactTopic),
  };

  const fallbackAnswer = buildFallbackTalkAnswer(question, analytics);

  const config = useRuntimeConfig();
  const apiKey =
    config.openaiApiKey ||
    config.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    "";

  let answer = fallbackAnswer;

  if (apiKey) {
    try {
      const openai = createOpenAI({ apiKey });
      const response = await generateText({
        model: openai("gpt-4o-mini"),
        system: [
          "You answer student questions strictly from their own learning analytics data.",
          "You must only use the provided STUDENT_DATA JSON.",
          "Do not invent any topic, score, attempt, pass, fail, or coverage information.",
          "If the question cannot be answered from the data, say that clearly.",
          "You must clearly distinguish covered, in_progress, opened_only, and not_started.",
          "You must clearly distinguish passed, failed, and not_attempted.",
          "Use exact topic names, subject names, and numbers from the data whenever relevant.",
          "Answer in plain English.",
          "Keep the answer concise but specific.",
          "End with a short next step for the student.",
        ].join(" "),
        prompt: `QUESTION:\n${question}\n\nSTUDENT_DATA:\n${JSON.stringify(
          compactPayload
        )}`,
      });

      const candidate = response.text?.trim();
      if (candidate) {
        answer = candidate;
      }
    } catch {
      answer = fallbackAnswer;
    }
  }

  const payload: TalkToDataResponse = {
    generatedAt: new Date().toISOString(),
    question,
    answer,
  };

  return payload;
});
