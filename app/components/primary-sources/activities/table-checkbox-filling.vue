<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "~/composables/use-sound-effects";

type InputCell = {
  rowIndex: number;
  cellIndex: number;
  value: string;
  correctAnswer: string;
  isCorrect?: boolean;
};

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    tableTitles: string[];
    questions: {
      title: {
        text: string;
        image?: string;
      };
      question: string[];
      answer: string;
    }[];
  };
  feedback?: FeedbackType;
};

const props = defineProps<Props>();
const answerChecker = new AnswerChecker();
const { playSound } = useSoundEffects();

const shuffledQuestions = ref(props.questions.questions);
const inputCells = ref<InputCell[]>([]);
const showResults = ref(false);
const score = ref(0);
const resultsDialogOpen = ref(false);

const initializeCells = () => {
  const cells: InputCell[] = [];
  shuffledQuestions.value.forEach((row, rowIndex) => {
    row.question.forEach((cell, cellIndex) => {
      if (cell.startsWith("_")) {
        cells.push({
          rowIndex,
          cellIndex,
          value: "",
          correctAnswer: cell.substring(1),
        });
      }
    });
  });

  inputCells.value = cells;
};

watch(() => props.questions.questions, () => {
  shuffledQuestions.value = props.questions.questions;
  initializeCells();
}, { deep: true, immediate: true });

const allAnswered = computed(() => inputCells.value.every((cell) => cell.value.trim() !== ""));

const handleInputChange = (rowIndex: number, cellIndex: number, value: string) => {
  inputCells.value = inputCells.value.map((cell) =>
    cell.rowIndex === rowIndex && cell.cellIndex === cellIndex
      ? { ...cell, value }
      : cell,
  );
};

const getInputCell = (rowIndex: number, cellIndex: number) =>
  inputCells.value.find(
    (cell) => cell.rowIndex === rowIndex && cell.cellIndex === cellIndex,
  );

const checkAnswers = () => {
  let correctCount = 0;
  inputCells.value = inputCells.value.map((cell) => {
    const correct = answerChecker.checkAnswer(cell.value, {
      acceptedAnswers: cell.correctAnswer.split("|"),
    }).isCorrect;

    if (correct) {
      correctCount += 1;
    }

    return { ...cell, isCorrect: correct };
  });

  score.value = correctCount;
  playSound("success");
  resultsDialogOpen.value = true;
};

const resetActivity = () => {
  shuffledQuestions.value = props.questions.questions;
  inputCells.value = inputCells.value.map((cell) => ({
    ...cell,
    value: "",
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
      <div class="overflow-auto rounded-lg bg-picton-blue-100 p-4">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                v-for="(tableTitle, index) in props.questions.tableTitles"
                :key="index"
                :class="
                  cn(
                    'p-3 text-center text-xl font-semibold text-picton-blue-700 bg-picton-blue-200',
                    {
                      'rounded-tr-lg': index === props.questions.tableTitles.length - 1,
                    },
                  )
                "
              >
                {{ tableTitle }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in shuffledQuestions"
              :key="rowIndex"
              :class="
                cn({
                  'border-b border-picton-blue-300': rowIndex !== shuffledQuestions.length - 1,
                })
              "
              :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
            >
              <td
                :class="
                  cn(
                    'bg-picton-blue-200 p-3 text-center font-medium text-picton-blue-700',
                    {
                      'rounded-bl-lg': rowIndex === shuffledQuestions.length - 1,
                      'p-10': !row.title.image,
                      'min-w-[200px]': row.title.image,
                    },
                  )
                "
              >
                <div class="flex flex-col gap-2">
                  <div v-if="row.title.image" class="flex max-h-[210px] max-w-[210px]">
                    <img
                      :src="row.title.image"
                      :alt="row.title.text || ''"
                      class="h-full max-h-[210px] w-full max-w-[210px] object-contain"
                    >
                  </div>
                  <div class="text-lg font-medium">{{ row.title.text }}</div>
                </div>
              </td>

              <td
                v-for="(cell, cellIndex) in row.question"
                :key="cellIndex"
                :class="
                  cn(
                    'min-w-[120px] border-picton-blue-300 bg-picton-blue-50 p-3 text-start',
                    {
                      border: rowIndex !== shuffledQuestions.length - 1,
                      'border-x': rowIndex === shuffledQuestions.length - 1,
                      'rounded-br-lg':
                        rowIndex === shuffledQuestions.length - 1 &&
                        cellIndex === row.question.length - 1,
                    },
                  )
                "
              >
                <div v-if="cell.startsWith('_')" class="w-full">
                  <Input
                    :model-value="getInputCell(rowIndex, cellIndex)?.value || ''"
                    type="text"
                    :disabled="showResults"
                    :class="
                      cn(
                        'border-none bg-transparent focus-visible:ring-0',
                        showResults && {
                          'bg-green-200 text-green-600': getInputCell(rowIndex, cellIndex)?.isCorrect,
                          'bg-red-100 text-red-600': getInputCell(rowIndex, cellIndex)?.isCorrect === false,
                        },
                      )
                    "
                    @update:model-value="
                      (value) => handleInputChange(rowIndex, cellIndex, String(value ?? ''))
                    "
                  />
                  <div
                    :class="
                      cn(
                        'mt-1 border-b border-dashed',
                        showResults
                          ? {
                              'border-green-600': getInputCell(rowIndex, cellIndex)?.isCorrect,
                              'border-red-600': getInputCell(rowIndex, cellIndex)?.isCorrect === false,
                            }
                          : 'border-picton-blue-700',
                      )
                    "
                  />
                  <p
                    v-if="showResults"
                    :class="
                      cn('mt-1 text-center text-sm', {
                        'text-green-600': getInputCell(rowIndex, cellIndex)?.isCorrect,
                        'text-red-600': getInputCell(rowIndex, cellIndex)?.isCorrect === false,
                      })
                    "
                  >
                    {{
                      getInputCell(rowIndex, cellIndex)?.isCorrect
                        ? "Correct!"
                        : props.feedback === "wrong-correct-answers"
                          ? `Correct: ${getInputCell(rowIndex, cellIndex)?.correctAnswer}`
                          : "Incorrect!"
                    }}
                  </p>
                </div>
                <span v-else class="whitespace-pre-line">{{ cell }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showResults" class="mt-4">
        <ActivityResults :score="score" :total="inputCells.length" :onRestart="resetActivity" />
      </div>

      <div v-if="!showResults" class="mt-auto flex justify-end">
        <Button
          :disabled="!allAnswered"
          :style="{ opacity: allAnswered ? 1 : 0, transition: 'opacity 0.3s ease' }"
          @click="checkAnswers"
        >
          Check Answers
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="inputCells.length"
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
