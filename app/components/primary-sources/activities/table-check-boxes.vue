<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Question = {
  id: string;
  text: string;
  image?: string;
};

type CellState = {
  rowIndex: number;
  cellIndex: number;
  isChecked: boolean;
  correctAnswer: boolean;
  isCorrect?: boolean;
};

type Props = {
  questions: {
    title: string;
    image?: string;
    rowQuestions: Question[];
    columnQuestions: Question[];
    correctAnswers: Record<string, Record<string, boolean>>;
  };
  feedback?: FeedbackType;
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const cellStates = ref<CellState[]>([]);
const showResults = ref(false);
const score = ref(0);
const resultsDialogOpen = ref(false);
const rowResults = ref<boolean[]>([]);

const initializeCells = () => {
  const cells: CellState[] = [];
  props.questions.rowQuestions.forEach((row, rowIndex) => {
    props.questions.columnQuestions.forEach((column, cellIndex) => {
      cells.push({
        rowIndex,
        cellIndex,
        isChecked: false,
        correctAnswer: props.questions.correctAnswers[row.id]?.[column.id] || false,
      });
    });
  });
  cellStates.value = cells;
};

watch(
  () => [props.questions.rowQuestions, props.questions.columnQuestions, props.questions.correctAnswers],
  initializeCells,
  { deep: true, immediate: true },
);

const allAnswered = computed(
  () => cellStates.value.length > 0 && cellStates.value.every((cell) => cell.isChecked !== null),
);

const getCellState = (rowIndex: number, cellIndex: number) =>
  cellStates.value.find((cell) => cell.rowIndex === rowIndex && cell.cellIndex === cellIndex);

const isRowCorrect = (rowIndex: number) =>
  cellStates.value
    .filter((cell) => cell.rowIndex === rowIndex)
    .every((cell) => cell.isChecked === cell.correctAnswer);

const handleCellClick = (rowIndex: number, cellIndex: number) => {
  cellStates.value = cellStates.value.map((cell) =>
    cell.rowIndex === rowIndex && cell.cellIndex === cellIndex
      ? { ...cell, isChecked: !cell.isChecked }
      : cell,
  );
  playSound("click");
};

const checkAnswers = () => {
  cellStates.value = cellStates.value.map((cell) => ({
    ...cell,
    isCorrect: cell.isChecked === cell.correctAnswer,
  }));

  const results = props.questions.rowQuestions.map((_, rowIndex) => isRowCorrect(rowIndex));
  rowResults.value = results;
  score.value = results.filter(Boolean).length;
  playSound("success");
  resultsDialogOpen.value = true;
};

const resetActivity = () => {
  cellStates.value = cellStates.value.map((cell) => ({
    ...cell,
    isChecked: false,
    isCorrect: undefined,
  }));
  showResults.value = false;
  score.value = 0;
  resultsDialogOpen.value = false;
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex h-full flex-col gap-4">
      <div v-if="props.questions.image" class="mx-auto max-w-sm">
        <img :src="props.questions.image" alt="Activity Image" class="h-auto w-full rounded-lg">
      </div>

      <div class="overflow-auto rounded-lg bg-picton-blue-100">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="rounded-tl-lg bg-picton-blue-500 p-3 text-center font-semibold text-white" />
              <th
                v-for="(column, index) in props.questions.columnQuestions"
                :key="column.id"
                :class="
                  cn(
                    'bg-picton-blue-500 p-3 text-center text-xl font-semibold text-white',
                    {
                      'rounded-tr-lg': index === props.questions.columnQuestions.length - 1,
                    },
                  )
                "
              >
                {{ column.text }}
              </th>
              <th v-if="showResults" class="w-16 p-3" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in props.questions.rowQuestions" :key="row.id">
              <td
                :class="
                  cn('bg-picton-blue-200 p-3 text-xl text-picton-blue-700', {
                    'border-b border-picton-blue-300': rowIndex !== props.questions.rowQuestions.length - 1,
                    'rounded-bl-lg': rowIndex === props.questions.rowQuestions.length - 1,
                  })
                "
              >
                <img v-if="row.image" :src="row.image" :alt="row.text" class="h-14 md:h-20">
                <p class="whitespace-pre-line" v-html="row.text" />
              </td>

              <td
                v-for="(column, cellIndex) in props.questions.columnQuestions"
                :key="`${row.id}-${column.id}`"
                :class="
                  cn(
                    'min-w-[120px] cursor-pointer border-picton-blue-300 bg-picton-blue-50 p-3 transition-colors',
                    {
                      'rounded-br-lg':
                        rowIndex === props.questions.rowQuestions.length - 1 &&
                        cellIndex === props.questions.columnQuestions.length - 1 &&
                        !showResults,
                      border: rowIndex !== props.questions.rowQuestions.length - 1,
                      'border-x': rowIndex === props.questions.rowQuestions.length - 1,
                      'bg-red-100': showResults && rowResults[rowIndex] === false,
                      'bg-green-100': showResults && rowResults[rowIndex] === true,
                    },
                  )
                "
                @click="!showResults && handleCellClick(rowIndex, cellIndex)"
              >
                <div class="flex h-12 items-center justify-center">
                  <div
                    :class="
                      cn(
                        'flex h-8 w-8 items-center justify-center rounded border-2 transition-all',
                        getCellState(rowIndex, cellIndex)?.isChecked
                          ? 'border-picton-blue-500 bg-picton-blue-500 text-white'
                          : 'border-gray-300 bg-white hover:border-picton-blue-300',
                      )
                    "
                  >
                    <span v-if="getCellState(rowIndex, cellIndex)?.isChecked">✓</span>
                  </div>
                </div>
              </td>

              <td
                v-if="showResults"
                :class="
                  cn('w-16 p-3 text-center', {
                    'rounded-br-lg': rowIndex === props.questions.rowQuestions.length - 1,
                  })
                "
              >
                <div class="flex justify-center text-2xl" :class="rowResults[rowIndex] ? 'text-green-600' : 'text-red-600'">
                  {{ rowResults[rowIndex] ? "✓" : "✕" }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ActivityResults
        v-if="showResults"
        :score="score"
        :total="props.questions.rowQuestions.length"
        :onRestart="resetActivity"
      />

      <div v-if="!showResults" class="mt-auto flex justify-end">
        <Button
          :disabled="!allAnswered"
          :style="{ opacity: allAnswered ? 1 : 0, transition: 'opacity 0.3s ease' }"
          class="group gap-2"
          @click="checkAnswers"
        >
          <Icon
            icon="heroicons:sparkles"
            width="18"
            height="18"
            class="text-lemon-700 transition-transform duration-200 group-hover:scale-110 animate-pulse"
          />
          Check Answers
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.rowQuestions.length"
      :open="resultsDialogOpen"
      :onOpenChange="
        (open: boolean) => {
          resultsDialogOpen = open;
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else {
              showResults = true;
            }
          }
        }
      "
    />
  </div>
</template>
