<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "@/components/ui/button";
import { cn, shuffle, toRoman } from "@/lib/utils";
import Input from "@/components/ui/inputs/input";
import ActivityTitle from "@/components/templates/activity-title";
import type { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import { useSoundEffects } from "~/composables/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type ComprehensionQuestion = {
  question: string;
  image?: string;
  answers: string[];
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

const totalQuestions = computed(() => props.questions.questions.length);
const shouldUseBatchAI = computed(
  () => props.questions.algorithm === "Comprehension junior one" && !!props.questions.useAI,
);
const currentQuestion = computed(
  () => props.questions.questions[shuffledIndexes.value[activeQuestion.value] ?? 0],
);

const ensureAnswerSlots = (questionIndex: number) => {
  const originalIndex = shuffledIndexes.value[questionIndex] ?? 0;
  const answerCount = props.questions.questions[originalIndex]?.answers.length || 1;
  return attemptedQuestions.value[questionIndex] || Array.from({ length: answerCount }, () => "");
};

const initializeActivity = () => {
  const indexes = shuffle(Array.from({ length: props.questions.questions.length }, (_, index) => index));
  shuffledIndexes.value = indexes;
  activeQuestion.value = 0;
  attemptedQuestions.value = {};
  correctAnswers.value = {};
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  currentAnswers.value = indexes.length
    ? Array.from({ length: props.questions.questions[indexes[0]].answers.length }, () => "")
    : [];
};

watch(() => props.questions, initializeActivity, { deep: true, immediate: true });

const setAnswer = (answerIndex: number, value: string | number) => {
  const nextAnswers = [...currentAnswers.value];
  nextAnswers[answerIndex] = String(value ?? "");
  currentAnswers.value = nextAnswers;
};

const isQuestionCorrect = async (questionIndex: number, userAnswers: string[]) => {
  const originalIndex = shuffledIndexes.value[questionIndex];
  const question = props.questions.questions[originalIndex];

  if (!question) return false;

  if (shouldUseBatchAI.value) {
    const submissions = userAnswers.map((answer, answerIndex) => ({
      questionId: `${originalIndex}-${answerIndex}`,
      answer: answer.trim(),
    }));

    const aiQuestions = userAnswers.map((_, answerIndex) => ({
      id: `${originalIndex}-${answerIndex}`,
      question: question.question,
      acceptedAnswers: question.answers[answerIndex] ? [question.answers[answerIndex]] : [],
      strictMode: false,
      maxMarks: 1,
      questionType: "reasoning" as const,
      context: {
        readingMaterial: props.questions.notes,
        activityTitle: props.questions.title,
      },
      evaluationCriteria:
        "Evaluate this answer based on understanding of the reading material and semantic similarity to the accepted answer.",
    }));

    const results = await answerChecker.checkAnswersWithAI(submissions, aiQuestions);
    return results.every((result) => result.result.isCorrect);
  }

  if (props.questions.algorithm === "Comprehension junior one") {
    return userAnswers.every((answer) =>
      answerChecker.checkAnswer(answer, {
        acceptedAnswers: question.answers,
      }).isCorrect,
    );
  }

  return userAnswers.every(
    (answer, index) =>
      answer.trim().toLowerCase() === (question.answers[index] || "").trim().toLowerCase(),
  );
};

const advanceToNextQuestion = () => {
  if (activeQuestion.value >= shuffledIndexes.value.length - 1) {
    return false;
  }

  const nextQuestionIndex = activeQuestion.value + 1;
  activeQuestion.value = nextQuestionIndex;
  currentAnswers.value = [...ensureAnswerSlots(nextQuestionIndex)];
  return true;
};

const handleNextQuestion = async () => {
  const savedAnswers = [...currentAnswers.value];

  attemptedQuestions.value = {
    ...attemptedQuestions.value,
    [activeQuestion.value]: savedAnswers,
  };

  if (!shouldUseBatchAI.value) {
    isCheckingAnswers.value = true;
    const isCorrect = await isQuestionCorrect(activeQuestion.value, savedAnswers);
    isCheckingAnswers.value = false;

    correctAnswers.value = {
      ...correctAnswers.value,
      [activeQuestion.value]: isCorrect,
    };

    score.value = Object.values(correctAnswers.value).filter(Boolean).length + (isCorrect ? 1 : 0);
    playSound(isCorrect ? "correct" : "failure");
  }

  if (!advanceToNextQuestion()) {
    await handleCheckAnswers();
  }
};

const handleCheckAnswers = async () => {
  attemptedQuestions.value = {
    ...attemptedQuestions.value,
    [activeQuestion.value]: [...currentAnswers.value],
  };

  isCheckingAnswers.value = true;

  const nextCorrectAnswers: Record<number, boolean> = {};
  for (let index = 0; index < shuffledIndexes.value.length; index += 1) {
    const answersForQuestion = attemptedQuestions.value[index] || [];
    nextCorrectAnswers[index] = await isQuestionCorrect(index, answersForQuestion);
  }

  correctAnswers.value = nextCorrectAnswers;
  score.value = Object.values(nextCorrectAnswers).filter(Boolean).length;
  allAnswered.value = true;
  isCheckingAnswers.value = false;

  playSound(score.value >= Math.ceil(totalQuestions.value / 2) ? "correct" : "failure");
};

const resetActivity = () => {
  initializeActivity();
};

const questionParts = (questionText: string) => questionText.split("___");
const questionIsAnswered = (index: number) =>
  (attemptedQuestions.value[index] || []).every((answer) => answer.trim() !== "");
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div v-if="showResults" class="flex flex-1 flex-col gap-4 overflow-auto pb-4">
      <div class="space-y-3">
        <div
          v-for="(originalIndex, visibleIndex) in shuffledIndexes"
          :key="`${visibleIndex}-${originalIndex}`"
          :class="
            cn(
              'rounded-xl border p-4',
              correctAnswers[visibleIndex] ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50',
            )
          "
        >
          <div class="space-y-2">
            <p class="text-base font-medium text-neutral-800">
              {{ visibleIndex + 1 }}.
              {{ props.questions.questions[originalIndex].question }}
            </p>

            <div class="space-y-2 pl-4">
              <p
                v-for="(answer, answerIndex) in attemptedQuestions[visibleIndex] || []"
                :key="`${visibleIndex}-${answerIndex}`"
                class="text-sm text-neutral-700"
              >
                <span class="font-medium">Your answer:</span> {{ answer || "No answer provided." }}
              </p>
              <p
                v-if="props.feedback === 'wrong-correct-answers'"
                class="text-sm text-green-700"
              >
                Correct answer:
                {{ props.questions.questions[originalIndex].answers.join(", ") }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ActivityResults :score="score" :total="props.questions.questions.length" :on-restart="resetActivity" />
    </div>

    <div v-else class="flex flex-1 flex-col gap-4">
      <div class="grid flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <LeftNotesWithImages
          :notes="`${props.questions.notes}`"
          :image="props.questions.image"
        />

        <div class="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:p-6">
          <div v-if="currentQuestion" class="flex flex-1 flex-col gap-4">
            <div class="overflow-auto">
              <div class="text-lg leading-loose text-neutral-700">
                <template v-if="currentQuestion.question.includes('___')">
                  <template
                    v-for="(part, partIndex) in questionParts(currentQuestion.question)"
                    :key="`${activeQuestion}-${partIndex}`"
                  >
                    <span>
                      {{ partIndex === 0 ? `${toRoman(activeQuestion + 1)}. ${part}` : part }}
                    </span>
                    <span
                      v-if="partIndex < questionParts(currentQuestion.question).length - 1"
                      class="mx-2 inline-flex w-32 align-middle"
                    >
                      <Input
                        :model-value="currentAnswers[partIndex] || ''"
                        class="rounded-none border-none bg-transparent px-0 text-center text-lg text-picton-blue-700 shadow-none"
                        @update:model-value="(value) => setAnswer(partIndex, value)"
                      />
                      <span class="mt-9 block w-full border-b border-dashed border-picton-blue-700" />
                    </span>
                  </template>
                </template>

                <template v-else>
                  <p>{{ `${toRoman(activeQuestion + 1)}. ${currentQuestion.question}` }}</p>
                  <div class="mt-3">
                    <Input
                      :model-value="currentAnswers[0] || ''"
                      class="rounded-none border-none bg-transparent px-0 text-center text-lg text-picton-blue-700 shadow-none"
                      @update:model-value="(value) => setAnswer(0, value)"
                    />
                    <div class="border-b border-dashed border-picton-blue-700" />
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
                alt="Comprehension question"
                class="mx-auto max-h-72 w-full object-contain"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap justify-center gap-3">
          <div
            v-for="(_, index) in shuffledIndexes"
            :key="index"
            :class="
              cn(
                'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold',
                questionIsAnswered(index) ? 'bg-lemon-200 text-lemon-800' : 'bg-picton-blue-200 text-picton-blue-800',
                index === activeQuestion && !questionIsAnswered(index) ? 'ring-2 ring-picton-blue-500' : '',
              )
            "
          >
            {{ index + 1 }}
          </div>
        </div>

        <Button
          :disabled="currentAnswers.some((answer) => !answer?.trim()) || isCheckingAnswers"
          @click="activeQuestion < shuffledIndexes.length - 1 ? handleNextQuestion() : handleCheckAnswers()"
        >
          {{
            isCheckingAnswers
              ? "Checking..."
              : activeQuestion < shuffledIndexes.length - 1
                ? "Next Question"
                : "Check Answers"
          }}
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered"
      :on-open-change="
        (open) => {
          if (open) {
            return;
          }
          allAnswered = false;
          if (props.feedback === 'none') {
            resetActivity();
          } else {
            showResults = true;
          }
        }
      "
    />
  </div>
</template>
