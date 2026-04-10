<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, { ActivityResultsAlertDialog } from "@/components/templates/results";
import Input from "@/components/ui/inputs/input.vue";
import { Button } from "~/components/ui/button";
import { shuffle } from "~/utilities/utils";
import { cn } from "~/lib/utils";
import {
  calculateBlankWidth,
  parseQuestionSegments,
  type QuestionSegment,
} from "~/components/primary-sources/activity-helpers/question-renderer-utils";

interface QuestionItem {
  id?: number | string;
  question: string;
  answer: string | string[];
}

interface QuestionsProps {
  title: string;
  fontSize?: number;
  options?: string[];
  questions: QuestionItem[];
}

interface Props {
  feedback: "none" | "wrong-correct" | "wrong-correct-answers";
  questions: QuestionsProps;
}

const props = defineProps<Props>();

const shuffledQuestions = ref<QuestionItem[]>([]);
const answers = ref<Record<number, string>>({});
const feedbacks = ref<Record<number, boolean>>({});
const checkedItems = ref<number[]>([]);
const allAnswered = ref(false);
const showResults = ref(false);
const score = ref(0);

const availableOptions = computed(() =>
  (props.questions.options || []).map((option) => option.trim()).filter(Boolean),
);

const resetState = () => {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
  answers.value = {};
  feedbacks.value = {};
  checkedItems.value = [];
  allAnswered.value = false;
  showResults.value = false;
  score.value = 0;
};

watch(
  () => props.questions,
  () => {
    resetState();
  },
  { immediate: true, deep: true },
);

const allQuestionsAnswered = computed(() =>
  shuffledQuestions.value.every((_, index) => (answers.value[index] || "").trim() !== ""),
);

const getCorrectAnswer = (questionIndex: number) => {
  const rawAnswer = shuffledQuestions.value[questionIndex]?.answer;
  return Array.isArray(rawAnswer) ? String(rawAnswer[0] ?? "") : String(rawAnswer ?? "");
};

const handleInputChange = (questionIndex: number, value: string | number) => {
  answers.value = {
    ...answers.value,
    [questionIndex]: String(value ?? ""),
  };
};

const checkAnswer = (questionIndex: number) => {
  const userAnswer = (answers.value[questionIndex] || "").toLowerCase().trim();
  const correctAnswer = getCorrectAnswer(questionIndex).toLowerCase().trim();
  return userAnswer === correctAnswer;
};

const handleCheckAllAnswers = () => {
  let nextScore = 0;
  const nextFeedbacks: Record<number, boolean> = {};
  const nextCheckedItems: number[] = [];

  shuffledQuestions.value.forEach((_, index) => {
    const isCorrect = checkAnswer(index);
    nextFeedbacks[index] = isCorrect;
    nextCheckedItems.push(index);
    if (isCorrect) {
      nextScore += 1;
    }
  });

  feedbacks.value = nextFeedbacks;
  checkedItems.value = nextCheckedItems;
  score.value = nextScore;
  allAnswered.value = true;
};

type QuestionRenderSegment = QuestionSegment & {
  calculatedWidth?: number;
};

