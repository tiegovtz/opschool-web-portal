<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper";
import type { GameStats } from "@/components/ui/game-mode";
import type { FeedbackType } from "@/lib/types/activity-types";
import { missingDefinitionsGameTranspiler } from "@/shared/transpilerMapper/games-transpiler/missing-definitions";
import { useObjects } from "~/composables/useObjects";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  questions: {
    title: string;
    type?: string;
    fontSize?: number;
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
};

type UserAnswer = {
  word: string;
  selectedDefinition: string;
  correctDefinition: string;
  isCorrect: boolean;
  timeStamp: number;
};

type Question = {
  word: string;
  definition: string;
  options: string[];
};

const props = defineProps<Props>();

const { objects, loading, error, refetch } = useObjects({
  type: props.questions.type || null,
  limit: 60,
  autoFetch: true,
});

const gameQuestions = ref<Question[]>([]);
const currentQuestionIndex = ref(0);
const shuffledOptions = ref<string[]>([]);
const userAnswers = ref<UserAnswer[]>([]);
const selectedAnswer = ref<string | null>(null);
const showFeedback = ref(false);
const gameComplete = ref(false);
const completedQuestions = ref(new Set<number>());
const incorrectQuestions = ref(new Set<number>());
const showResults = ref(false);
const showResultsDialog = ref(false);
const answerFeedback = ref<"correct" | "incorrect" | null>(null);
const completedObjectIds = ref<number[]>([]);

const { playSound } = useSoundEffects();

const generateQuestions = () => {
  if (objects.value.length < 10) return;

  const result = missingDefinitionsGameTranspiler({
    objects: objects.value,
    titleDescription: props.questions.title,
  });

  if (result) {
    gameQuestions.value = result.questions;
  }
};

watch(objects, generateQuestions, { immediate: true });

const currentQuestion = computed(() => gameQuestions.value[currentQuestionIndex.value]);
const totalQuestions = computed(() => gameQuestions.value.length);
const correctAnswersCount = computed(
  () => userAnswers.value.filter((item) => item.isCorrect).length,
);

watch(
  currentQuestion,
  (value) => {
    shuffledOptions.value = value ? shuffle([...value.options]) : [];
  },
  { immediate: true },
);

const finishGame = () => {
  gameComplete.value = true;
  showResults.value = true;
  showResultsDialog.value = true;
};

const handleTimeUp = () => {
  if (!gameComplete.value) {
    finishGame();
  }
};

const handleGameComplete = (_stats: GameStats) => {
  finishGame();
};

const handleAnswerSelect = (definition: string) => {
  if (showFeedback.value || !currentQuestion.value) return;

  selectedAnswer.value = definition;
  const isCorrect = definition === currentQuestion.value.definition;
  const nextCompletedQuestions = new Set(completedQuestions.value);
  nextCompletedQuestions.add(currentQuestionIndex.value);
  completedQuestions.value = nextCompletedQuestions;

  if (!isCorrect) {
    const nextIncorrectQuestions = new Set(incorrectQuestions.value);
    nextIncorrectQuestions.add(currentQuestionIndex.value);
    incorrectQuestions.value = nextIncorrectQuestions;
  }

  userAnswers.value.push({
    word: currentQuestion.value.word,
    selectedDefinition: definition,
    correctDefinition: currentQuestion.value.definition,
    isCorrect,
    timeStamp: Date.now(),
  });

  answerFeedback.value = isCorrect ? "correct" : "incorrect";
  showFeedback.value = true;
  playSound(isCorrect ? "correct" : "failure");

  setTimeout(() => {
    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      currentQuestionIndex.value += 1;
      selectedAnswer.value = null;
      showFeedback.value = false;
      answerFeedback.value = null;
      return;
    }

    finishGame();
  }, 1500);
};

const resetActivity = async () => {
  currentQuestionIndex.value = 0;
  userAnswers.value = [];
  selectedAnswer.value = null;
  showFeedback.value = false;
  gameComplete.value = false;
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
  showResults.value = false;
  showResultsDialog.value = false;
  answerFeedback.value = null;

  if (props.questions.isGameMode) {
    const currentObjectIds = objects.value.map((item) => item.id);
    const nextExcludedIds = [...completedObjectIds.value, ...currentObjectIds];
    completedObjectIds.value = nextExcludedIds;
    await refetch(nextExcludedIds);
    return;
  }

  generateQuestions();
};

const handleResultsDialogChange = (open: boolean) => {
  if (!open) {
    showResultsDialog.value = false;
  }
};
</script>

