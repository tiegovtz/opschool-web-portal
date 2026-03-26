<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { cn, shuffle } from "@/lib/utils";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper";
import type { GameStats } from "@/components/ui/game-mode";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Question = {
  id: string;
  min: number;
  max: number;
  numbers: number[];
  correctOrder: number[];
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: Question[];
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
};

type DragEndEvent = {
  active: {
    id: string;
  };
  over?: {
    id: string;
  };
};

const props = defineProps<Props>();

const currentQuestionIndex = ref(0);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const gameComplete = ref(false);
const completedQuestions = ref(new Set<number>());
const incorrectQuestions = ref(new Set<number>());
const questionState = ref<{
  id: string;
  availableNumbers: (number | string)[];
  answer: (number | string)[];
}>({
  id: "",
  availableNumbers: [],
  answer: [],
});

const { playSound } = useSoundEffects();

const currentQuestion = computed(
  () => props.questions.questions[currentQuestionIndex.value],
);
const totalQuestions = computed(() => props.questions.questions.length);
const isGameMode = computed(() => props.questions.isGameMode || false);
const gameTimeLimit = computed(() => props.questions.gameTimeLimit || 300);

watch(
  currentQuestion,
  (value) => {
    if (!value) return;

    questionState.value = {
      id: value.id,
      availableNumbers: shuffle([...value.numbers]),
      answer: Array(value.numbers.length).fill(""),
    };
  },
  { immediate: true },
);

watch(
  () => [...questionState.value.answer],
  (value) => {
    if (!currentQuestion.value || value.some((item) => !item)) return;

    const isCorrect =
      value.length === currentQuestion.value.correctOrder.length &&
      value.every((item, index) => item === currentQuestion.value.correctOrder[index]);

    const nextCompletedQuestions = new Set(completedQuestions.value);
    nextCompletedQuestions.add(currentQuestionIndex.value);
    completedQuestions.value = nextCompletedQuestions;

    if (!isCorrect) {
      const nextIncorrectQuestions = new Set(incorrectQuestions.value);
      nextIncorrectQuestions.add(currentQuestionIndex.value);
      incorrectQuestions.value = nextIncorrectQuestions;
    } else {
      score.value += 1;
    }

    playSound(isCorrect ? "success" : "failure");

    setTimeout(() => {
      if (currentQuestionIndex.value < totalQuestions.value - 1) {
        currentQuestionIndex.value += 1;
        return;
      }

      allAnswered.value = true;
      gameComplete.value = true;
    }, 1500);
  },
);

const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over) return;

    const activeParts = String(event.active.id).split("%");
    const overParts = String(event.over.id).split("%");

    const activeQuestionId = activeParts[0];
    const overQuestionId = overParts[0];

    if (activeQuestionId !== questionState.value.id || overQuestionId !== questionState.value.id) {
      return;
    }

    const number = Number(activeParts[1]);
    const slotIndex = Number(overParts[1]);

    if (!Number.isFinite(number) || !Number.isFinite(slotIndex)) return;

    questionState.value = {
      ...questionState.value,
      availableNumbers: questionState.value.availableNumbers.map((item) =>
        item === number ? "" : item,
      ),
      answer: questionState.value.answer.map((item, index) => {
        if (index === slotIndex) return number;
        if (item === number) return "";
        return item;
      }),
    };
};

const handleTimeUp = () => {
  if (!gameComplete.value) {
    gameComplete.value = true;
    showResults.value = true;
  }
};

const handleGameComplete = (_stats: GameStats) => {
  gameComplete.value = true;
  showResults.value = true;
};

const resetActivity = () => {
  currentQuestionIndex.value = 0;
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  gameComplete.value = false;
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
};

const handleResultsDialogChange = (open: boolean) => {
  if (!open) {
    showResults.value = true;
  }
};
</script>

