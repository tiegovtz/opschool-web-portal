<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/ui/inputs/custom-input";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { cn } from "@/lib/utils";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type NumberMatrixQuestion = {
  title: string;
  questions: {
    id: number;
    sequence: (number | string)[];
    patternIndices: number[];
    correctAnswers: number[];
  }[];
};

type Props = {
  feedback?: FeedbackType;
  questions: NumberMatrixQuestion;
};

const props = defineProps<Props>();

const questions = ref<NumberMatrixQuestion["questions"]>([...props.questions.questions]);
const answers = ref<Record<string, string>>({});
const validations = ref<Record<string, boolean>>({});
const showFeedback = ref(false);
const isCompleted = ref(false);
const score = ref(0);
const showResultsDialog = ref(false);

const { playSound } = useSoundEffects();

watch(
  () => props.questions.questions,
  (value) => {
    questions.value = [...value];
    answers.value = {};
    validations.value = {};
    showFeedback.value = false;
    isCompleted.value = false;
    score.value = 0;
    showResultsDialog.value = false;
  },
  { deep: true },
);

const totalPatterns = computed(() =>
  questions.value.reduce((total, question) => total + question.patternIndices.length, 0),
);

const getAnswerKey = (questionId: number, patternIndex: number) => `${questionId}-${patternIndex}`;

const handleInputChange = (questionId: number, patternIndex: number, value: string) => {
  if (value !== "" && !/^\d+$/.test(value)) {
    return;
  }

  answers.value = {
    ...answers.value,
    [getAnswerKey(questionId, patternIndex)]: value,
  };
};

const checkAnswers = () => {
  const nextValidations: Record<string, boolean> = {};
  let correctCount = 0;

  questions.value.forEach((question) => {
    question.patternIndices.forEach((patternIndex, index) => {
      const key = getAnswerKey(question.id, patternIndex);
      const userAnswer = Number.parseInt(answers.value[key] || "", 10);
      const expectedAnswer = question.correctAnswers[index];
      const isCorrect = !Number.isNaN(userAnswer) && userAnswer === expectedAnswer;

      nextValidations[key] = isCorrect;
      if (isCorrect) {
        correctCount += 1;
      }
    });
  });

  if (props.feedback !== "none") {
    showFeedback.value = true;
  }

  validations.value = nextValidations;
  score.value = correctCount;
  showResultsDialog.value = true;
  playSound("success");
};

const resetActivity = () => {
  questions.value = [...props.questions.questions];
  answers.value = {};
  validations.value = {};
  isCompleted.value = false;
  showFeedback.value = false;
  score.value = 0;
  showResultsDialog.value = false;
};

const handleResultsDialogClose = (open: boolean) => {
  showResultsDialog.value = open;
  if (!open) {
    if (props.feedback === "none") {
      resetActivity();
    } else {
      isCompleted.value = true;
    }
  }
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="overflow-x-auto rounded-lg bg-picton-blue-50 md:overflow-auto">
      <div v-for="question in questions" :key="question.id" class="p-1">
        <div class="flex items-center gap-2">
          <template v-for="(item, index) in question.sequence" :key="`q${question.id}-${index}`">
            <div
              v-if="!question.patternIndices.includes(index)"
              class="flex min-h-14 w-full min-w-12 items-center justify-center rounded bg-picton-blue-100 text-xl font-semibold md:min-w-20"
            >
              {{ item }}
            </div>

            <div
              v-else
              class="relative flex w-full flex-col items-center justify-center"
            >
              <CustomInput
                :value="answers[getAnswerKey(question.id, index)] || ''"
                :onChange="(value) => handleInputChange(question.id, index, value)"
                noBorder
                :disabled="showFeedback"
                :isCorrect="showFeedback ? validations[getAnswerKey(question.id, index)] : undefined"
                :correctAnswer="
                  props.feedback === 'wrong-correct-answers'
                    ? question.correctAnswers[question.patternIndices.indexOf(index)]
                    : undefined
                "
                :className="
                  cn(
                    'min-h-14 min-w-12 items-center justify-center rounded border-2 text-center text-lg font-semibold md:min-w-20',
                    {
                      'border-none bg-lemon-200 text-lemon-700':
                        answers[getAnswerKey(question.id, index)],
                      'border-picton-blue-300': !showFeedback || props.feedback === 'none',
                      'border-green-500 bg-green-50 text-green-700':
                        validations[getAnswerKey(question.id, index)],
                      'border-red-500 bg-red-50 text-red-700':
                        !validations[getAnswerKey(question.id, index)] && showFeedback,
                    },
                  )
                "
                inputClassName="h-full w-full border-none !text-xl text-lg"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <Button
      v-if="!showFeedback"
      variant="brand-lemon"
      class="ml-auto mt-4 w-fit group gap-2"
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

    <ActivityResults
      v-else-if="isCompleted"
      :score="score"
      :total="totalPatterns"
      :onRestart="resetActivity"
    />

    <ActivityResultsAlertDialog
      :score="score"
      :total="totalPatterns"
      :open="showResultsDialog"
      :onOpenChange="handleResultsDialogClose"
    />
  </div>
</template>
