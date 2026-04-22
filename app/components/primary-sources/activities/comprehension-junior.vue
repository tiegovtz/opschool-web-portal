<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { cn, shuffle } from "@/lib/utils";
import Input from "@/components/ui/inputs/input.vue";
import ActivityTitle from "@/components/templates/activity-title";
import type { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import { useSoundEffects } from "~/composables/use-sound-effects";
import { Icon } from "@iconify/vue";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type ComprehensionQuestion = {
  question: string;
  image?: string;
  answers: string[];
  acceptedAnswers?: string[];
  options: {
    id: string;
    text: string;
  }[];
};

type Props = {
  questions: {
    notes: string;
    title: string;
    image?: string;
    optionsTitle?: string;
    useAI?: boolean;
    algorithm: "Comprehension junior one" | "Comprehension junior two";
    questions: ComprehensionQuestion[];
  };
  feedback?: FeedbackType;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct",
});

const ui = useActivityUiText();
const answerChecker = new AnswerChecker();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const activeQuestion = ref(0);
const shuffledIndexes = ref<number[]>([]);
const currentAnswers = ref<string[]>([]);
const attemptedQuestions = ref<Record<number, string[]>>({});
const correctAnswers = ref<Record<number, boolean>>({});
const isCheckingAnswers = ref(false);
const allUserAnswers = ref<Record<number, string[]>>({});
const instructionsId = "comprehension-junior-instructions";
const statusId = "comprehension-junior-status";
const keyboardStatusMessage = ref("");

const shouldUseBatchAI = computed(
  () =>
    props.questions.algorithm === "Comprehension junior one" &&
    !!props.questions.useAI,
);
const currentQuestion = computed(
  () =>
    props.questions.questions[shuffledIndexes.value[activeQuestion.value] ?? 0],
);

const ensureAttemptedAnswerSlots = (questionIndex: number) => {
  const originalIndex = shuffledIndexes.value[questionIndex] ?? 0;
  const answerCount =
    props.questions.questions[originalIndex]?.answers.length || 1;
  return (
    attemptedQuestions.value[questionIndex] ||
    Array.from({ length: answerCount }, () => "")
  );
};

const ensureUserAnswerSlots = (questionIndex: number) => {
  const originalIndex = shuffledIndexes.value[questionIndex] ?? 0;
  const answerCount =
    props.questions.questions[originalIndex]?.answers.length || 1;
  return (
    allUserAnswers.value[questionIndex] ||
    Array.from({ length: answerCount }, () => "")
  );
};

const initializeActivity = () => {
  const indexes = shuffle(
    Array.from(
      { length: props.questions.questions.length },
      (_, index) => index,
    ),
  );
  shuffledIndexes.value = indexes;
  activeQuestion.value = 0;
  attemptedQuestions.value = {};
  correctAnswers.value = {};
  allUserAnswers.value = {};
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  currentAnswers.value = indexes.length
    ? Array.from(
        { length: props.questions.questions[indexes[0]]?.answers.length || 1 },
        () => "",
      )
    : [];
  keyboardStatusMessage.value = "";
};

watch(() => props.questions, initializeActivity, {
  deep: true,
  immediate: true,
});

const setAnswer = (answerIndex: number, value: string | number) => {
  const nextAnswers = [...currentAnswers.value];
  nextAnswers[answerIndex] = String(value ?? "");
  currentAnswers.value = nextAnswers;
  keyboardStatusMessage.value = ui.formatActivityUpdated(
    ui.formatQuestion(activeQuestion.value + 1),
    value,
  );
};

