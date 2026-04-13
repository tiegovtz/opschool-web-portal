<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useWindowSize } from "@vueuse/core";
import { Icon } from "@iconify/vue";
import { Button } from "~/components/ui/button";
import ActivityTitle from "~/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import QuestionRenderer from "~/components/primary-sources/activity-helpers/question-renderer.vue";
import { useSoundEffects } from "~/composables/use-sound-effects";
import { AnswerChecker } from "~/lib/utils/answer-checker";
import { ActivityType, type FeedbackType } from "~/types/activity-types";
import {
  isCompoundCuaAnswerFilled,
  parseQuestionSegments,
} from "~/components/primary-sources/activity-helpers/question-renderer-utils";
import { detectCompoundUnitArithmeticPattern } from "~/components/ui/compound-unit-arithmetic-input";
import { cn, shuffle } from "~/utilities/utils";

type QuestionItem = {
  id: number;
  question: string;
  image?: string | null;
  answer: string[];
};

type Props = {
  feedback: FeedbackType;
  questions: {
    algorithm: ActivityType;
    title: string;
    fontSize?: number;
    questions: QuestionItem[];
    options?: string[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { width } = useWindowSize();
const { playSound } = useSoundEffects();
const answerChecker = new AnswerChecker();

const shuffledQuestions = ref<QuestionItem[]>([]);
const score = ref(0);
const allAnswered = ref(false);
const checkedItems = ref<number[]>([]);
const answers = ref<Record<number, string>>({});
const feedbacks = ref<Record<number, boolean>>({});
const showResults = ref(false);

const shuffleQuestions = () => {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
};

watch(
  () => props.questions.questions,
  () => {
    shuffleQuestions();
    score.value = 0;
    allAnswered.value = false;
    checkedItems.value = [];
    answers.value = {};
    feedbacks.value = {};
    showResults.value = false;
  },
  { immediate: true, deep: true },
);

function isBlankFilledForQuestion(question: QuestionItem, blankIndex: number, userPart: string) {
  const correct = question.answer[blankIndex] ?? "";
  if (detectCompoundUnitArithmeticPattern(correct).isCompoundUnitArithmetic) {
    return isCompoundCuaAnswerFilled(userPart);
  }
  return (userPart ?? "").trim() !== "";
}

const getCurrentAnswers = (questionIndex: number) =>
  (answers.value[questionIndex] || "").split("|");

const allQuestionsAnswered = computed(() =>
  shuffledQuestions.value.every((q, qIndex) => {
    const parts = getCurrentAnswers(qIndex);
    let bi = 0;
    for (const seg of parseQuestionSegments(q.question)) {
      if (seg.type !== "blank") continue;
      if (!isBlankFilledForQuestion(q, bi, parts[bi] ?? "")) return false;
      bi++;
    }
    return true;
  }),
);

const checkAnswer = (userAnswer: string, questionIndex: number) => {
  const question = shuffledQuestions.value[questionIndex];
  if (!question) return false;

  const userAnswers = userAnswer
    .split("|")
    .map((ans) => ans.trim().toLowerCase());
  const correctAnswers = question.answer.map((ans) => ans.toLowerCase());

  return (
    (props.questions.algorithm === ActivityType.CompleteSentencesByRephrasing ||
      props.questions.algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices ||
      userAnswers.length === correctAnswers.length) &&
    userAnswers.every((ans, i) =>
      answerChecker.checkAnswer(ans, {
        acceptedAnswers:
          props.questions.algorithm === ActivityType.CompleteSentencesByRephrasing ||
          props.questions.algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices
            ? correctAnswers
            : [correctAnswers[i] || ""],
        strictMode: true,
      }).isCorrect,
    )
  );
};

const handleInputChange = (questionIndex: number, blankIndex: number, value: string | number) => {
  const currentAnswers = getCurrentAnswers(questionIndex);
  while (currentAnswers.length <= blankIndex) {
    currentAnswers.push("");
  }
  currentAnswers[blankIndex] = String(value ?? "");
  // Mutate in-place to avoid forcing a full list re-render on every keystroke
  answers.value[questionIndex] = currentAnswers.join("|");
};

const handleCheckAllAnswers = () => {
  let newScore = 0;
  const newFeedbacks: Record<number, boolean> = {};
  const newCheckedItems: number[] = [];

  shuffledQuestions.value.forEach((_, index) => {
    const userAnswer = answers.value[index] || "";
    const isCorrect = checkAnswer(userAnswer, index);
    newFeedbacks[index] = isCorrect;
    newCheckedItems.push(index);
    if (isCorrect) newScore++;
  });

  score.value = newScore;
  feedbacks.value = newFeedbacks;
  checkedItems.value = newCheckedItems;
  allAnswered.value = true;
  playSound(newScore === shuffledQuestions.value.length ? "success" : "failure");
};

const handleResetWithShuffle = () => {
  shuffleQuestions();
  score.value = 0;
  allAnswered.value = false;
  checkedItems.value = [];
  answers.value = {};
  feedbacks.value = {};
  showResults.value = false;
};
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      class="flex flex-col h-full bg-picton-blue-100 gap-2 text-lg"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : undefined }"
    >
      <div
        v-if="props.questions.options && props.questions.options.length > 0"
        class="flex flex-wrap gap-4 border-2 border-picton-blue-300 bg-picton-blue-200 w-fit py-4 rounded"
      >
        <span
          v-for="(option, index) in props.questions.options"
          :key="index"
          class="text-picton-blue-700 leading-4 px-3"
        >
          {{ option }}
        </span>
      </div>

      <div class="flex-1 overflow-y-auto space-y-4 py-4">
        <div
          v-for="(q, i) in shuffledQuestions"
          :key="q.id"
          class="rounded-lg min-h-0 p-2 flex items-start"
          :class="
            cn({
              'bg-picton-blue-50': !checkedItems.includes(i),
              'bg-lemon-50 text-lemon-700': checkedItems.includes(i),
              'bg-green-100 text-green-700': feedbacks[i],
              'bg-red-100 text-red-700': feedbacks[i] === false,
            })
          "
        >
          <div class="py-2 flex items-start justify-between w-full gap-4">
            <div class="flex flex-col md:flex-row items-start justify-between gap-2 w-full">
              <div class="flex flex-1 min-w-0 items-start gap-2">
                <span class="shrink-0 font-medium text-picton-blue-800 pt-0.5">{{ i + 1 }}.</span>
                <div class="min-w-0 flex-1">
                  <QuestionRenderer
                    :question="q.question"
                    :answers="q.answer"
                    :user-answers="getCurrentAnswers(i)"
                    :screen-width="width ?? 1024"
                    :is-checked="checkedItems.includes(i)"
                    :is-correct="feedbacks[i] === true"
                    :disabled="checkedItems.includes(i)"
                    @blank-change="(bi, val) => handleInputChange(i, bi, val)"
                  />
                </div>
              </div>
              <div v-if="q.image" class="min-w-[150px] h-32 md:h-28">
                <img :src="q.image" :alt="q.question" class="w-full h-full rounded-lg object-contain">
              </div>
            </div>

            <div v-if="checkedItems.includes(i)" class="flex items-center gap-2">
              <div
                class="flex items-center justify-center rounded-full p-1"
                :class="feedbacks[i] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              >
                <Icon :icon="feedbacks[i] ? 'mdi:check' : 'mdi:close'" class="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActivityResults
        v-if="showResults"
        :score="score"
        :total="shuffledQuestions.length"
        :onRestart="handleResetWithShuffle"
      />
      <div v-else class="relative flex justify-end">
        <Button
          :disabled="!allQuestionsAnswered || allAnswered"
          :onClick="handleCheckAllAnswers"
          variant="brand-lemon"
          size="lg"
        >
          {{ allAnswered ? ui.answersChecked : ui.checkAnswers }}
        </Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
      :open="allAnswered && !showResults"
      :onOpenChange="(open: boolean) => { if (!open) showResults = true; }"
    />
  </div>
</template>