<template>
  <div v-if="!currentQuestion" class="flex h-full items-center justify-center">
    <div class="text-center">
      <h2 class="mb-4 text-2xl font-bold text-gray-800">No questions available</h2>
      <p class="text-gray-600">Please check the activity configuration.</p>
    </div>
  </div>

  <GameModeWrapper
    v-else
    class="h-full flex flex-col"
    :is-game-mode="isGameMode"
    :total-questions="totalQuestions"
    :completed-questions="completedQuestions"
    :incorrect-questions="incorrectQuestions"
    :total-time-limit="gameTimeLimit"
    :on-time-up="handleTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <ActivityTitle :title="props.questions.title" />

    <div class="h-full flex-1">
      <DNDContext :on-drag-end="showResults ? () => {} : handleDragEnd">
        <div
          :class="
            cn(
              'relative flex items-center gap-4 rounded-lg border bg-white p-6 transition-all duration-300',
              showResults && allAnswered
                ? score === totalQuestions
                  ? 'border-green-200 bg-green-50'
                  : 'border-yellow-200 bg-yellow-50'
                : 'border-gray-200',
            )
          "
        >
          <div class="flex flex-1 flex-col gap-6">
            <div
              v-if="questionState.availableNumbers.some((value) => value)"
              class="flex flex-1 flex-wrap gap-2 xl:gap-6"
            >
              <template v-for="(number, index) in questionState.availableNumbers" :key="index">
                <div
                  v-if="!number"
                  class="min-h-12 flex-1 p-3"
                />

                <Draggable
                  v-else
                  :id="`${questionState.id}%${number}%${index}`"
                  :disabled="showResults"
                  :class="
                    cn(
                      'min-h-12 flex-1 rounded-lg p-3 text-center text-lg font-bold',
                      showResults
                        ? 'cursor-not-allowed bg-gray-200'
                        : 'cursor-move bg-picton-blue-200 hover:bg-picton-blue-300',
                    )
                  "
                >
                  {{ number }}
                </Draggable>
              </template>
            </div>

            <div class="flex flex-1 gap-2 xl:gap-6">
              <template v-for="(number, index) in questionState.answer" :key="index">
                <Draggable
                  v-if="number"
                  :id="`${questionState.id}%${number}%${index}`"
                  :disabled="showResults"
                  :class="
                    cn(
                      'flex flex-1 items-center justify-center rounded-lg p-3 text-lg font-bold',
                      showResults && allAnswered
                        ? number === currentQuestion.correctOrder[index]
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                        : 'cursor-move bg-lemon-100 text-lemon-700',
                    )
                  "
                >
                  {{ number }}
                </Draggable>

                <Droppable
                  v-else
                  :id="`${questionState.id}%${index}`"
                  :class="
                    cn(
                      'min-h-12 flex-1 rounded-lg border-b border-dashed px-2 py-6',
                      showResults ? 'bg-gray-100' : 'bg-picton-blue-100',
                    )
                  "
                  is-over-class-name="bg-lemon-100"
                >
                  {{ questionState.answer[index] }}
                </Droppable>
              </template>
            </div>

            <div
              v-if="
                showResults &&
                allAnswered &&
                props.feedback === 'wrong-correct-answers' &&
                !questionState.answer.every((item, index) => item === currentQuestion.correctOrder[index])
              "
              class="mt-3 rounded-lg border border-green-200 bg-green-50 p-3"
            >
              <p class="mb-2 text-sm text-gray-600">Correct answer:</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(number, index) in currentQuestion.correctOrder"
                  :key="index"
                  class="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                >
                  {{ number }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="showResults && allAnswered"
            :class="
              cn(
                'absolute right-[-0.5rem] top-[-0.5rem] flex h-8 w-8 items-center justify-center rounded-full p-1',
                score === totalQuestions
                  ? 'bg-green-100 text-green-600'
                  : 'bg-yellow-100 text-yellow-600',
              )
            "
          >
            <Icon
              v-if="score === totalQuestions"
              icon="mdi:check"
              width="20"
              height="20"
            />
            <span v-else class="text-xs font-bold">{{ score }}</span>
          </div>
        </div>
      </DNDContext>

      <ActivityResults
        v-if="showResults && !isGameMode"
        :score="score"
        :total="totalQuestions"
        :on-restart="resetActivity"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="totalQuestions"
      :open="allAnswered && !showResults"
      :on-open-change="handleResultsDialogChange"
    />
  </GameModeWrapper>
</template>
