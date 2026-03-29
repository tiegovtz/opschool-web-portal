<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type QuestionItem = {
  question: string;
  answer: "T" | "F";
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    notes: string;
    title: string;
    image?: string;
    questions: QuestionItem[];
  };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const activeQuestion = ref(0);
const shuffledIndexes = ref<number[]>([]);
const attemptedQuestions = ref<Record<number, "T" | "F" | "">>({});
const answerFeedback = ref<"correct" | "incorrect" | null>(null);
const showResults = ref(false);

const initialize = () => {
  shuffledIndexes.value = shuffle(
    Array.from({ length: props.questions.questions.length }, (_, index) => index),
  );
  attemptedQuestions.value = Object.fromEntries(
    shuffledIndexes.value.map((_, index) => [index, ""]),
  );
  score.value = 0;
  allAnswered.value = false;
  activeQuestion.value = 0;
  answerFeedback.value = null;
  showResults.value = false;
};

watch(() => props.questions.questions, initialize, { deep: true, immediate: true });

const currentQuestion = computed(() =>
  shuffledIndexes.value.length
    ? props.questions.questions[shuffledIndexes.value[activeQuestion.value]]
    : props.questions.questions[0],
);

watch(
  attemptedQuestions,
  (value) => {
    if (
      shuffledIndexes.value.length > 0 &&
      Object.keys(value).length === shuffledIndexes.value.length &&
      Object.values(value).every((answer) => answer !== "")
    ) {
      score.value = Object.entries(value).reduce((total, [index, answer]) => {
        const questionIndex = shuffledIndexes.value[Number.parseInt(index, 10)];
        return total + (answer === props.questions.questions[questionIndex].answer ? 1 : 0);
      }, 0);
      allAnswered.value = true;
      playSound("success");
    }
  },
  { deep: true },
);

const handleAnswerSelection = (questionIndex: number, answer: "T" | "F") => {
  if (!shuffledIndexes.value.length) return;

  const originalIndex = shuffledIndexes.value[questionIndex];
  const correct = answer === props.questions.questions[originalIndex].answer;
  answerFeedback.value = correct ? "correct" : "incorrect";
  playSound(correct ? "correct" : "failure");

  attemptedQuestions.value = {
    ...attemptedQuestions.value,
    [questionIndex]: answer,
  };

  window.setTimeout(() => {
    answerFeedback.value = null;
    if (questionIndex < shuffledIndexes.value.length - 1) {
      activeQuestion.value = questionIndex + 1;
    }
  }, 1000);
};

const resetActivity = () => {
  initialize();
};

const resultRows = computed(() =>
  shuffledIndexes.value.map((originalIndex, index) => {
    const question = props.questions.questions[originalIndex];
    const userAnswer = attemptedQuestions.value[index] || "";

    return {
      question,
      userAnswer,
      isCorrect: userAnswer === question.answer,
    };
  }),
);
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="showResults"
      class="flex flex-1 flex-col items-center justify-between overflow-auto md:p-4"
    >
      <div class="w-full space-y-3">
        <div
          v-for="(row, index) in resultRows"
          :key="index"
          :class="
            cn(
              'flex items-center gap-3 rounded-md border p-3',
              row.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50',
            )
          "
        >
          <div
            :class="
              cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                row.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
              )
            "
          >
            {{ row.isCorrect ? "✓" : "✕" }}
          </div>

          <div class="flex-1">
            <p class="font-medium">Question {{ index + 1 }}</p>
            <div class="mt-1 flex flex-col gap-1 text-sm">
              <p>{{ row.question.question }}</p>
              <span v-if="props.feedback === 'wrong-correct-answers'">
                Correct Answer:
                <strong>{{ row.question.answer === "T" ? "Kweli" : "Si Kweli" }}</strong>
              </span>
              <span
                v-if="row.userAnswer"
                :class="row.userAnswer === row.question.answer ? 'text-green-600' : 'text-red-600'"
              >
                <strong>{{ row.userAnswer === "T" ? "Kweli" : "Si Kweli" }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 w-full">
        <ActivityResults
          :score="score"
          :total="props.questions.questions.length"
          :onRestart="resetActivity"
        />
      </div>
    </div>

    <div v-else class="flex h-full flex-col gap-4">
      <div class="flex h-[calc(100dvh-200px)] flex-col justify-between gap-4 md:flex-row">
        <LeftNotesWithImages :notes="props.questions.notes" />

        <div class="flex h-full w-full flex-col justify-between rounded-xl bg-white p-4 md:p-6">
          <div class="flex max-h-[300px] flex-col justify-between gap-4 overflow-auto">
            <div class="text-lg leading-loose md:p-4">
              <p>{{ `${activeQuestion + 1}. ${currentQuestion?.question || ""}` }}</p>

              <div class="mt-4">
                <div class="flex items-center justify-center gap-8">
                  <Button
                    :variant="attemptedQuestions[activeQuestion] === 'T' ? 'default' : 'outline'"
                    :disabled="!!attemptedQuestions[activeQuestion]"
                    :class="
                      cn('h-14 w-20 text-xl md:h-16 md:w-24', {
                        'bg-green-500':
                          answerFeedback === 'correct' && attemptedQuestions[activeQuestion] === 'T',
                        'bg-red-500':
                          answerFeedback === 'incorrect' && attemptedQuestions[activeQuestion] === 'T',
                      })
                    "
                    @click="handleAnswerSelection(activeQuestion, 'T')"
                  >
                    Kweli
                  </Button>

                  <Button
                    :variant="attemptedQuestions[activeQuestion] === 'F' ? 'default' : 'outline'"
                    :disabled="!!attemptedQuestions[activeQuestion]"
                    :class="
                      cn('h-14 w-20 text-xl md:h-16 md:w-24', {
                        'bg-green-500':
                          answerFeedback === 'correct' && attemptedQuestions[activeQuestion] === 'F',
                        'bg-red-500':
                          answerFeedback === 'incorrect' && attemptedQuestions[activeQuestion] === 'F',
                      })
                    "
                    @click="handleAnswerSelection(activeQuestion, 'F')"
                  >
                    Si Kweli
                  </Button>
                </div>

                <div class="mt-4 text-center">
                  <p
                    v-if="answerFeedback"
                    :class="
                      cn('text-lg font-bold', {
                        'text-green-600': answerFeedback === 'correct',
                        'text-red-600': answerFeedback === 'incorrect',
                      })
                    "
                  >
                    {{ answerFeedback === "correct" ? "Correct!" : "Incorrect!" }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="props.questions.image"
            class="flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg"
          >
            <img
              :src="props.questions.image"
              alt="Activity Image"
              class="h-full w-full object-contain"
            >
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex flex-wrap justify-center gap-4">
          <button
            v-for="(originalIndex, index) in shuffledIndexes"
            :key="index"
            type="button"
            :class="
              cn(
                'flex h-10 w-10 items-center justify-center rounded-lg bg-picton-blue-200',
                {
                  'bg-lemon-200': attemptedQuestions[index] !== '',
                  'border-2 border-picton-blue-500': index === activeQuestion && !attemptedQuestions[index],
                },
              )
            "
            :style="{ cursor: !answerFeedback ? 'pointer' : 'default' }"
            @click="!answerFeedback && (activeQuestion = index)"
          >
            <template v-if="attemptedQuestions[index] !== ''">
              {{ attemptedQuestions[index] === props.questions.questions[originalIndex].answer ? "✓" : "✕" }}
            </template>
          </button>
        </div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else {
              showResults = true;
            }
            allAnswered = false;
          }
        }
      "
    />
  </div>
</template>
