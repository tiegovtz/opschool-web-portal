<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ActivityTitle from "~/components/templates/activity-title";
import { cn } from "~/utilities/utils";
import { useExamContext } from "~/shared/context/exam-context";

type Question = {
  id: string;
  text: string;
  image?: string;
};

type CellState = {
  rowId: string;
  columnId: string;
  isChecked: boolean;
  correctAnswer: boolean;
};

type ExamTableCheckBoxesProps = {
  questions: {
    title: string;
    image?: string;
    rowQuestions: Question[];
    columnQuestions: Question[];
    correctAnswers: Record<string, Record<string, boolean>>;
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const props = defineProps<ExamTableCheckBoxesProps>();

const ui = useActivityUiText();
const cellStates = ref<CellState[]>(
  props.questions.rowQuestions.flatMap((row) =>
    props.questions.columnQuestions.map((column) => ({
      rowId: row.id,
      columnId: column.id,
      isChecked: false,
      correctAnswer: props.questions.correctAnswers[row.id]?.[column.id] || false,
    })),
  ),
);
const activityInstructionsId = "exam-table-checkboxes-instructions";

const { collectAnswers, updateActivityScore } = useExamContext();

const totalQuestions = computed(() => props.questions.rowQuestions.length);

const calculateScore = () => {
  let score = 0;

  props.questions.rowQuestions.forEach((row) => {
    const rowCells = cellStates.value.filter((cell) => cell.rowId === row.id);
    if (rowCells.every((cell) => cell.isChecked === cell.correctAnswer)) {
      score++;
    }
  });

  return { score };
};

const prepareDetailedAnswers = () =>
  props.questions.rowQuestions.map((row) => {
    const rowCells = cellStates.value.filter((cell) => cell.rowId === row.id);
    const isRowCorrect = rowCells.every((cell) => cell.isChecked === cell.correctAnswer);

    const userAnswer = rowCells
      .filter((cell) => cell.isChecked)
      .map((cell) => props.questions.columnQuestions.find((column) => column.id === cell.columnId)?.text || "")
      .filter(Boolean)
      .join(", ");

    const correctAnswer = rowCells
      .filter((cell) => cell.correctAnswer)
      .map((cell) => props.questions.columnQuestions.find((column) => column.id === cell.columnId)?.text || "")
      .filter(Boolean)
      .join(", ");

    return {
      questionId: row.id,
      question: row.text,
      image: row.image || "",
      userAnswer: userAnswer || "No answers selected",
      correctAnswer: correctAnswer || "No correct answers",
      isCorrect: isRowCorrect,
    };
  });

watch(
  cellStates,
  () => {
    const rowsWithAnswers = new Set(
      cellStates.value.filter((cell) => cell.isChecked).map((cell) => cell.rowId),
    );

    props.onStateUpdate?.(totalQuestions.value, rowsWithAnswers.size);
  },
  { deep: true },
);

watch(
  [cellStates, collectAnswers],
  () => {
    if (!collectAnswers.value || !cellStates.value.length) return;

    const { score } = calculateScore();
    updateActivityScore(props.activityIndex, {
      activityId: props.activityId,
      activityIndex: props.activityIndex,
      score,
      totalQuestions: totalQuestions.value,
      answers: prepareDetailedAnswers(),
      columnQuestions: props.questions.columnQuestions,
    });
  },
  { deep: true },
);

const handleCellClick = (rowId: string, columnId: string) => {
  cellStates.value = cellStates.value.map((cell) =>
    cell.rowId === rowId && cell.columnId === columnId
      ? { ...cell, isChecked: !cell.isChecked }
      : cell,
  );
};

const getCellState = (rowId: string, columnId: string) =>
  cellStates.value.find((cell) => cell.rowId === rowId && cell.columnId === columnId);

const hasRowAnswers = (rowId: string) =>
  cellStates.value.some((cell) => cell.rowId === rowId && cell.isChecked);
</script>

<template>
  <section
    class="flex h-full flex-col rounded-b-xl bg-white shadow-sm"
    aria-labelledby="exam-table-checkboxes-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="exam-table-checkboxes-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila kisanduku cha jedwali. Tumia enter au space kuweka au kuondoa alama ya tiki."
          : "Use Tab to move through each table checkbox. Use Enter or Space to check or uncheck it."
      }}
    </p>
    <div class="flex-1 overflow-y-auto p-4">
      <div class="space-y-4">
        <div class="overflow-x-auto rounded-lg border bg-gray-50">
          <table class="w-full border-collapse" :aria-describedby="activityInstructionsId">
            <thead>
              <tr>
                <th class="rounded-tl-lg bg-picton-blue-500 p-4 text-center font-semibold text-white" />
                <th
                  v-for="(column, index) in props.questions.columnQuestions"
                  :key="column.id"
                  :class="
                    cn(
                      'bg-picton-blue-500 p-4 text-center text-lg font-semibold text-white',
                      { 'rounded-tr-lg': index === props.questions.columnQuestions.length - 1 },
                    )
                  "
                >
                  {{ column.text }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in props.questions.rowQuestions"
                :key="row.id"
                :class="
                  cn(
                    'border-b border-gray-200 last:border-b-0',
                    { 'bg-picton-blue-50': hasRowAnswers(row.id) },
                  )
                "
              >
                <td
                  :class="
                    cn(
                      'flex flex-col items-center gap-2 border-r border-gray-200 bg-picton-blue-100 p-4 font-medium text-picton-blue-800',
                      { 'rounded-bl-lg': rowIndex === props.questions.rowQuestions.length - 1 },
                    )
                  "
                >
                  <img
                    v-if="row.image"
                    :src="row.image"
                    :alt="row.text"
                    class="h-14 md:h-20"
                  >
                  <p class="whitespace-pre-line" v-html="row.text" />
                </td>

                <td
                  v-for="(column, cellIndex) in props.questions.columnQuestions"
                  :key="`${row.id}-${column.id}`"
                  :class="
                    cn(
                      'min-w-[120px] cursor-pointer bg-white p-4 transition-colors hover:bg-gray-50',
                      {
                        'border-r border-gray-200': cellIndex !== props.questions.columnQuestions.length - 1,
                        'rounded-br-lg':
                          rowIndex === props.questions.rowQuestions.length - 1 &&
                          cellIndex === props.questions.columnQuestions.length - 1,
                      },
                    )
                  "
                >
                  <div class="flex h-12 items-center justify-center">
                    <button
                      type="button"
                      :aria-pressed="getCellState(row.id, column.id)?.isChecked"
                      :aria-label="ui.isSwahili ? `${row.text}, ${column.text}` : `${row.text}, ${column.text}`"
                      class="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2"
                      @click="handleCellClick(row.id, column.id)"
                    >
                      <div
                      :class="
                        cn(
                          'flex h-8 w-8 items-center justify-center rounded border-2 transition-all',
                          getCellState(row.id, column.id)?.isChecked
                            ? 'border-picton-blue-500 bg-picton-blue-500'
                            : 'border-gray-300 bg-white hover:border-picton-blue-300',
                        )
                      "
                    >
                      <span
                        v-if="getCellState(row.id, column.id)?.isChecked"
                        class="text-white"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      </div>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
