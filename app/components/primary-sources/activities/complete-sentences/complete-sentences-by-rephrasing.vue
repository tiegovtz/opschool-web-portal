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
const activityInstructionsId = "complete-sentences-instructions";
const activityOptionsId = "complete-sentences-options";

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
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Kamilisha kila sentensi kwa kutumia kitufe cha Tab kupita kwenye sehemu za kuandika. Baada ya kujaza nafasi zote wazi, tumia kitufe cha Kagua Majibu kuona matokeo yako."
        : "Complete each sentence by moving through the input fields with the Tab key. After all blanks are filled, use the Check Answers button to review your results." }}
    </p>

    <div
      class="flex h-full flex-col gap-3 bg-picton-blue-100 text-lg"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : undefined }"
    >
      <div
        v-if="props.questions.options && props.questions.options.length > 0"
        :id="activityOptionsId"
        class="flex w-full flex-wrap gap-2 sm:gap-3 rounded-xl border-2 border-picton-blue-300 bg-picton-blue-200 px-3 py-3 sm:px-4 sm:py-4 shadow-sm"
        role="group"
        :aria-label="ui.availableAnswerChoices.value"
      >
        <span
          v-for="(option, index) in props.questions.options"
          :key="index"
          tabindex="0"
          :aria-label="`Answer choice ${option}`"
          class="text-base sm:text-lg text-picton-blue-700 leading-snug px-2 sm:px-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-picton-blue-200"
        >
          {{ option }}
        </span>
      </div>

      <div
        class="flex-1 space-y-10 overflow-y-auto py-5"
        role="list"
        :aria-label="ui.completeSentenceQuestions.value"
      >
        <div
          v-for="(q, i) in shuffledQuestions"
          :key="q.id"
          class="flex min-h-[280px] items-start rounded-2xl border border-picton-blue-200 p-6 shadow-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-picton-blue-100 md:p-7"
          role="listitem"
          tabindex="0"
          :aria-labelledby="`complete-sentence-question-${q.id}`"
          :aria-describedby="q.image ? `complete-sentence-image-${q.id}` : undefined"
          :class="
            cn({
              'bg-picton-blue-50': !checkedItems.includes(i),
              'bg-lemon-50 text-lemon-700': checkedItems.includes(i),
              'bg-green-100 text-green-700': feedbacks[i],
              'bg-red-100 text-red-700': feedbacks[i] === false,
            })
          "
        >
          <div class="flex w-full items-start gap-8">
            <div class="flex min-w-0 flex-1 flex-col gap-8">
              <div class="min-w-0 rounded-xl bg-white px-6 py-6 shadow-sm md:px-7 md:py-7">
                <div class="flex items-start gap-4 md:gap-5">
                  <span
                    :id="`complete-sentence-question-${q.id}`"
                    class="shrink-0 min-w-[2.25rem] pt-0.5 text-right text-xl font-semibold tabular-nums text-picton-blue-900 sm:min-w-[2.5rem] md:text-2xl"
                  >
                    {{ i + 1 }}.
                  </span>
                  <div class="min-w-0 flex-1 text-lg leading-relaxed text-picton-blue-950 md:text-xl md:leading-relaxed">
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
              </div>
              <div
                v-if="q.image"
                :id="`complete-sentence-image-${q.id}`"
                class="mx-auto w-fit max-w-full overflow-hidden rounded-2xl border border-picton-blue-300 bg-white p-7 shadow-sm"
              >
                <div class="flex max-w-[720px] items-center justify-center rounded-xl bg-slate-50 p-5 md:max-w-[840px]">
                  <img
                    :src="q.image"
                    :alt="q.question"
                    class="max-h-[560px] w-auto max-w-full rounded-lg object-contain md:max-h-[640px]"
                  >
                </div>
              </div>
            </div>

            <div
              v-if="checkedItems.includes(i)"
              class="flex shrink-0 items-center gap-2 pt-1"
              role="status"
              :aria-label="ui.formatQuestionResult(i + 1, feedbacks[i])"
            >
              <div
                class="flex items-center justify-center rounded-full p-1"
                :class="feedbacks[i] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              >
                <Icon :icon="feedbacks[i] ? 'mdi:check' : 'mdi:close'" class="h-5 w-5" aria-hidden="true" />
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
          :aria-describedby="props.questions.options && props.questions.options.length > 0 ? activityOptionsId : activityInstructionsId"
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
  </section>
</template>
