<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CircularTimer from "@/components/ui/circular-timer";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type MultipleChoiceQuestion = {
  id: string;
  question: string;
  questionImage?: string;
  options: string[];
  correctAnswer: string;
  time?: number;
};

type Props = {
  questions: {
    title: string;
    questions: MultipleChoiceQuestion[];
  };
  feedback?: FeedbackType;
  timePerQuestion?: number;
};

type UserAnswer = {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "none",
  timePerQuestion: 40,
});

const currentQuestionIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const showFeedback = ref(false);
const score = ref(0);
const gameComplete = ref(false);
const timeLeft = ref(props.timePerQuestion);
const isTimerActive = ref(true);
const questionStartTime = ref(Date.now());
const userAnswers = ref<UserAnswer[]>([]);
const showResults = ref(false);
const answerFeedback = ref<"correct" | "incorrect" | null>(null);

const { playSound } = useSoundEffects();

const currentQuestion = computed(
  () => props.questions.questions[currentQuestionIndex.value],
);
const totalQuestions = computed(() => props.questions.questions.length);

const currentQuestionTime = computed(
  () => currentQuestion.value?.time || props.timePerQuestion,
);

let timerId: ReturnType<typeof setInterval> | null = null;

const clearTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

const nextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value += 1;
    selectedAnswer.value = null;
    showFeedback.value = false;
    answerFeedback.value = null;
    isTimerActive.value = true;
    questionStartTime.value = Date.now();
    return;
  }

  gameComplete.value = true;
  playSound("success");
};

const handleTimeUp = () => {
  if (!currentQuestion.value || showFeedback.value || gameComplete.value) return;

  isTimerActive.value = false;
  showFeedback.value = true;
  answerFeedback.value = "incorrect";
  playSound("failure");

  userAnswers.value.push({
    questionId: currentQuestion.value.id,
    selectedAnswer: "",
    isCorrect: false,
    timeSpent: Date.now() - questionStartTime.value,
  });

  setTimeout(() => {
    nextQuestion();
  }, 1500);
};

const handleAnswerSelect = (answer: string) => {
  if (!currentQuestion.value || selectedAnswer.value || showFeedback.value) return;

  selectedAnswer.value = answer;
  isTimerActive.value = false;
  showFeedback.value = true;

  const isCorrect = answer === currentQuestion.value.correctAnswer;
  answerFeedback.value = isCorrect ? "correct" : "incorrect";

  if (isCorrect) {
    score.value += 1;
    playSound("correct");
  } else {
    playSound("failure");
  }

  userAnswers.value.push({
    questionId: currentQuestion.value.id,
    selectedAnswer: answer,
    isCorrect,
    timeSpent: Date.now() - questionStartTime.value,
  });

  setTimeout(() => {
    nextQuestion();
  }, 1500);
};

const resetGame = () => {
  clearTimer();
  currentQuestionIndex.value = 0;
  selectedAnswer.value = null;
  showFeedback.value = false;
  answerFeedback.value = null;
  score.value = 0;
  gameComplete.value = false;
  showResults.value = false;
  userAnswers.value = [];
  isTimerActive.value = true;
  questionStartTime.value = Date.now();
  timeLeft.value = props.questions.questions[0]?.time || props.timePerQuestion;
};

const handleResultsDialogChange = (open: boolean) => {
  if (open) return;

  if (props.feedback === "none") {
    resetGame();
  } else {
    showResults.value = true;
  }

  gameComplete.value = false;
};

watch(
  currentQuestionTime,
  (value) => {
    timeLeft.value = value;
  },
  { immediate: true },
);

watch(
  () => [isTimerActive.value, showFeedback.value, gameComplete.value, currentQuestionIndex.value],
  ([active, feedbackVisible, complete]) => {
    clearTimer();

    if (!active || feedbackVisible || complete) return;

    timerId = setInterval(() => {
      if (timeLeft.value <= 1) {
        timeLeft.value = 0;
        clearTimer();
        handleTimeUp();
        return;
      }

      timeLeft.value -= 1;
    }, 1000);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  clearTimer();
});

