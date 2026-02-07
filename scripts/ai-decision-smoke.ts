import { buildDecision } from "../server/utils/aiDecision";

type Case = {
  question: string;
  context?: {
    subject?: string;
    level?: string;
    topic?: string;
    chapterName?: string;
  };
  expect: Partial<ReturnType<typeof buildDecision>>;
};

const cases: Case[] = [
  {
    question: "What is physics?",
    expect: {
      isGeneralSubjectDefinition: true,
      allowSyllabus: false,
    },
  },
  {
    question: "Is photosynthesis in Form 1 biology?",
    context: { subject: "Biology", level: "Form 1" },
    expect: {
      isExplicitSyllabusCheck: true,
      allowSyllabus: true,
    },
  },
  {
    question: "Tell me about 9/11",
    expect: {
      isClearlyNonCurriculum: true,
      allowSyllabus: false,
      allowRag: false,
    },
  },
  {
    question: "What is density?",
    context: { subject: "Physics", level: "Form 2" },
    expect: {
      allowSyllabus: true,
      allowRag: true,
    },
  },
];

const fail = (message: string) => {
  throw new Error(`[ai-decision-smoke] ${message}`);
};

cases.forEach((testCase, index) => {
  const result = buildDecision(testCase.question, testCase.context);
  Object.entries(testCase.expect).forEach(([key, expected]) => {
    const actual = (result as any)[key];
    if (actual !== expected) {
      fail(
        `Case ${index + 1} "${testCase.question}" expected ${key}=${String(
          expected,
        )}, got ${String(actual)}`,
      );
    }
  });
});

console.log(`[ai-decision-smoke] ${cases.length} checks passed`);
