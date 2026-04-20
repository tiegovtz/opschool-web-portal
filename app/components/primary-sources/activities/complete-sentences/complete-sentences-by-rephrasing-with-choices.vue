<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useWindowSize } from "@vueuse/core";
import { Icon } from "@iconify/vue";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, { ActivityResultsAlertDialog } from "@/components/templates/results";
import QuestionRenderer from "~/components/primary-sources/activity-helpers/question-renderer.vue";
import { Button } from "~/components/ui/button";
import { AnswerChecker } from "~/lib/utils/answer-checker";
import { shuffle } from "~/utilities/utils";
import { parseQuestionSegments } from "~/components/primary-sources/activity-helpers/question-renderer-utils";

interface QuestionItem {
  id?: number | string;
  question: string;
  answer: string | string[];
  /** Resolved asset URL from CMS `images[]` / `path` (see transpiler). */
  image?: string | null;
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
const { width: windowWidth } = useWindowSize();
const ui = useActivityUiText();
const answerChecker = new AnswerChecker();

const shuffledQuestions = ref<QuestionItem[]>([]);
const answers = ref<Record<number, string[]>>({});
const feedbacks = ref<Record<number, boolean>>({});
const checkedItems = ref<number[]>([]);
const allAnswered = ref(false);
const showResults = ref(false);
const score = ref(0);
const activityInstructionsId = "complete-sentences-rephrasing-choices-instructions";
const activityOptionsId = "complete-sentences-rephrasing-choices-options";

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

const splitAnswerValue = (value: string) =>
  value
    .split(/[/,;|\n]+/)
    .map((answer) => String(answer ?? "").trim())
    .filter(Boolean);

/** Accepted forms for one question (`/` in CMS = alternatives, same as non-choices rephrasing). */
const getAcceptedAnswers = (questionIndex: number): string[] => {
  const rawAnswer = shuffledQuestions.value[questionIndex]?.answer;
  if (Array.isArray(rawAnswer)) {
    return rawAnswer.map((a) => String(a ?? "").trim()).filter(Boolean);
  }
  const s = String(rawAnswer ?? "").trim();
  if (!s) return [];
  return s
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);
};

/** Human-readable correct answer for results (`wrong-correct-answers`). */
const getCorrectAnswerLabel = (questionIndex: number) => {
  const forms = getAcceptedAnswers(questionIndex);
  return forms.length ? forms.join(" or ") : "";
};

const getUserAnswers = (questionIndex: number) => answers.value[questionIndex] || [];

const getAnswerValue = (questionIndex: number, blankIndex: number) =>
  getUserAnswers(questionIndex)[blankIndex] || "";

const handleInputChange = (questionIndex: number, blankIndex: number, value: string | number) => {
  const nextAnswers = [...getUserAnswers(questionIndex)];
  nextAnswers[blankIndex] = String(value ?? "");

  answers.value = {
    ...answers.value,
    [questionIndex]: nextAnswers,
  };
};

const getBlankCount = (question: string) =>
  parseQuestionSegments(question).filter((segment) => segment.type === "blank").length;

