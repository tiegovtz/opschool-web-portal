<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type MediaContent = {
  type: "image" | "video";
  url: string;
  alt: string;
};

type TableQuestion = {
  id: number;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  media?: MediaContent;
  description?: string;
};

type GridAnswer = {
  questionId: number;
  columnIndex: number;
  isChecked: boolean;
  isCorrect?: boolean;
};

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    questionHeader?: string;
    columnHeaders?: string[];
    questions: TableQuestion[];
  };
  feedback?: FeedbackType;
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const answers = ref<GridAnswer[]>([]);
const showResults = ref(false);
const score = ref({ correct: 0, total: 0 });
const allAnswered = ref(false);
const showCorrectAnswers = ref(false);
const shuffledQuestions = ref<TableQuestion[]>([]);

const initializeAnswers = () => {
  answers.value = props.questions.questions.flatMap((question) =>
    question.options.map((_, index) => ({
      questionId: question.id,
      columnIndex: index,
      isChecked: false,
    })),
  );
  shuffledQuestions.value = shuffle([...props.questions.questions]);
  showResults.value = false;
  showCorrectAnswers.value = false;
  allAnswered.value = false;
};

watch(() => props.questions.questions, initializeAnswers, { deep: true, immediate: true });

const toggleAnswer = (questionId: number, columnIndex: number) => {
  answers.value = answers.value.map((answer) => {
    if (answer.questionId !== questionId) return answer;
    if (answer.columnIndex === columnIndex) {
      return { ...answer, isChecked: !answer.isChecked };
    }
    return { ...answer, isChecked: false };
  });
  playSound("click");
};

const answerFor = (questionId: number, columnIndex: number) =>
  answers.value.find(
    (answer) => answer.questionId === questionId && answer.columnIndex === columnIndex,
  );

const checkAnswers = () => {
  let correctCount = 0;

  answers.value = answers.value.map((answer) => {
    const question = props.questions.questions.find((item) => item.id === answer.questionId);
    if (!question) return answer;

    const option = question.options[answer.columnIndex];
    const correct = answer.isChecked && option?.isCorrect;
    if (correct) correctCount += 1;

    return { ...answer, isCorrect: correct };
  });

  score.value = { correct: correctCount, total: props.questions.questions.length };
  allAnswered.value = true;
  playSound("success");
};

watch(
  answers,
  (value) => {
    const answeredQuestions = new Set(
      value.filter((answer) => answer.isChecked).map((answer) => answer.questionId),
    );

    if (
      answeredQuestions.size === shuffledQuestions.value.length &&
      shuffledQuestions.value.length > 0 &&
      !showResults.value &&
      !allAnswered.value
    ) {
      checkAnswers();
    }
  },
  { deep: true },
);

const resetActivity = () => {
  initializeAnswers();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex-1 rounded-lg bg-picton-blue-100 p-4">
      <table
        class="w-full border-collapse"
        :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
      >
        <thead>
          <tr class="text-lg">
            <th class="w-1/3 rounded-tl-lg border-b border-picton-blue-300 bg-picton-blue-500 py-6 pl-4 text-start text-white">
              {{ props.questions.questionHeader || "Question" }}
            </th>
            <th
              v-for="(_, index) in shuffledQuestions[0]?.options || []"
              :key="index"
              :class="
                cn('w-1/6 bg-picton-blue-500 p-2 text-center text-white', {
                  'rounded-tr-lg': index === (shuffledQuestions[0]?.options.length || 1) - 1,
                })
              "
            >
              {{
                props.questions.columnHeaders?.[index] ||
                shuffledQuestions[0]?.options[index]?.text ||
                `Column ${index + 1}`
              }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(question, rowIndex) in shuffledQuestions" :key="question.id">
            <td
              :class="
                cn('bg-picton-blue-200 p-4 text-picton-blue-700', {
                  'rounded-bl-lg': rowIndex === shuffledQuestions.length - 1,
                  'border-b border-picton-blue-300': rowIndex < shuffledQuestions.length - 1,
                })
              "
            >
              <div class="flex flex-col gap-2">
                <div v-if="question.media?.type === 'image'" class="flex max-h-[210px] max-w-[210px]">
                  <img
                    :src="question.media.url"
                    :alt="question.media.alt"
                    class="h-full max-h-[210px] w-full max-w-[210px] object-contain"
                  >
                </div>
                <div class="whitespace-pre-line font-medium" v-html="question.question" />
              </div>
            </td>

            <td
              v-for="(option, colIndex) in question.options"
              :key="colIndex"
              :class="
                cn('cursor-pointer border bg-white p-0', {
                  'bg-green-100': showResults && answerFor(question.id, colIndex)?.isCorrect,
                  'bg-red-100':
                    showResults &&
                    answerFor(question.id, colIndex)?.isChecked &&
                    !answerFor(question.id, colIndex)?.isCorrect,
                })
              "
              @click="!showResults && toggleAnswer(question.id, colIndex)"
            >
              <div class="flex h-12 items-center justify-center">
                <div
                  :class="
                    cn(
                      'flex h-8 w-8 items-center justify-center rounded border-2 transition-all',
                      answerFor(question.id, colIndex)?.isChecked && !showResults
                        ? 'border-picton-blue-500 bg-picton-blue-500 text-white'
                        : 'border-gray-300 bg-white hover:border-picton-blue-300',
                    )
                  "
                >
                  <span
                    v-if="answerFor(question.id, colIndex)?.isChecked"
                    :class="[
                      'mx-auto w-fit',
                      showResults && answerFor(question.id, colIndex)?.isCorrect && 'text-green-600',
                      showResults && answerFor(question.id, colIndex)?.isCorrect === false && 'text-red-600',
                    ]"
                  >
                    {{
                      showResults && answerFor(question.id, colIndex)?.isCorrect === false
                        ? "✕"
                        : "✓"
                    }}
                  </span>

                  <span
                    v-if="showCorrectAnswers && !answerFor(question.id, colIndex)?.isChecked && option.isCorrect"
                    class="text-green-600"
                  >
                    ✓
                  </span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="showResults" class="mt-4">
        <ActivityResults :score="score.correct" :total="score.total" :onRestart="resetActivity" />
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score.correct"
      :total="score.total"
      :open="allAnswered"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else if (props.feedback === 'wrong-correct') {
              showResults = true;
              allAnswered = false;
            } else if (props.feedback === 'wrong-correct-answers') {
              showResults = true;
              allAnswered = false;
            }
          }
        }
      "
    />
  </div>
</template>