const resultsSummary = computed(() =>
  userAnswers.value
    .map((answer) => {
      const question = props.questions.questions.find((item) => item.id === answer.questionId);
      if (!question) return null;

      return {
        ...answer,
        question,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item),
);
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title || 'Speed Quiz Challenge'" />

    <div v-if="showResults" class="flex-1 flex flex-col items-center justify-between gap-6 overflow-hidden p-6">
      <div class="w-full space-y-3">
        <div
          v-for="(item, index) in resultsSummary"
          :key="item.questionId"
          :class="
            cn(
              'rounded-lg border-2 p-4',
              item.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50',
            )
          "
        >
          <div class="flex items-start gap-3">
            <div
              :class="
                cn(
                  'mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  item.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
                )
              "
            >
              <Icon :icon="item.isCorrect ? 'mdi:check' : 'mdi:close'" width="18" height="18" />
            </div>

            <div class="flex-1 space-y-2">
              <p class="font-semibold">Question {{ index + 1 }}</p>
              <p>{{ item.question.question }}</p>

              <div class="space-y-1 text-sm">
                <div v-if="props.feedback === 'wrong-correct' && item.selectedAnswer">
                  <strong>Your Answer:</strong> {{ item.selectedAnswer }}
                </div>
                <div class="flex items-center gap-2">
                  <Icon icon="mdi:clock-outline" width="16" height="16" />
                  <span>Time: {{ (item.timeSpent / 1000).toFixed(1) }}s</span>
                </div>

                <template v-if="props.feedback === 'wrong-correct-answers'">
                  <div><strong>Correct Answer:</strong> {{ item.question.correctAnswer }}</div>
                  <div v-if="!item.isCorrect && item.selectedAnswer" class="text-red-600">
                    <strong>Your Answer:</strong> {{ item.selectedAnswer }}
                  </div>
                  <div v-if="!item.selectedAnswer" class="text-red-600">
                    <strong>Time expired - No answer given</strong>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full">
        <ActivityResults
          :score="score"
          :total="totalQuestions"
          :on-restart="resetGame"
        />
      </div>
    </div>

    <div v-else class="flex h-full flex-col gap-4">
      <div class="flex-1 rounded-xl bg-white p-4 shadow-sm md:p-6">
        <div v-if="currentQuestion" class="flex h-full flex-col justify-between gap-6">
          <div class="h-full">
            <div class="w-full text-lg leading-loose md:p-4">
              <div class="flex flex-col gap-4 md:flex-row">
                <p
                  :class="
                    cn('text-picton-blue-700', {
                      'w-3/4': currentQuestion.questionImage && currentQuestion.question,
                    })
                  "
                >
                  {{ currentQuestionIndex + 1 }}. {{ currentQuestion.question }}
                </p>

                <div
                  v-if="currentQuestion.questionImage"
                  :class="
                    cn('max-h-96 rounded-lg', {
                      'w-full': !currentQuestion.question,
                      'w-1/2': currentQuestion.question,
                    })
                  "
                >
                  <img
                    :src="currentQuestion.questionImage"
                    alt="Question Image"
                    class="h-full w-full rounded-lg object-contain"
                  />
                </div>
              </div>

              <div class="mt-6">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Button
                    v-for="(option, index) in currentQuestion.options"
                    :key="`${currentQuestion.id}-${index}`"
                    :class="
                      cn(
                        'min-h-16 h-auto border-none bg-picton-blue-100 p-4 text-left text-lg font-medium text-picton-blue-700 text-wrap justify-start shadow-md transition-all duration-300 hover:bg-picton-blue-200 hover:shadow-lg md:min-h-24',
                        {
                          'bg-green-100 text-green-700':
                            (showFeedback && option === currentQuestion.correctAnswer && props.feedback === 'wrong-correct-answers') ||
                            (selectedAnswer === option && option === currentQuestion.correctAnswer),
                          'bg-red-50 text-red-700': showFeedback && selectedAnswer === option && option !== currentQuestion.correctAnswer,
                          'cursor-not-allowed pointer-events-none': showFeedback,
                        },
                      )
                    "
                    @click="handleAnswerSelect(option)"
                  >
                    {{ option }}
                  </Button>
                </div>

                <div class="mt-6 text-center">
                  <p
                    v-if="answerFeedback"
                    :class="
                      cn('text-lg font-bold', {
                        'text-green-600': answerFeedback === 'correct',
                        'text-red-600': answerFeedback === 'incorrect',
                      })
                    "
                  >
                    {{
                      timeLeft === 0
                        ? "Time's up!"
                        : answerFeedback === "correct"
                          ? "Correct!"
                          : "Incorrect!"
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CircularTimer
        :time-left="timeLeft"
        :total-time-limit="currentQuestionTime"
        :is-timer-active="isTimerActive"
        :play-timer-sounds="false"
        sound-trigger-type="single-question"
      />

      <div class="flex items-center justify-between">
        <div class="flex flex-wrap justify-center gap-4">
          <div
            v-for="(_, index) in props.questions.questions"
            :key="index"
            :class="
              cn('flex h-10 w-10 items-center justify-center rounded-lg', {
                'bg-lemon-200': index < userAnswers.length,
                'bg-picton-blue-200': index >= userAnswers.length,
                'border-2 border-picton-blue-500': index === currentQuestionIndex && index >= userAnswers.length,
              })
            "
          >
            <Icon
              v-if="index < userAnswers.length"
              :icon="userAnswers[index]?.isCorrect ? 'mdi:check' : 'mdi:close'"
              :class="userAnswers[index]?.isCorrect ? 'text-green-500' : 'text-red-500'"
              width="24"
              height="24"
            />
          </div>
        </div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="totalQuestions"
      :open="gameComplete"
      :on-open-change="handleResultsDialogChange"
    />
  </div>
</template>
