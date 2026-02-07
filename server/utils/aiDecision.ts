import {
  NON_CURRICULUM_KEYWORDS,
  NON_RAG_PHRASES,
  SUBJECT_KEYWORDS,
  TOPIC_SIGNAL_PHRASES,
} from "../config/ai-decision";

export type DecisionContext = {
  chapterName?: string;
  subject?: string;
  level?: string;
  topic?: string;
};

export type DecisionTrace = {
  allowRag: boolean;
  allowSyllabus: boolean;
  isExplicitSyllabusCheck: boolean;
  isGeneralSubjectDefinition: boolean;
  isClearlyNonCurriculum: boolean;
  isTopicSpecific: boolean;
  needsClarification: boolean;
  reason: string;
};

const SYLLABUS_CHECK_PATTERNS = [
  /\bsyllabus\b/i,
  /\bcurriculum\b/i,
  /\bout of syllabus\b/i,
  /\bin syllabus\b/i,
  /\bis this in\b/i,
  /\bcovered in\b/i,
];

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isGeneralSubjectDefinition(text: string): boolean {
  const cleaned = normalizeText(text);
  const match = cleaned.match(/^(what is|define)\s+(.+)$/);
  if (!match) return false;
  const term = match[2]?.trim() || "";
  if (!term) return false;
  return SUBJECT_KEYWORDS.has(term);
}

function isExplicitSyllabusCheck(text: string): boolean {
  return SYLLABUS_CHECK_PATTERNS.some((pattern) => pattern.test(text));
}

function isClearlyNonCurriculum(text: string): boolean {
  const lower = text.toLowerCase();
  return NON_CURRICULUM_KEYWORDS.some((signal) => lower.includes(signal));
}

function isTopicSpecific(text: string, context?: DecisionContext): boolean {
  const cleaned = normalizeText(text);
  if (!cleaned) return false;
  if (isGeneralSubjectDefinition(text)) return false;

  const hasContext = Boolean(
    context?.subject?.trim() ||
      context?.level?.trim() ||
      context?.topic?.trim() ||
      context?.chapterName?.trim()
  );

  const hasTopicSignal = TOPIC_SIGNAL_PHRASES.some((signal) =>
    cleaned.includes(signal)
  );
  if (hasTopicSignal) return true;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const singleTopic = tokens.length === 1 && tokens[0] && tokens[0].length >= 5;
  const hasLongToken = tokens.some((token) => token.length >= 6);
  const multiWordTopic = tokens.length >= 3 && hasLongToken;
  const hasQuestionMark = text.includes("?");

  return singleTopic || multiWordTopic || hasQuestionMark || hasContext;
}

function shouldAskClarify(text: string, context?: DecisionContext): boolean {
  const cleaned = normalizeText(text);
  const hasTopic = isTopicSpecific(text, context);
  const hasContext = Boolean(context?.subject?.trim() || context?.level?.trim());

  if (isExplicitSyllabusCheck(text) && !hasTopic) return true;
  if (hasTopic && !hasContext) return true;

  const pronounOnly =
    /\b(this|it|that)\b/.test(cleaned) && cleaned.split(/\s+/).length <= 4;
  return pronounOnly;
}

export function buildDecision(
  question: string,
  context?: DecisionContext
): DecisionTrace {
  const text = question || "";
  const cleaned = normalizeText(text);

  if (!cleaned) {
    return {
      allowRag: false,
      allowSyllabus: false,
      isExplicitSyllabusCheck: false,
      isGeneralSubjectDefinition: false,
      isClearlyNonCurriculum: false,
      isTopicSpecific: false,
      needsClarification: false,
      reason: "empty-question",
    };
  }

  const explicitSyllabus = isExplicitSyllabusCheck(text);
  const nonCurriculum = isClearlyNonCurriculum(text);
  const subjectDefinition = isGeneralSubjectDefinition(text);
  const topicSpecific = isTopicSpecific(text, context);
  const needsClarification = shouldAskClarify(text, context);

  const allowSyllabus =
    !nonCurriculum && !subjectDefinition && (explicitSyllabus || topicSpecific);

  const cleanedText = cleaned;
  const nonRagPhrase = NON_RAG_PHRASES.some(
    (phrase) => cleanedText === phrase || cleanedText.startsWith(`${phrase} `)
  );
  const mathLike = cleanedText.replace(/[=?]/g, "").replace(/\?/g, "").trim();
  const isMathOnly = mathLike && /^[0-9+\-*/^().\s]+$/.test(mathLike);

  const allowRag =
    !nonCurriculum &&
    !nonRagPhrase &&
    !isMathOnly &&
    (topicSpecific || Boolean(context?.chapterName?.trim()));

  const reason = nonCurriculum
    ? "non-curriculum"
    : subjectDefinition
      ? "general-subject-definition"
      : explicitSyllabus
        ? "explicit-syllabus-check"
        : topicSpecific
          ? "topic-specific"
          : "fallback";

  return {
    allowRag,
    allowSyllabus,
    isExplicitSyllabusCheck: explicitSyllabus,
    isGeneralSubjectDefinition: subjectDefinition,
    isClearlyNonCurriculum: nonCurriculum,
    isTopicSpecific: topicSpecific,
    needsClarification,
    reason,
  };
}