const getQuestionSegments = (question: string): QuestionRenderSegment[] => {
  return parseQuestionSegments(question).map((segment) => {
    if (segment.type !== "blank") {
      return segment;
    }

    const { calculatedWidth } = calculateBlankWidth(segment.content.length, 1024);

    return {
      ...segment,
      calculatedWidth: Math.max(calculatedWidth, 120),
    };
  });
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="availableOptions.length"
      class="mb-4 rounded-xl border border-picton-blue-200 bg-white/95 p-4 shadow-sm"
    >
      <div class="flex w-fit flex-wrap gap-4 rounded bg-picton-blue-200 p-3">
        <div
          v-for="(option, optionIndex) in availableOptions"
          :key="`${option}-${optionIndex}`"
          class="rounded px-5 py-1 text-picton-blue-700"
        >
          {{ option }}
        </div>
      </div>
    </div>

    <div
      v-if="!showResults"
      class="flex h-full flex-col bg-picton-blue-100"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
    >
      <div class="grid h-full grow gap-4 overflow-y-auto py-4">
        <div
          v-for="(q, i) in shuffledQuestions"
          :key="q.id ?? i"
          :class="[
            'h-full rounded-lg p-4 flex flex-col justify-between',
            !checkedItems.includes(i)
              ? 'bg-picton-blue-50'
              : feedbacks[i]
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
          ]"
        >
          <div class="flex flex-wrap items-center leading-loose">
            <span class="mr-2 font-medium text-gray-600">{{ i + 1 }}.</span>

            <template
              v-for="segment in getQuestionSegments(q.question)"
              :key="`${q.id ?? i}-${segment.index}`"
            >
              <span
                v-if="segment.type === 'text'"
                class="mx-1 whitespace-pre-line"
              >
                {{ segment.content }}
              </span>

              <span
                v-else-if="segment.type === 'highlighted'"
                class="inline-flex items-center mx-1 rounded bg-lemon-100 px-2 py-1 text-lemon-700"
              >
                {{ segment.content }}
              </span>

              <span
                v-else
                class="inline-flex flex-col mx-1"
                :style="{ minWidth: `${segment.calculatedWidth}px` }"
              >
                <Input
                  type="text"
                  :model-value="answers[i] || ''"
                  :disabled="checkedItems.includes(i)"
                  class="min-w-0 px-2 border-none bg-transparent text-center focus:outline-none"
                  :style="{ maxWidth: `${(segment.calculatedWidth || 120) * 1.6}px` }"
                  @update:model-value="(value) => handleInputChange(i, value)"
                />
                <div
                  :class="
                    cn('border-b border-dashed border-picton-blue-700', {
                      'border-lemon-700': checkedItems.includes(i),
                    })
                  "
                />
              </span>
            </template>
          </div>

          <div class="flex items-center gap-2 mt-4 ml-auto">
            <div
              v-if="checkedItems.includes(i)"
              :class="[
                'flex items-center justify-center rounded-full p-1',
                feedbacks[i] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
              ]"
            >
              <Icon :icon="feedbacks[i] ? 'mdi:check' : 'mdi:close'" width="20" height="20" />
            </div>
          </div>
        </div>
      </div>

      <Button
        :disabled="!allQuestionsAnswered || allAnswered"
        @click="handleCheckAllAnswers"
        variant="brand-lemon"
        class="ml-auto w-fit"
        size="lg"
      >
        {{ allAnswered ? "Answers Checked" : "Check All Answers" }}
      </Button>
    </div>

    <div v-else class="flex h-full flex-col overflow-y-auto bg-picton-blue-100 p-6">
      <div class="rounded-lg bg-picton-blue-50 p-6">
        <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div
            v-for="(question, idx) in shuffledQuestions"
            :key="question.id ?? idx"
            :class="[
              'rounded-lg border p-4',
              checkAnswer(idx) ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50',
            ]"
          >
            <div class="mb-2 flex items-center justify-between gap-3">
              <p class="font-medium">{{ question.question }}</p>
              <div
                :class="[
                  'flex items-center justify-center rounded-full p-1',
                  checkAnswer(idx) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
                ]"
              >
                <Icon :icon="checkAnswer(idx) ? 'mdi:check' : 'mdi:close'" width="20" height="20" />
              </div>
            </div>

            <div class="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Majibu yako:</p>
                <p :class="{ 'text-red-600': !checkAnswer(idx) }">
                  {{ answers[idx] || "(no answer)" }}
                </p>
              </div>
              <div v-if="props.feedback === 'wrong-correct-answers'">
                <p class="text-sm text-gray-500">Correct answer:</p>
                <p class="text-green-600">{{ getCorrectAnswer(idx) }}</p>
              </div>
            </div>
          </div>
        </div>

        <ActivityResults :score="score" :total="shuffledQuestions.length" :onRestart="resetState" />
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
      :open="allAnswered && !showResults"
      :onRestart="resetState"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            showResults = true;
          }
        }
      "
    />
  </div>
</template>
