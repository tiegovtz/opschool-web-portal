import {
  computed,
  inject,
  provide,
  ref,
  type InjectionKey,
  type Ref,
} from "vue";

export type QuestionAnswer = {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  question: string;
  options?: string[];
  aiFeedback?: string;
  image?: string;
};

export type ExamActivityScore = {
  activityId: string;
  activityIndex: number;
  score: number;
  totalQuestions: number;
  answers?: QuestionAnswer[] | Record<string, unknown>[];
  questions?: unknown;
  columnQuestions?: unknown;
};

type ExamContextValue = {
  collectAnswers: Ref<boolean>;
  activityScores: Ref<Record<number, ExamActivityScore>>;
  updateActivityScore: (index: number, payload: ExamActivityScore) => void;
  setCollectAnswers: (value: boolean) => void;
};

const examContextKey: InjectionKey<ExamContextValue> = Symbol("exam-context");

export function provideExamContext(initialCollectAnswers = false) {
  const collectAnswers = ref(initialCollectAnswers);
  const activityScores = ref<Record<number, ExamActivityScore>>({});

  const updateActivityScore = (index: number, payload: ExamActivityScore) => {
    activityScores.value = {
      ...activityScores.value,
      [index]: payload,
    };
  };

  const setCollectAnswers = (value: boolean) => {
    collectAnswers.value = value;
  };

  const context: ExamContextValue = {
    collectAnswers,
    activityScores,
    updateActivityScore,
    setCollectAnswers,
  };

  provide(examContextKey, context);

  return {
    ...context,
    orderedScores: computed(() =>
      Object.values(activityScores.value).sort(
        (left, right) => left.activityIndex - right.activityIndex,
      ),
    ),
  };
}

export function useExamContext() {
  const context = inject(examContextKey, null);

  if (context) {
    return context;
  }

  const collectAnswers = ref(false);
  const activityScores = ref<Record<number, ExamActivityScore>>({});

  return {
    collectAnswers,
    activityScores,
    updateActivityScore: (index: number, payload: ExamActivityScore) => {
      activityScores.value = {
        ...activityScores.value,
        [index]: payload,
      };
    },
    setCollectAnswers: (value: boolean) => {
      collectAnswers.value = value;
    },
  };
}