const isQuestionCorrect = async (
  questionIndex: number,
  userAnswers: string[],
) => {
  const originalIndex = shuffledIndexes.value[questionIndex];
  const question = props.questions.questions[originalIndex as number];

  if (!question) return false;

  if (shouldUseBatchAI.value) {
    try {
      const submissions = userAnswers.map((answer, answerIndex) => ({
        questionId: `${originalIndex}-${answerIndex}`,
        answer: answer.trim(),
      }));

      const aiQuestions = userAnswers.map((_, answerIndex) => ({
        id: `${originalIndex}-${answerIndex}`,
        question: question.question,
        acceptedAnswers: question.answers[answerIndex]
          ? [question.answers[answerIndex]]
          : [],
        strictMode: false,
        maxMarks: 1,
        questionType: "reasoning" as const,
        context: {
          notes: props.questions.notes,
          title: props.questions.title,
          questionText: question.question,
          image: question.image || props.questions.image,
        },
        evaluationCriteria:
          "Evaluate based on comprehension of the provided text/context and semantic similarity to the accepted answer.",
      }));

      const results = await answerChecker.checkAnswersWithAI(
        submissions,
        aiQuestions,
      );
      return results.every((result) => result.result.isCorrect);
    } catch {
      return userAnswers.every((answer) =>
        answerChecker.checkAnswer(answer, {
          acceptedAnswers: question.answers,
        }).isCorrect,
      );
    }
  }

  if (props.questions.algorithm === "Comprehension junior one") {
    return userAnswers.every(
      (answer) =>
        answerChecker.checkAnswer(answer, {
          acceptedAnswers: question.answers,
        }).isCorrect,
    );
  }

  return userAnswers.every(
    (answer, index) =>
      answer.trim().toLowerCase() ===
      (question.answers[index] || "").trim().toLowerCase(),
  );
};

const loadQuestionAnswers = (questionIndex: number) => {
  currentAnswers.value = shouldUseBatchAI.value
    ? [...ensureUserAnswerSlots(questionIndex)]
    : [...ensureAttemptedAnswerSlots(questionIndex)];
};

const advanceToNextQuestion = () => {
  if (activeQuestion.value >= shuffledIndexes.value.length - 1) {
    return false;
  }

  const nextQuestionIndex = activeQuestion.value + 1;
  activeQuestion.value = nextQuestionIndex;
  loadQuestionAnswers(nextQuestionIndex);
  return true;
};

const handleAnswerSubmission = async (
  questionIndex: number,
  userAnswers: string[],
) => {
  isCheckingAnswers.value = true;
  const isCorrect = await isQuestionCorrect(questionIndex, userAnswers);
  isCheckingAnswers.value = false;

  attemptedQuestions.value = {
    ...attemptedQuestions.value,
    [questionIndex]: userAnswers,
  };

  correctAnswers.value = {
    ...correctAnswers.value,
    [questionIndex]: isCorrect,
  };

  playSound(isCorrect ? "correct" : "failure");
  return isCorrect;
};

const handleNextQuestion = () => {
  const savedAnswers = [...currentAnswers.value];

  allUserAnswers.value = {
    ...allUserAnswers.value,
    [activeQuestion.value]: savedAnswers,
  };

  advanceToNextQuestion();
};

