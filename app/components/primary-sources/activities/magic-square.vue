<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import  Input  from "@/components/ui/inputs/input.vue";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { ActivityType, FeedbackType } from "@/lib/types/activity-types";

type Props = {
  questions: {
    title: string;
    notes: string;
    algorithm: ActivityType;
    questions: {
      id: number;
      grid: string[][];
      targetSum: number;
      gridSize: number;
    }[];
  };
  feedback: FeedbackType;
};

const props = defineProps<Props>();
const ui = useActivityUiText();

const userAnswers = ref<Record<number, string[][]>>({});
const showResults = ref(false);
const feedbacks = ref<Record<number, boolean>>({});
const completedQuestions = ref(new Set<number>());
const incorrectQuestions = ref(new Set<number>());
const isComplete = ref(false);

const initializeAnswers = () => {
  const initialAnswers: Record<number, string[][]> = {};
  props.questions.questions.forEach((question) => {
    initialAnswers[question.id] = question.grid.map((row) =>
      row.map((cell) => (cell === "_" ? "" : cell)),
    );
  });
  userAnswers.value = initialAnswers;
};

watch(() => props.questions.questions, initializeAnswers, { immediate: true, deep: true });

const isMagicSquare = (grid: string[][], targetSum: number) => {
  if (!grid.length || grid.length !== grid[0]?.length) return false;

  const size = grid.length;

  for (let row = 0; row < size; row += 1) {
    let rowSum = 0;
    for (let col = 0; col < size; col += 1) {
      const value = Number.parseInt(grid[row][col], 10);
      if (Number.isNaN(value)) return false;
      rowSum += value;
    }
    if (rowSum !== targetSum) return false;
  }

  for (let col = 0; col < size; col += 1) {
    let colSum = 0;
    for (let row = 0; row < size; row += 1) {
      colSum += Number.parseInt(grid[row][col], 10);
    }
    if (colSum !== targetSum) return false;
  }

  let mainDiagonal = 0;
  let antiDiagonal = 0;
  for (let index = 0; index < size; index += 1) {
    mainDiagonal += Number.parseInt(grid[index][index], 10);
    antiDiagonal += Number.parseInt(grid[index][size - 1 - index], 10);
  }

  return mainDiagonal === targetSum && antiDiagonal === targetSum;
};

const handleInputChange = (questionId: number, row: number, col: number, value: string) => {
  userAnswers.value = {
    ...userAnswers.value,
    [questionId]: userAnswers.value[questionId].map((currentRow, rowIndex) =>
      rowIndex === row
        ? currentRow.map((cell, colIndex) => (colIndex === col ? value : cell))
        : currentRow,
    ),
  };
};

const handleSubmit = () => {
  const nextFeedbacks: Record<number, boolean> = {};
  const nextCompleted = new Set<number>();
  const nextIncorrect = new Set<number>();

  props.questions.questions.forEach((question) => {
    const correct = isMagicSquare(userAnswers.value[question.id], question.targetSum);
    nextFeedbacks[question.id] = correct;
    if (correct) nextCompleted.add(question.id);
    else nextIncorrect.add(question.id);
  });

  feedbacks.value = nextFeedbacks;
  completedQuestions.value = nextCompleted;
  incorrectQuestions.value = nextIncorrect;
  showResults.value = true;
  isComplete.value = true;
};

const handleRestart = () => {
  initializeAnswers();
  showResults.value = false;
  feedbacks.value = {};
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
  isComplete.value = false;
};

const score = computed(() => ({
  correct: completedQuestions.value.size,
  total: props.questions.questions.length,
}));

const allCellsFilled = computed(() =>
  props.questions.questions.every((question) => {
    const originalGrid = question.grid;
    const currentGrid = userAnswers.value[question.id];

    if (!currentGrid) return false;

    return originalGrid.every((row, rowIndex) =>
      row.every((cell, colIndex) => (cell === "_" ? currentGrid[rowIndex][colIndex] !== "" : true)),
    );
  }),
);
</script>

<template>
  <div>
    <ActivityTitle :title="props.questions.title" />

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div
        v-for="question in props.questions.questions"
        :key="question.id"
        :class="
          cn(
            'rounded-lg border p-4 transition-colors',
            showResults
              ? feedbacks[question.id]
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white',
          )
        "
      >
        <div class="flex items-center justify-between">
          <div
            :class="[
              'h-6 w-6 rounded-full',
              userAnswers[question.id]?.every((row) => row.every((cell) => cell !== ''))
                ? 'bg-picton-blue-500'
                : 'bg-gray-200',
            ]"
          />
          <div class="flex items-center gap-2">
            <span class="text-2xl font-bold">{{ question.targetSum }}</span>
            <span v-if="showResults" :class="feedbacks[question.id] ? 'text-green-600' : 'text-red-600'">
              {{ feedbacks[question.id] ? "✓" : "✕" }}
            </span>
          </div>
        </div>

        <div class="flex justify-center">
          <div
            :class="[
              'grid w-fit gap-1 rounded-lg border-2 border-neutral-400 bg-white p-1 sm:p-2',
              (question.gridSize || question.grid.length) === 3 ? 'grid-cols-3' : 'grid-cols-4',
            ]"
          >
            <template
              v-for="(row, rowIndex) in (userAnswers[question.id] || question.grid)"
              :key="`row-${question.id}-${rowIndex}`"
            >
              <Input
                v-for="(cell, colIndex) in row"
                :key="`${question.id}-${rowIndex}-${colIndex}`"
                :model-value="cell"
                type="number"
                removeArrows
                :disabled="question.grid[rowIndex][colIndex] !== '_' || showResults"
                :class="
                  cn(
                    'rounded-lg border-2 text-center font-semibold !text-2xl !opacity-100',
                    (question.gridSize || question.grid.length) === 3
                      ? 'h-12 w-12 sm:h-16 sm:w-16'
                      : 'h-10 w-10 !px-0 sm:h-12 sm:w-12',
                    question.grid[rowIndex][colIndex] !== '_'
                      ? 'border-none bg-picton-blue-100 text-picton-blue-700'
                      : showResults
                        ? feedbacks[question.id]
                          ? 'border-green-500 bg-green-50 text-green-800'
                          : 'border-red-500 bg-red-50 text-red-800'
                        : 'border-neutral-400 bg-white focus:border-picton-blue-300 focus:ring-1 focus:ring-picton-blue-300',
                  )
                "
                @update:model-value="
                  (value) => handleInputChange(question.id, rowIndex, colIndex, String(value ?? ''))
                "
              />
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!showResults" class="flex justify-end">
      <Button
        :disabled="!allCellsFilled"
        variant="brand-lemon"
        @click="handleSubmit"
        class="group gap-2"
      >
        <Icon
          icon="heroicons:sparkles"
          width="18"
          height="18"
          class="text-lemon-700 transition-transform duration-200 group-hover:scale-110 animate-pulse"
        />
        {{ ui.checkAnswers }}
      </Button>
    </div>

    <ActivityResults
      v-if="showResults"
      className="mt-6"
      :score="score.correct"
      :total="score.total"
      :onRestart="handleRestart"
    />

    <ActivityResultsAlertDialog
      v-if="showResults"
      :score="score.correct"
      :total="score.total"
      :open="isComplete"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            isComplete = false;
          }
        }
      "
    />
  </div>
</template>