const checkAnswer = (questionIndex: number) => {
  const question = shuffledQuestions.value[questionIndex];
  if (!question) return false;

  const blankCount = getBlankCount(question.question);
  if (blankCount === 0) return false;

  const userParts = Array.from({ length: blankCount }, (_, i) =>
    (getUserAnswers(questionIndex)[i] ?? "").trim().toLowerCase(),
  );

  const rawAnswer = question.answer;
  const correctAnswers = Array.isArray(rawAnswer)
    ? rawAnswer.map((a) => String(a ?? "").trim().toLowerCase()).filter(Boolean)
    : getAcceptedAnswers(questionIndex).map((a) => a.toLowerCase());

  if (!correctAnswers.length) return false;

  return userParts.every((ans) =>
    answerChecker.checkAnswer(ans, {
      acceptedAnswers: correctAnswers,
      strictMode: true,
    }).isCorrect,
  );
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

const allQuestionsAnswered = computed(() =>
  shuffledQuestions.value.every((question, index) => {
    const blankCount = getBlankCount(question.question);
    return Array.from({ length: blankCount }).every(
      (_, blankIndex) => getAnswerValue(index, blankIndex).trim() !== "",
    );
  }),
);

const formatUserAnswer = (questionIndex: number) => {
  const userAnswers = getUserAnswers(questionIndex).filter((answer) => answer.trim() !== "");
  return userAnswers.length ? userAnswers.join(", ") : "(no answer)";
};
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="complete-sentences-rephrasing-choices-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-rephrasing-choices-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Tumia kitufe cha Tab kupita kwenye kila sentensi, jaza kila nafasi wazi, kisha tumia kitufe cha Kagua Majibu kuona matokeo ya kila swali."
        : "Move through each sentence with the Tab key, fill in every blank, then use the Check Answers button to review the result for each question." }}
    </p>

    <div
      v-if="availableOptions.length"
      class="mb-4 w-full rounded-xl border border-picton-blue-200 bg-white/95 p-3 shadow-sm sm:p-4"
    >
      <div
        :id="activityOptionsId"
        class="grid w-full grid-cols-2 gap-2 rounded bg-picton-blue-200 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-3"
        role="group"
        :aria-label="ui.availableAnswerChoices.value"
      >
        <div
          v-for="(option, optionIndex) in availableOptions"
          :key="`${option}-${optionIndex}`"
          tabindex="0"
          :aria-label="`Answer choice ${option}`"
          class="min-w-0 rounded px-3 py-2 text-center text-base font-bold leading-snug text-picton-blue-800 sm:px-4 sm:py-2 sm:text-lg md:text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-picton-blue-200"
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
      <div class="grid h-full grow gap-4 overflow-y-auto py-4" role="list" :aria-label="ui.completeSentenceQuestions.value">
        <div
          v-for="(q, i) in shuffledQuestions"
          :key="q.id ?? i"
          :class="[
            'h-full rounded-lg p-4 flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-picton-blue-100',
            !checkedItems.includes(i)
              ? 'bg-picton-blue-50'
              : feedbacks[i]
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
          ]"
          role="listitem"
          tabindex="0"
          :aria-labelledby="`complete-sentences-rephrasing-choices-question-${q.id ?? i}`"
          :aria-describedby="
            q.image ? `complete-sentences-rephrasing-choices-image-${q.id ?? i}` : undefined
          "
        >
          <div class="flex items-start gap-3 md:gap-5 leading-loose">
            <span
              :id="`complete-sentences-rephrasing-choices-question-${q.id ?? i}`"
              class="shrink-0 min-w-[2.25rem] pt-0.5 text-right text-base font-semibold tabular-nums text-gray-600 sm:min-w-[2.5rem] sm:text-lg md:text-xl"
            >
              {{ i + 1 }}.
            </span>
            <div
              class="min-w-0 flex-1 text-picton-blue-950"
              :aria-describedby="availableOptions.length ? `${activityInstructionsId} ${activityOptionsId}` : activityInstructionsId"
            >
              <QuestionRenderer
                :question="q.question"
                :answers="getAcceptedAnswers(i)"
                :user-answers="getUserAnswers(i)"
                :screen-width="windowWidth ?? 1024"
                :is-checked="checkedItems.includes(i)"
                :is-correct="feedbacks[i] === true"
                :disabled="checkedItems.includes(i)"
                @blank-change="(bi, val) => handleInputChange(i, bi, val)"
              />
            </div>
          </div>

          <div
            v-if="q.image"
            :id="`complete-sentences-rephrasing-choices-image-${q.id ?? i}`"
            class="mx-auto mt-4 w-fit max-w-full overflow-hidden rounded-2xl border border-picton-blue-300 bg-white p-4 shadow-sm sm:p-6"
          >
            <div
              class="flex max-w-[720px] items-center justify-center rounded-xl bg-slate-50 p-4 md:max-w-[840px] md:p-5"
            >
              <img
                :src="q.image"
                :alt="q.question"
                class="max-h-[560px] w-auto max-w-full rounded-lg object-contain md:max-h-[640px]"
              >
            </div>
          </div>

          <div class="flex items-center gap-2 mt-4 ml-auto">
            <div
              v-if="checkedItems.includes(i)"
              :class="[
                'flex items-center justify-center rounded-full p-1',
                feedbacks[i] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
              ]"
              role="status"
              :aria-label="ui.formatQuestionResult(i + 1, feedbacks[i])"
            >
              <Icon :icon="feedbacks[i] ? 'mdi:check' : 'mdi:close'" width="20" height="20" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <Button
        :disabled="!allQuestionsAnswered || allAnswered"
        @click="handleCheckAllAnswers"
        variant="brand-lemon"
        class="w-fit ml-auto"
        size="lg"
        :aria-describedby="availableOptions.length ? activityOptionsId : activityInstructionsId"
      >
        {{ allAnswered ? ui.answersChecked : ui.checkAllAnswers }}
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
            <div class="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0 flex-1 font-medium">
                <QuestionRenderer
                  mode="results"
                  :question="question.question"
                  :answers="getAcceptedAnswers(idx)"
                  :user-answers="getUserAnswers(idx)"
                  :is-correct="checkAnswer(idx)"
                  :disabled="true"
                  :screen-width="windowWidth ?? 1024"
                />
              </div>
              <div
                :class="[
                  'flex items-center justify-center rounded-full p-1',
                  checkAnswer(idx) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
                ]"
              >
                <Icon :icon="checkAnswer(idx) ? 'mdi:check' : 'mdi:close'" width="20" height="20" />
              </div>
            </div>

            <div
              v-if="question.image"
              class="mb-3 flex justify-center overflow-hidden rounded-lg border border-picton-blue-200 bg-white p-3"
            >
              <img
                :src="question.image"
                :alt="question.question"
                class="max-h-[280px] w-auto max-w-full object-contain md:max-h-[360px]"
              >
            </div>

            <div class="mt-2 grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">{{ ui.yourAnswer }}</p>
                <p :class="{ 'text-red-600': !checkAnswer(idx) }">{{ formatUserAnswer(idx) }}</p>
              </div>
              <div v-if="props.feedback === 'wrong-correct-answers'">
                <p class="text-sm text-gray-500">{{ ui.correctAnswer }}</p>
                <p class="text-green-600">{{ getCorrectAnswerLabel(idx) }}</p>
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
  </section>
</template>
