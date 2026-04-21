type QuestionType = "reasoning" | "exact";

export type CheckAnswerOptions = {
  acceptedAnswers?: string[];
  strictMode?: boolean;
  maxMarks?: number;
  questionType?: QuestionType;
  evaluationCriteria?: string;
  hint?: string;
  context?: unknown;
  imagePath?: string;
};

export type AnswerCheckResult = {
  isCorrect: boolean;
  marksAwarded: number;
  feedback: string;
};

export type BatchSubmission = {
  questionId: string;
  answer: string;
};

export type BatchQuestion = CheckAnswerOptions & {
  id: string;
  question: string;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[“”"']/g, "")
    .replace(/\s+/g, " ")
    .trim();

const UNICODE_SUP_TO_ASCII: Record<string, string> = {
  "⁰": "^0",
  "¹": "^1",
  "²": "^2",
  "³": "^3",
  "⁴": "^4",
  "⁵": "^5",
  "⁶": "^6",
  "⁷": "^7",
  "⁸": "^8",
  "⁹": "^9",
};

/** True when comparing with algebra-style normalization (LaTeX \\text, exponents, brace groups). */
const needsAlgebraNormalization = (value: string) =>
  /\\text\{|\\mathrm\{|\^[0-9]|[⁰¹²³⁴⁵⁶⁷⁸⁹]|[²³]|\{\s*\\/.test(value);

/**
 * Strip CMS LaTeX wrappers (e.g. `{\\text{b}^2}`) so learners can type `b^2` / `b²` and match.
 * Only used when {@link needsAlgebraNormalization} is true for the learner or accepted answer.
 */
const normalizeAlgebraCompareForm = (value: string): string => {
  let s = unwrapCuaComparisonSymbol(value).trim().toLowerCase();
  s = s.replace(/[“”"']/g, "");
  for (const [u, a] of Object.entries(UNICODE_SUP_TO_ASCII)) {
    s = s.split(u).join(a);
  }
  s = s.replace(/²/g, "^2").replace(/³/g, "^3");
  s = s.replace(/\\text\{([^}]*)\}/gi, "$1");
  s = s.replace(/\\mathrm\{([^}]*)\}/gi, "$1");
  if (!/\\frac\b|\\sqrt\b|\\binom\b/i.test(s)) {
    let prev = "";
    while (prev !== s) {
      prev = s;
      s = s.replace(/\{([^{}]*)\}/g, "$1");
    }
  }
  s = s.replace(/\s+/g, "");
  return s;
};

/** Map `cua(>)` / `cua(<)` to the symbol so checks match plain typed answers. */
export const unwrapCuaComparisonSymbol = (value: string) => {
  const m = value.trim().match(/^cua\s*\(\s*(.*?)\s*\)\s*$/i);
  if (!m) return value;
  const inner = (m[1] ?? "").trim();
  if (/^[<>]$/.test(inner)) return inner;
  return value;
};

const tokenize = (value: string) =>
  normalizeText(value)
    .split(/[^a-z0-9/.-]+/i)
    .map((token) => token.trim())
    .filter(Boolean);

const unique = <T>(items: T[]) => Array.from(new Set(items));

const hasStrongTokenOverlap = (left: string, right: string) => {
  const leftTokens = unique(tokenize(left));
  const rightTokens = unique(tokenize(right));

  if (!leftTokens.length || !rightTokens.length) return false;

  const rightSet = new Set(rightTokens);
  const overlap = leftTokens.filter((token) => rightSet.has(token)).length;
  const ratio = overlap / Math.max(leftTokens.length, rightTokens.length);

  return ratio >= 0.8;
};

export class AnswerChecker {
  checkAnswer(userAnswer: string, options: CheckAnswerOptions = {}): AnswerCheckResult {
    const answer = userAnswer?.trim() ?? "";
    const acceptedAnswers = (options.acceptedAnswers ?? [])
      .map((item) => item?.trim())
      .filter(Boolean) as string[];

    if (!answer) {
      return {
        isCorrect: false,
        marksAwarded: 0,
        feedback: "No answer provided.",
      };
    }

    if (!acceptedAnswers.length) {
      return {
        isCorrect: false,
        marksAwarded: 0,
        feedback: "No accepted answers were configured for this question.",
      };
    }

    const unwrapped = unwrapCuaComparisonSymbol(answer);
    const normalizedAnswer = normalizeText(unwrapped);
    const isCorrect = acceptedAnswers.some((acceptedAnswer) => {
      const accUnwrapped = unwrapCuaComparisonSymbol(acceptedAnswer);
      const normalizedAccepted = normalizeText(accUnwrapped);

      if (normalizedAnswer === normalizedAccepted) {
        return true;
      }

      if (
        needsAlgebraNormalization(acceptedAnswer) ||
        needsAlgebraNormalization(answer)
      ) {
        if (
          normalizeAlgebraCompareForm(answer) ===
          normalizeAlgebraCompareForm(acceptedAnswer)
        ) {
          return true;
        }
      }

      if (options.strictMode) {
        return false;
      }

      return hasStrongTokenOverlap(normalizedAnswer, normalizedAccepted);
    });

    return {
      isCorrect,
      marksAwarded: isCorrect ? options.maxMarks ?? 1 : 0,
      feedback: isCorrect ? "Answer accepted." : "Answer did not match the accepted answer.",
    };
  }

  async checkAnswersWithAI(
    submissions: BatchSubmission[],
    questions: BatchQuestion[],
  ) {
    return submissions.map((submission) => {
      const question = questions.find((item) => item.id === submission.questionId);
      const result = this.checkAnswer(submission.answer, question);

      return {
        questionId: submission.questionId,
        result,
      };
    });
  }

  async checkAnswersBatch(
    submissions: BatchSubmission[],
    questions: BatchQuestion[],
  ) {
    return submissions.map((submission) => {
      const question = questions.find((item) => item.id === submission.questionId);
      const result = this.checkAnswer(submission.answer, question);

      return {
        questionId: submission.questionId,
        result: {
          ...result,
          marksAwarded: result.isCorrect ? question?.maxMarks ?? 1 : 0,
        },
      };
    });
  }
}