const handleCheckAnswers = async () => {
  isCheckingAnswers.value = true;

  if (shouldUseBatchAI.value) {
    const nextAllUserAnswers = {
      ...allUserAnswers.value,
      [activeQuestion.value]: [...currentAnswers.value],
    };
    allUserAnswers.value = nextAllUserAnswers;

    try {
      const submissions: { questionId: string; answer: string }[] = [];
      const aiQuestions: {
        id: string;
        question: string;
        acceptedAnswers: string[];
        strictMode: boolean;
        maxMarks: number;
        questionType: "reasoning";
        context: Record<string, unknown>;
        evaluationCriteria: string;
      }[] = [];

      shuffledIndexes.value.forEach((originalIndex, questionIndex) => {
        const question = props.questions.questions[originalIndex];
        const userAnswers = nextAllUserAnswers[questionIndex] || [];

        userAnswers.forEach((answer, answerIndex) => {
          const questionId = `${originalIndex}-${answerIndex}`;
          submissions.push({
            questionId,
            answer: answer.trim(),
          });

          aiQuestions.push({
            id: questionId,
            question: question.question,
            acceptedAnswers: question.answers,
            strictMode: false,
            maxMarks: 1,
            questionType: "reasoning",
            context: {
              notes: props.questions.notes,
              title: props.questions.title,
              questionText: question.question,
            },
            evaluationCriteria:
              "Evaluate based on comprehension of the provided text/context and semantic similarity to the accepted answer.",
          });
        });
      });

      const results = await answerChecker.checkAnswersWithAI(
        submissions,
        aiQuestions,
      );

      const nextCorrectAnswers: Record<number, boolean> = {};
      const nextAttemptedQuestions: Record<number, string[]> = {};

      shuffledIndexes.value.forEach((originalIndex, questionIndex) => {
        const userAnswers = nextAllUserAnswers[questionIndex] || [];
        nextAttemptedQuestions[questionIndex] = userAnswers;

        const questionResults = results.filter((result) =>
          result.questionId.startsWith(`${originalIndex}-`),
        );
        const isCorrect = questionResults.every(
          (result) => result.result.isCorrect,
        );

        nextCorrectAnswers[questionIndex] = isCorrect;
        playSound(isCorrect ? "correct" : "failure");
      });

      attemptedQuestions.value = nextAttemptedQuestions;
      correctAnswers.value = nextCorrectAnswers;
      score.value = Object.values(nextCorrectAnswers).filter(Boolean).length;
      allAnswered.value = true;
      keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${shuffledIndexes.value.length}.`;
    } catch {
      const nextCorrectAnswers: Record<number, boolean> = {};

      for (let index = 0; index < shuffledIndexes.value.length; index += 1) {
        const answersForQuestion = nextAllUserAnswers[index] || [];
        nextCorrectAnswers[index] = await isQuestionCorrect(
          index,
          answersForQuestion,
        );
      }

      attemptedQuestions.value = nextAllUserAnswers;
      correctAnswers.value = nextCorrectAnswers;
      score.value = Object.values(nextCorrectAnswers).filter(Boolean).length;
      allAnswered.value = true;
      keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${shuffledIndexes.value.length}.`;
    } finally {
      isCheckingAnswers.value = false;
    }

    return;
  }

  const savedAnswers = [...currentAnswers.value];
  const isCorrect = await handleAnswerSubmission(activeQuestion.value, savedAnswers);
  score.value = Object.values({
    ...correctAnswers.value,
    [activeQuestion.value]: isCorrect,
  }).filter(Boolean).length;

  if (activeQuestion.value < shuffledIndexes.value.length - 1) {
    keyboardStatusMessage.value = ui.formatActivityActivated(
      ui.isSwahili ? "Swali linalofuata" : "Next question",
    );
    advanceToNextQuestion();
    isCheckingAnswers.value = false;
    return;
  }

  allAnswered.value = true;
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${shuffledIndexes.value.length}.`;
  isCheckingAnswers.value = false;
};

const resetActivity = () => {
  initializeActivity();
};

const questionParts = (questionText: string) => questionText.split("___");
const questionIsAnswered = (index: number) => {
  const answers = shouldUseBatchAI.value
    ? allUserAnswers.value[index] || []
    : attemptedQuestions.value[index] || [];

  return answers.length > 0 && answers.every((answer) => answer.trim() !== "");
};
const isQuestionCorrectState = (index: number) => correctAnswers.value[index] ?? false;
const displayAnswer = (index: number, answerIndex: number) =>
  attemptedQuestions.value[index]?.[answerIndex] ||
  allUserAnswers.value[index]?.[answerIndex] ||
  "_____";
const closeResultsDialog = (open: boolean) => {
  if (open) {
    return;
  }

  allAnswered.value = false;

  if (props.feedback === "none") {
    resetActivity();
    return;
  }

  showResults.value = true;
};

const getInputLabel = (questionText: string, answerIndex: number) =>
  `Answer ${answerIndex + 1} for question: ${questionText.replace(/___/g, "blank")}`;
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <p :id="instructionsId" class="sr-only">
      Read the notes, then answer each question. Use the Tab key to move between the answer fields
      and the next or check answer button.
    </p>
    <p :id="statusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <div
      v-if="showResults"
      class="flex flex-1 flex-col gap-4 overflow-auto pb-4"
    >
      <div class="space-y-3">
        <div
          v-for="(originalIndex, visibleIndex) in shuffledIndexes"
          :key="`${visibleIndex}-${originalIndex}`"
          :class="
            cn(
              'rounded-xl border p-4',
              correctAnswers[visibleIndex]
                ? 'border-green-300 bg-green-50'
                : 'border-red-300 bg-red-50',
            )
          "
        >
          <div class="flex items-start gap-3">
            <div
              :class="
                cn(
                  'mt-1 flex h-8 w-8 items-center justify-center rounded-full',
                  isQuestionCorrectState(visibleIndex)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700',
                )
              "
            >
              <Icon
                :icon="
                  isQuestionCorrectState(visibleIndex)
                    ? 'heroicons:check-20-solid'
                    : 'heroicons:x-mark-20-solid'
                "
                width="18"
                height="18"
              />
            </div>

            <div class="flex-1 space-y-2 text-base leading-loose text-neutral-800">
              <template
                v-if="
                  props.questions.questions[originalIndex]?.question.includes(
                    '___',
                  )
                "
              >
                <template
                  v-for="(part, partIndex) in questionParts(
                    props.questions.questions[originalIndex]?.question || '',
                  )"
                  :key="`${visibleIndex}-${partIndex}`"
                >
                  <span>{{ partIndex === 0 ? `${visibleIndex + 1}. ${part}` : part }}</span>
                  <span
                    v-if="
                      partIndex <
                      questionParts(
                        props.questions.questions[originalIndex]?.question || '',
                      ).length - 1
                    "
                    class="mx-1 px-1"
                  >
                    <template v-if="props.feedback === 'wrong-correct-answers'">
                      <span
                        v-if="attemptedQuestions[visibleIndex]?.[partIndex]"
                        :class="
                          answerChecker.checkAnswer(
                            attemptedQuestions[visibleIndex][partIndex],
                            {
                              acceptedAnswers: props.questions.questions[
                                originalIndex
                              ]?.answers || [],
                            },
                          ).isCorrect
                            ? 'rounded bg-green-200 px-1 font-medium text-green-800'
                            : 'mr-1 rounded bg-red-200 px-1 font-medium text-red-800 line-through'
                        "
                      >
                        {{ attemptedQuestions[visibleIndex][partIndex] }}
                      </span>
                      <span
                        v-if="
                          !attemptedQuestions[visibleIndex]?.[partIndex] ||
                          !answerChecker.checkAnswer(
                            attemptedQuestions[visibleIndex][partIndex],
                            {
                              acceptedAnswers: props.questions.questions[
                                originalIndex
                              ]?.answers || [],
                            },
                          ).isCorrect
                        "
                        class="rounded bg-green-200 px-1 font-medium text-green-800"
                      >
                        {{
                          props.questions.questions[originalIndex]?.answers[
                            partIndex
                          ] || "_____"
                        }}
                      </span>
                    </template>
                    <template v-else>
                      <span
                        :class="
                          isQuestionCorrectState(visibleIndex)
                            ? 'rounded bg-green-200 px-1 font-medium text-green-800'
                            : 'rounded bg-red-200 px-1 font-medium text-red-800'
                        "
                      >
                        {{ displayAnswer(visibleIndex, partIndex) }}
                      </span>
                    </template>
                  </span>
                </template>
              </template>

              <template v-else>
                <p>
                  {{ `${visibleIndex + 1}. ${props.questions.questions[originalIndex]?.question}` }}
                </p>
                <div class="mt-1 pl-6">
                  <template v-if="props.feedback === 'wrong-correct-answers'">
                    <span
                      v-if="attemptedQuestions[visibleIndex]?.[0]"
                      :class="
                        answerChecker.checkAnswer(attemptedQuestions[visibleIndex][0], {
                          acceptedAnswers:
                            props.questions.questions[originalIndex]?.answers || [],
                        }).isCorrect
                          ? 'rounded bg-green-200 px-1 font-medium text-green-800'
                          : 'mr-1 rounded bg-red-200 px-1 font-medium text-red-800 line-through'
                      "
                    >
                      {{ attemptedQuestions[visibleIndex][0] }}
                    </span>
                    <span
                      v-if="
                        !attemptedQuestions[visibleIndex]?.[0] ||
                        !answerChecker.checkAnswer(attemptedQuestions[visibleIndex][0], {
                          acceptedAnswers:
                            props.questions.questions[originalIndex]?.answers || [],
                        }).isCorrect
                      "
                      class="rounded bg-green-200 px-1 font-medium text-green-800"
                    >
                      {{ props.questions.questions[originalIndex]?.answers[0] || "_____" }}
                    </span>
                  </template>
                  <template v-else>
                    <span
                      :class="
                        isQuestionCorrectState(visibleIndex)
                          ? 'rounded bg-green-200 px-1 font-medium text-green-800'
                          : 'rounded bg-red-200 px-1 font-medium text-red-800'
                      "
                    >
                      {{ displayAnswer(visibleIndex, 0) }}
                    </span>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <ActivityResults
        :score="score"
        :total="props.questions.questions.length"
        :on-restart="resetActivity"
      />
    </div>

    <div
      v-else
      class="flex flex-1 flex-col gap-4"
    >
      <div
        class="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
      >
        <LeftNotesWithImages
          :notes="`${props.questions.notes}`"
          :image="props.questions.image"
        />

        <div
          class="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:p-6"
          :aria-describedby="`${instructionsId} ${statusId}`"
        >
          <div
            v-if="currentQuestion"
            class="flex flex-1 flex-col gap-4"
          >
            <div class="overflow-auto">
              <div class="text-lg leading-loose text-neutral-700">
                <template v-if="currentQuestion.question.includes('___')">
                  <template
                    v-for="(part, partIndex) in questionParts(
                      currentQuestion.question,
                    )"
                    :key="`${activeQuestion}-${partIndex}`"
                  >
                    <span>
                      {{
                        partIndex === 0
                          ? `${activeQuestion + 1}. ${part}`
                          : part
                      }}
                    </span>
                    <span
                      v-if="
                        partIndex <
                        questionParts(currentQuestion.question).length - 1
                      "
                      class="mx-2 inline-flex w-32 align-middle"
                    >
                      <Input
                        :model-value="currentAnswers[partIndex] || ''"
                        :aria-label="getInputLabel(currentQuestion.question, partIndex)"
                        :aria-describedby="`${instructionsId} ${statusId}`"
                        class="rounded-none border-none bg-transparent px-0 text-center text-lg text-picton-blue-700 shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                        @update:model-value="
                          (value) => setAnswer(partIndex, value)
                        "
                      />
                      <span
                        class="mt-9 block w-full border-b border-dashed border-picton-blue-700"
                      />
                    </span>
                  </template>
                </template>

                <template v-else>
                  <p>
                    {{
                      `${activeQuestion + 1}. ${currentQuestion.question}`
                    }}
                  </p>
                  <div class="mt-3">
                    <Input
                      :model-value="currentAnswers[0] || ''"
                      :aria-label="getInputLabel(currentQuestion.question, 0)"
                      :aria-describedby="`${instructionsId} ${statusId}`"
                      class="rounded-none border-none bg-transparent px-0 text-center text-lg text-picton-blue-700 shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2"
                      @update:model-value="(value) => setAnswer(0, value)"
                    />
                    <div
                      class="border-b border-dashed border-picton-blue-700"
                    />
                  </div>
                </template>
              </div>
            </div>

            <div
              v-if="currentQuestion.image"
              class="overflow-hidden rounded-2xl bg-picton-blue-50 p-4"
            >
              <img
                :src="currentQuestion.image"
                :alt="`Image for question ${activeQuestion + 1}`"
                class="mx-auto max-h-72 w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        class="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-wrap justify-center gap-3">
          <div
            v-for="(_, index) in shuffledIndexes"
            :key="index"
            :class="
              cn(
                'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold',
                questionIsAnswered(index)
                  ? 'bg-lemon-200 text-lemon-800'
                  : 'bg-picton-blue-200 text-picton-blue-800',
                index === activeQuestion && !questionIsAnswered(index)
                  ? 'ring-2 ring-picton-blue-500'
                  : '',
              )
            "
          >
            <template v-if="questionIsAnswered(index) && (!shouldUseBatchAI || allAnswered)">
              <Icon
                v-if="isQuestionCorrectState(index)"
                icon="heroicons:check-20-solid"
                width="20"
                height="20"
                class="text-green-600"
              />
              <Icon
                v-else
                icon="heroicons:x-mark-20-solid"
                width="20"
                height="20"
                class="text-red-600"
              />
            </template>
          </div>
        </div>

        <Button
          :disabled="
            currentAnswers.some((answer) => !answer?.trim()) ||
            isCheckingAnswers
          "
          class="group gap-2"
          :aria-describedby="`${instructionsId} ${statusId}`"
          @click="
            shouldUseBatchAI && activeQuestion < shuffledIndexes.length - 1
              ? handleNextQuestion()
              : handleCheckAnswers()
          "
        >
          <Icon
            icon="heroicons:sparkles"
            width="18"
            height="18"
            class="text-lemon-700 transition-transform duration-200 group-hover:scale-110"
          />
          {{
            isCheckingAnswers
              ? shouldUseBatchAI
                ? 'Checking All Answers...'
                : ui.checking
              : shouldUseBatchAI
                ? activeQuestion < shuffledIndexes.length - 1
                  ? ui.nextQuestion
                  : 'Check All Answers'
                : ui.checkAnswer
          }}
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered"
      :on-open-change="closeResultsDialog"
    />
  </div>
</template>
