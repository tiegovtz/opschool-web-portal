import {
  NON_CURRICULUM_KEYWORDS,
  NON_RAG_PHRASES,
  SUBJECT_KEYWORDS,
  TOPIC_SIGNAL_PHRASES,
} from "../config/ai-decision";
import type { CurriculumLexicon } from "./curriculumLexicon";

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
  isLowInformationInput: boolean;
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

const ACADEMIC_WORD_PATTERNS = [
  /logy$/,
  /graphy$/,
  /metry$/,
  /tion$/,
  /sion$/,
  /osis$/,
  /sis$/,
  /ics$/,
  /ism$/,
  /ity$/,
];

function isLikelyAcademicToken(
  token: string,
  lexicon?: Pick<CurriculumLexicon, "terms" | "tokens">
): boolean {
  const normalized = normalizeText(token);
  return (
    SUBJECT_KEYWORDS.has(normalized) ||
    Boolean(lexicon?.terms.has(normalized)) ||
    Boolean(lexicon?.tokens.has(normalized)) ||
    ACADEMIC_WORD_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}

function isLikelyAcademicPhrase(
  text: string,
  lexicon?: Pick<CurriculumLexicon, "terms" | "tokens">
): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (lexicon?.terms.has(normalized)) return true;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  const academicTokens = tokens.filter((token) =>
    isLikelyAcademicToken(token, lexicon)
  );

  if (tokens.length === 1) {
    return academicTokens.length === 1;
  }

  return academicTokens.length >= 1;
}

function isLowInformationInput(
  text: string,
  context?: DecisionContext,
  lexicon?: Pick<CurriculumLexicon, "terms" | "tokens">
): boolean {
  const cleaned = normalizeText(text);
  if (!cleaned) return false;

  const hasContext = Boolean(
    context?.subject?.trim() ||
      context?.level?.trim() ||
      context?.topic?.trim() ||
      context?.chapterName?.trim()
  );

  if (hasContext) return false;
  if (text.includes("?")) return false;
  if (TOPIC_SIGNAL_PHRASES.some((signal) => cleaned.includes(signal))) return false;
  if (NON_RAG_PHRASES.includes(cleaned)) return false;
  if (isGeneralSubjectDefinition(text)) return false;
  if (isLikelyAcademicPhrase(text, lexicon)) return false;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 2) return false;
  if (!tokens.every((token) => /^[a-z]+$/.test(token))) return false;

  return true;
}

function isTopicSpecific(
  text: string,
  context?: DecisionContext,
  lexicon?: Pick<CurriculumLexicon, "terms" | "tokens">
): boolean {
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
  if (isLikelyAcademicPhrase(text, lexicon)) return true;

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const singleTopic =
    tokens.length === 1 &&
    tokens[0] &&
    (isLikelyAcademicToken(tokens[0], lexicon) || hasContext);
  const twoWordTopic =
    tokens.length === 2 &&
    tokens.some((token) => isLikelyAcademicToken(token, lexicon));
  const hasLongToken = tokens.some((token) => token.length >= 6);
  const multiWordTopic = tokens.length >= 3 && hasLongToken;
  const hasQuestionMark = text.includes("?");

  return singleTopic || twoWordTopic || multiWordTopic || hasQuestionMark || hasContext;
}

function shouldAskClarify(
  text: string,
  context?: DecisionContext,
  lexicon?: Pick<CurriculumLexicon, "terms" | "tokens">
): boolean {
  const cleaned = normalizeText(text);
  const hasTopic = isTopicSpecific(text, context, lexicon);
  const hasContext = Boolean(context?.subject?.trim() || context?.level?.trim());

  // Do NOT ask for subject/level when the user asked a direct content question—answer it.
  if (hasTopic && !hasContext) return false;
  if (isExplicitSyllabusCheck(text) && !hasTopic) return true;
  if (isLowInformationInput(text, context, lexicon)) return true;

  const pronounOnly =
    /\b(this|it|that)\b/.test(cleaned) && cleaned.split(/\s+/).length <= 4;
  return pronounOnly;
}

export function buildDecision(
  question: string,
  context?: DecisionContext,
  lexicon?: Pick<CurriculumLexicon, "terms" | "tokens">
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
      isLowInformationInput: false,
      needsClarification: false,
      reason: "empty-question",
    };
  }

  const explicitSyllabus = isExplicitSyllabusCheck(text);
  const nonCurriculum = isClearlyNonCurriculum(text);
  const subjectDefinition = isGeneralSubjectDefinition(text);
  const lowInformationInput = isLowInformationInput(text, context, lexicon);
  const topicSpecific = isTopicSpecific(text, context, lexicon);
  const needsClarification = shouldAskClarify(text, context, lexicon);

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
      : lowInformationInput
        ? "low-information-input"
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
    isLowInformationInput: lowInformationInput,
    needsClarification,
    reason,
  };
}
