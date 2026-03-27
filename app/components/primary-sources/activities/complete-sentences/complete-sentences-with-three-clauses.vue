<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";
import { Button } from "~/components/ui/button";
import Input from "~/components/ui/inputs/input";
import type { FeedbackType } from "~/types/activity-types";
import ActivityTitle from "~/components/templates/activity-title";
import { useSoundEffects } from "~/composables/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";

type QuestionItem = {
  id: number | string;
  question: string;
  correctAnswers: string[];
};

type QuestionState = QuestionItem & {
  userAnswers: string[];
  completed: boolean;
};

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    algorithm:
      | "Complete sentences with three clauses"
      | "Complete sentences with four clauses";
    questions: QuestionItem[];
  };
  feedback?: FeedbackType;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct-answers",
});

const { playSound } = useSoundEffects();

const answerCount = computed(() =>
  props.questions.algorithm === "Complete sentences with three clauses" ? 2 : 3,
);

const buildInitialQuestions = (): QuestionState[] =>
  props.questions.questions.map((q, index) => {
    const userAnswers = Array(answerCount.value).fill("");
    if (index === 0) {
      q.correctAnswers.forEach((answer, idx) => {
        if (idx < answerCount.value) userAnswers[idx] = answer;
      });
    }
    return {
      ...q,
      userAnswers,
      completed: index === 0,
    };
  });

const questionsState = ref<QuestionState[]>([]);
const showResults = ref(false);
const score = ref(0);
const resultsDialogOpen = ref(false);

watch(
  () => props.questions,
  () => {
    questionsState.value = buildInitialQuestions();
    showResults.value = false;
    score.value = 0;
    resultsDialogOpen.value = false;
  },
  { immediate: true, deep: true },
);

const handleInputChange = (questionId: number | string, answerIndex: number, value: string) => {
  questionsState.value = questionsState.value.map((q) =>
    q.id === questionId
      ? {
          ...q,
          userAnswers: q.userAnswers.map((ans, idx) => (idx === answerIndex ? value : ans)),
        }
      : q,
  );
};

const isQuestionCorrect = (question: QuestionState) =>
  question.correctAnswers.every((correctAnswer, idx) => {
    if (idx >= answerCount.value) return true;
    return (question.userAnswers[idx] || "").toLowerCase().trim() === correctAnswer.toLowerCase();
  });

const allFillableAnswered = computed(() =>
  questionsState.value
    .slice(1)
    .every((q) => q.userAnswers.every((answer) => answer.trim() !== "")),
);

const checkAnswers = () => {
  let correctQuestions = 0;
  questionsState.value.forEach((q, index) => {
    if (index === 0) return;
    if (isQuestionCorrect(q)) correctQuestions++;
  });
  score.value = correctQuestions;
  playSound("success");
  resultsDialogOpen.value = true;
};

const resetActivity = () => {
  questionsState.value = buildInitialQuestions();
  showResults.value = false;
  score.value = 0;
  resultsDialogOpen.value = false;
};
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      class="flex flex-col gap-2 h-full"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '20px' }"
    >
      <div
        v-if="questionsState.length > 0"
        class="p-4 rounded flex flex-col justify-between md:flex-row items-center gap-2 px-6 bg-lemon-100 text-lemon-700"
      >
        <div class="font-semibold mr-4">
          {{ questionsState[0]?.question }}
        </div>
        <div
          v-for="(title, idx) in (questionsState[0]?.correctAnswers || []).slice(0, answerCount)"
          :key="idx"
          class="flex-1 max-w-56 mt-2 md:mt-0 text-center font-semibold"
        >
          {{ title }}
        </div>
      </div>

      <div
        v-for="(q, questionIndex) in questionsState.slice(1)"
        :key="q.id"
        class="p-2 rounded relative"
        :class="showResults ? (isQuestionCorrect(q) ? 'bg-green-100' : 'bg-red-100') : 'bg-picton-blue-50'"
      >
        <div v-if="showResults" class="absolute right-2">
          <Icon
            :icon="isQuestionCorrect(q) ? 'mdi:check' : 'mdi:close'"
            :class="isQuestionCorrect(q) ? 'text-green-500' : 'text-red-500'"
            width="24"
            height="24"
          />
        </div>
        <div class="flex flex-col md:flex-row justify-between items-center gap-2 px-6">
          <div class="flex items-center gap-2">
            <span class="font-bold min-w-8">{{ questionIndex + 1 }}.</span>
            <div class="mr-4">{{ q.question }}</div>
          </div>

          <div v-for="(answer, idx) in q.userAnswers" :key="idx" class="flex-1 max-w-56 mt-2 md:mt-0">
            <Input
              type="text"
              :model-value="answer"
              :disabled="showResults"
              class="p-2 bg-transparent text-center border-none rounded"
              @update:modelValue="(v: string | number) => handleInputChange(q.id, idx, String(v ?? ''))"
            />
            <div class="border-b border-dashed border-picton-blue-700" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="showResults" class="mt-4">
      <ActivityResults :score="score" :total="Math.max(questionsState.length - 1, 0)" :onRestart="resetActivity" />
    </div>

    <div v-if="!showResults" class="mt-8 flex justify-end">
      <Button
        :onClick="checkAnswers"
        variant="brand-lemon"
        :style="{ opacity: allFillableAnswered ? 1 : 0, transition: 'opacity 0.3s ease' }"
        :disabled="!allFillableAnswered"
      >
        Check Answers
      </Button>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="Math.max(questionsState.length - 1, 0)"
      :open="resultsDialogOpen"
      :onOpenChange="(open: boolean) => {
        if (!open) {
          if (props.feedback === 'none') resetActivity();
          else showResults = true;
        }
        resultsDialogOpen = open;
      }"
    />
  </div>
</template>
