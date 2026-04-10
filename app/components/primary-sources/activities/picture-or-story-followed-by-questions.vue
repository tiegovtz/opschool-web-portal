<script setup lang="ts">
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
  answer: string;
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    notes: string;
    title: string;
    image?: string;
    options: string[];
    questions: QuestionItem[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const activeQuestion = ref(0);
const shuffledQuestions = ref<QuestionItem[]>([]);
const attemptedQuestions = ref<Record<number, string>>({});
const answerFeedback = ref<"correct" | "incorrect" | null>(null);
const shuffledOptions = ref<string[]>([]);
const showResults = ref(false);

const initialize = () => {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
  shuffledOptions.value = shuffle([...props.questions.options]);
  attemptedQuestions.value = Object.fromEntries(
    shuffledQuestions.value.map((_, index) => [index, ""]),
  );
  score.value = 0;
  allAnswered.value = false;
  activeQuestion.value = 0;
  answerFeedback.value = null;
  showResults.value = false;
};

watch(
  () => [props.questions.questions, props.questions.options],
  initialize,
  { deep: true, immediate: true },
);

watch(
  attemptedQuestions,
  (value) => {
    if (
      Object.values(value).every((answer) => answer !== "") &&
      Object.keys(value).length === shuffledQuestions.value.length
    ) {
      score.value = Object.values(value).reduce(
        (total, answer, index) =>
          total + (answer === shuffledQuestions.value[index]?.answer ? 1 : 0),
        0,
      );
      allAnswered.value = true;
      playSound("success");
    }
  },
  { deep: true },
);

const handleAnswerSelection = (questionIndex: number, answer: string) => {
  const correct = answer === shuffledQuestions.value[questionIndex]?.answer;
  answerFeedback.value = correct ? "correct" : "incorrect";
  playSound(correct ? "correct" : "failure");

  attemptedQuestions.value = {
    ...attemptedQuestions.value,
    [questionIndex]: answer,
  };

  window.setTimeout(() => {
    answerFeedback.value = null;
    if (questionIndex < shuffledQuestions.value.length - 1) {
      activeQuestion.value = questionIndex + 1;
      shuffledOptions.value = shuffle([...props.questions.options]);
    }
  }, 1000);
};

const resetActivity = () => {
  initialize();
};

const resultRows = computed(() =>
  shuffledQuestions.value.map((question, index) => {
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
      class="flex flex-1 flex-col items-center justify-between overflow-auto p-4"
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
            <p class="font-medium">{{ ui.formatQuestion(index + 1) }}</p>
            <div class="mt-1 flex flex-col gap-1 text-sm">
              <p>{{ row.question.question }}</p>
              <span v-if="props.feedback === 'wrong-correct-answers'">
                {{ ui.correctAnswer }} <strong>{{ row.question.answer }}</strong>
              </span>
              <span v-if="!row.isCorrect && row.userAnswer" class="text-red-600">
                {{ ui.yourAnswer }} <strong>{{ row.userAnswer }}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 w-full">
        <ActivityResults
          :score="score"
          :total="shuffledQuestions.length"
          :onRestart="resetActivity"
        />
      </div>
    </div>

    <div v-else class="flex h-full flex-col gap-4">
      <div class="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
        <LeftNotesWithImages :notes="props.questions.notes" :image="props.questions.image" />

        <div class="flex h-full w-full flex-col justify-between rounded-xl bg-white p-6">
          <div class="flex h-full flex-col justify-between gap-4">
            <div class="p-4 text-lg leading-loose">
              <span>{{ `${activeQuestion + 1}. ${shuffledQuestions[activeQuestion]?.question || ""}` }}</span>

              <div class="mt-4">
                <div class="grid grid-cols-2 gap-3">
                  <Button
                    v-for="(option, optionIndex) in shuffledOptions"
                    :key="optionIndex"
                    :variant="attemptedQuestions[activeQuestion] === option ? 'default' : 'outline'"
                    :disabled="!!attemptedQuestions[activeQuestion]"
                    :class="
                      cn('w-full justify-start px-4 py-4 text-left', {
                        'bg-green-500':
                          answerFeedback === 'correct' && attemptedQuestions[activeQuestion] === option,
                        'bg-red-500':
                          answerFeedback === 'incorrect' && attemptedQuestions[activeQuestion] === option,
                      })
                    "
                    @click="handleAnswerSelection(activeQuestion, option)"
                  >
                    {{ option }}
                  </Button>
                </div>

                <div class="mt-4 text-center">
                  <p
                    v-if="answerFeedback"
                    :class="
                      cn('mt-2 text-lg font-bold', {
                        'text-green-600': answerFeedback === 'correct',
                        'text-red-600': answerFeedback === 'incorrect',
                      })
                    "
                  >
                    {{ answerFeedback === "correct" ? `${ui.correct}!` : `${ui.incorrect}!` }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex justify-center gap-4">
          <button
            v-for="(question, index) in shuffledQuestions"
            :key="index"
            type="button"
            :class="
              cn(
                'flex h-10 w-10 items-center justify-center rounded-lg bg-picton-blue-200',
                {
                  'bg-lemon-200': attemptedQuestions[index] !== '',
                },
              )
            "
            :style="{ cursor: !answerFeedback ? 'pointer' : 'default' }"
            @click="!answerFeedback && (activeQuestion = index)"
          >
            <template v-if="attemptedQuestions[index] !== ''">
              {{ attemptedQuestions[index] === question.answer ? "✓" : "✕" }}
            </template>
          </button>
        </div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
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