<template>
  <div
    v-if="loading"
    class="flex min-h-[400px] items-center justify-center"
  >
    <div class="text-lg">Loading questions...</div>
  </div>

  <div
    v-else-if="error"
    class="flex min-h-[400px] items-center justify-center"
  >
    <div class="text-lg text-red-500">Error loading questions: {{ error }}</div>
  </div>

  <div
    v-else-if="gameQuestions.length === 0"
    class="flex min-h-[400px] items-center justify-center"
  >
    <div class="text-lg">No questions available</div>
  </div>

  <GameModeWrapper
    v-else
    :is-game-mode="props.questions.isGameMode || false"
    :total-questions="totalQuestions"
    :completed-questions="completedQuestions"
    :incorrect-questions="incorrectQuestions"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleTimeUp"
    :on-game-complete="handleGameComplete"
    :show-timer="props.questions.isGameMode || false"
    :show-progress="props.questions.isGameMode || false"
  >
    <div class="flex h-full flex-col">
      <ActivityTitle :title="props.questions.title" />

      <template v-if="!showResults && !gameComplete">
        <div
          class="relative flex-1 rounded-xl bg-white p-4 shadow-sm"
          :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
        >
          <div v-if="currentQuestion" class="grid h-full grid-cols-1 gap-8 md:grid-cols-2">
            <div class="flex items-center justify-center">
              <div class="rounded-xl border-2 border-picton-blue-200 bg-picton-blue-50 p-8 text-center">
                <h2 class="font-bold text-picton-blue-700">{{ currentQuestion.word }}</h2>
              </div>
            </div>

            <div class="flex flex-col justify-center space-y-4">
              <div class="space-y-3">
                <button
                  v-for="(option, index) in shuffledOptions"
                  :key="`${option}-${index}`"
                  type="button"
                  :disabled="showFeedback"
                  :class="
                    cn(
                      'w-full rounded-lg border-2 p-4 text-left transition-all duration-200',
                      {
                        'border-green-500 bg-green-500 text-white':
                          showFeedback && option === currentQuestion.definition,
                        'border-red-500 bg-red-500 text-white':
                          showFeedback && selectedAnswer === option && option !== currentQuestion.definition,
                        'border-picton-blue-500 bg-picton-blue-500 text-white':
                          selectedAnswer === option && !showFeedback,
                        'border-picton-blue-300 text-picton-blue-700 hover:bg-picton-blue-50':
                          selectedAnswer !== option && !showFeedback,
                        'cursor-not-allowed': showFeedback,
                      },
                    )
                  "
                  @click="handleAnswerSelect(option)"
                >
                  <div class="flex items-center justify-between">
                    <span>{{ option }}</span>
                    <Icon
                      v-if="showFeedback && option === currentQuestion.definition"
                      icon="mdi:check"
                      width="20"
                      height="20"
                    />
                    <Icon
                      v-else-if="showFeedback && selectedAnswer === option && option !== currentQuestion.definition"
                      icon="mdi:close"
                      width="20"
                      height="20"
                    />
                  </div>
                </button>
              </div>

              <div v-if="showFeedback" class="mt-6 text-center">
                <p
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

        <div class="mt-4 flex items-center justify-between">
          <div class="flex justify-center gap-4">
            <div
              v-for="(question, index) in gameQuestions"
              :key="`${question.word}-${index}`"
              :class="
                cn('flex h-10 w-10 items-center justify-center rounded-lg', {
                  'bg-lemon-200': !!userAnswers.find((item) => item.word === question.word),
                  'bg-picton-blue-200': !userAnswers.find((item) => item.word === question.word),
                  'border-2 border-picton-blue-500':
                    index === currentQuestionIndex && !userAnswers.find((item) => item.word === question.word),
                })
              "
            >
              <Icon
                v-if="userAnswers.find((item) => item.word === question.word)"
                :icon="userAnswers.find((item) => item.word === question.word)?.isCorrect ? 'mdi:check' : 'mdi:close'"
                :class="userAnswers.find((item) => item.word === question.word)?.isCorrect ? 'text-green-500' : 'text-red-500'"
                width="24"
                height="24"
              />
            </div>
          </div>
        </div>
      </template>

      <div v-if="showResults" class="w-full space-y-6">
        <div class="w-full space-y-3">
          <div
            v-for="(question, index) in gameQuestions"
            :key="`${question.word}-${index}`"
            :class="
              cn(
                'flex items-center gap-3 rounded-lg border-2 p-4',
                userAnswers.find((item) => item.word === question.word)?.isCorrect
                  ? 'border-green-300 bg-green-50'
                  : 'border-red-300 bg-red-50',
              )
            "
          >
            <div
              :class="
                cn(
                  'mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                  userAnswers.find((item) => item.word === question.word)?.isCorrect
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700',
                )
              "
            >
              <Icon
                :icon="userAnswers.find((item) => item.word === question.word)?.isCorrect ? 'mdi:check' : 'mdi:close'"
                width="18"
                height="18"
              />
            </div>

            <div class="flex-1">
              <p
                :class="
                  cn('font-semibold', {
                    'mb-2': props.feedback === 'wrong-correct-answers',
                  })
                "
              >
                {{ question.word }}
              </p>

              <div v-if="props.feedback === 'wrong-correct-answers'" class="space-y-1 text-sm">
                <div><strong>Correct Definition:</strong> {{ question.definition }}</div>
                <div
                  v-if="userAnswers.find((item) => item.word === question.word) && !userAnswers.find((item) => item.word === question.word)?.isCorrect"
                  class="text-red-600"
                >
                  <strong>Your Answer:</strong>
                  {{ userAnswers.find((item) => item.word === question.word)?.selectedDefinition }}
                </div>
                <div
                  v-if="!userAnswers.find((item) => item.word === question.word)"
                  class="text-red-600"
                >
                  <strong>No answer given</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ActivityResults
          :score="correctAnswersCount"
          :total="totalQuestions"
          :on-restart="resetActivity"
        />
      </div>

      <ActivityResultsAlertDialog
        :open="showResultsDialog"
        :score="correctAnswersCount"
        :total="totalQuestions"
        :on-open-change="handleResultsDialogChange"
      />
    </div>
  </GameModeWrapper>
</template>
