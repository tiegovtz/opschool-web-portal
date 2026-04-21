<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/vue";
import { Input } from "@/components/ui/input";
import { shuffle } from "@/lib/utils";
import type { FeedbackType } from "@/lib/types/activity-types";

type SequenceQuestion = {
  title: string;
  questions: {
    id: string;
    sequence: (string | null)[];
    blankIndices: number[];
    correctAnswers: string[];
  }[];
};

type Props = {
  feedback?: FeedbackType;
  questions: SequenceQuestion;
};

const props = defineProps<Props>();
const ui = useActivityUiText();

const questions = ref<SequenceQuestion["questions"]>([...props.questions.questions]);
const answers = ref<Record<string, string>>({});
const validations = ref<Record<string, boolean>>({});
const showFeedback = ref(false);
const isCompleted = ref(false);
const score = ref(0);
const showResultsDialog = ref(false);
const activityInstructionsId = "missing-values-instructions";
const activityStatusId = "missing-values-status";
const keyboardStatusMessage = ref("");

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
    keyboardStatusMessage.value = "";
  },
  { deep: true },
);

const totalBlanks = computed(() =>
  questions.value.reduce((total, question) => total + question.blankIndices.length, 0),
);

const answerKey = (questionId: string, blankIndex: number) => `${questionId}-${blankIndex}`;

const handleInputChange = (questionId: string, blankIndex: number, value: string) => {
  answers.value = {
    ...answers.value,
    [answerKey(questionId, blankIndex)]: value,
  };
  keyboardStatusMessage.value = ui.formatActivityUpdated(
    ui.formatQuestion(questions.value.findIndex((question) => question.id === questionId) + 1),
    value,
  );
};

const checkAnswers = () => {
  const nextValidations: Record<string, boolean> = {};
  let correctCount = 0;

  questions.value.forEach((question) => {
    question.blankIndices.forEach((blankIndex, index) => {
      const key = answerKey(question.id, blankIndex);
      const userAnswer = answers.value[key] || "";
      const expectedAnswer = question.correctAnswers[index];
      const isCorrect = userAnswer.trim() === expectedAnswer;

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
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${correctCount} / ${totalBlanks.value}.`;
};

const resetActivity = () => {
  questions.value = shuffle([...props.questions.questions]);
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

const getInputClass = (key: string) => {
  if (!showFeedback.value || props.feedback === "none") {
    return "border-gray-300 focus:border-blue-500 focus:outline-none";
  }

  return validations.value[key]
    ? "border-green-500 bg-green-50 text-green-600"
    : "border-red-500 bg-red-50 text-red-600";
};
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="missing-values-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="missing-values-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila pengo la mfuatano na andika jibu sahihi."
          : "Use Tab to move through each blank in the sequence and type the correct value."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <div class="space-y-4">
      <div
        v-for="(question, questionIndex) in questions"
        :key="question.id"
        class="flex items-center rounded-lg bg-picton-blue-50 px-2 py-4 md:p-4"
      >
        <div class="mr-1 text-lg font-bold">{{ questionIndex + 1 }}.</div>
        <div class="flex flex-1 flex-wrap gap-2">
          <template v-for="(item, index) in question.sequence" :key="`q${question.id}-${index}`">
            <div
              v-if="!question.blankIndices.includes(index)"
              class="flex h-12 w-20 items-center justify-center rounded bg-picton-blue-100 text-lg font-semibold"
            >
              {{ item !== null ? item : "_" }}
            </div>

            <div v-else class="relative">
              <Input
                :model-value="answers[answerKey(question.id, index)] || ''"
                @update:model-value="
                  (value) => handleInputChange(question.id, index, String(value ?? ''))
                "
                :disabled="showFeedback"
                :aria-label="ui.isSwahili ? `Jibu la swali ${questionIndex + 1}, pengo la ${question.blankIndices.indexOf(index) + 1}` : `Answer for question ${questionIndex + 1}, blank ${question.blankIndices.indexOf(index) + 1}`"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                :class="[
                  'h-12 w-[90px] rounded border-2 bg-transparent text-center !text-2xl font-semibold',
                  getInputClass(answerKey(question.id, index)),
                ]"
              />
            </div>
          </template>
        </div>
      </div>
    </div>

    <Button
      v-if="!showFeedback"
      variant="brand-lemon"
      class="mx-auto mt-4 w-fit group gap-2"
      :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
      @click="checkAnswers"
    >
      <Icon
        icon="heroicons:sparkles"
        width="18"
        height="18"
        class="text-lemon-700 transition-transform duration-200 group-hover:scale-110 animate-pulse"
      />
      {{ ui.checkAnswers }}
    </Button>

    <ActivityResults
      v-else-if="isCompleted"
      :score="score"
      :total="totalBlanks"
      :onRestart="resetActivity"
    />

    <ActivityResultsAlertDialog
      :score="score"
      :total="totalBlanks"
      :open="showResultsDialog"
      :onOpenChange="handleResultsDialogClose"
    />
  </section>
</template>
