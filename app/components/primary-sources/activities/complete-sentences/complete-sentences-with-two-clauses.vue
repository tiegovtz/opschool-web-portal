<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { Icon } from "@iconify/vue";
import { cn, shuffle } from "~/utilities/utils";
import { Button } from "~/components/ui/button";
import Input from "~/components/ui/inputs/input.vue";
import type { FeedbackType } from "~/types/activity-types";
import ActivityTitle from "~/components/templates/activity-title";
import { useSoundEffects } from "~/composables/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";

type Props = {
  feedback: FeedbackType;
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      word: string;
      answer: string | string[];
    }[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const shuffledQuestions = ref([...props.questions.questions]);
const score = ref(0);
const allAnswered = ref(false);
const allChecked = ref(false);
const answers = ref<Record<number, string>>({});
const feedbacks = ref<Record<number, boolean>>({});
const showResults = ref(false);
const activityInstructionsId = "complete-sentences-two-clauses-instructions";

const normalize = (value: string) => value.trim().toLowerCase();
const compareAnswersLocal = (userAnswer: string, expected: string | string[]) => {
  const user = normalize(userAnswer);
  if (Array.isArray(expected)) {
    return expected.some((item) => normalize(item) === user);
  }
  return normalize(expected) === user;
};

const shuffleQuestions = () => {
  shuffledQuestions.value = shuffle([...props.questions.questions]);
};

watch(
  () => props.questions.questions,
  () => {
    shuffleQuestions();
    allAnswered.value = false;
    allChecked.value = false;
    score.value = 0;
    answers.value = {};
    feedbacks.value = {};
    showResults.value = false;
  },
  { immediate: true, deep: true },
);

watch(
  [answers, shuffledQuestions],
  () => {
    allAnswered.value = shuffledQuestions.value.every(
      (_, index) => (answers.value[index] || "").trim().length > 0,
    );
  },
  { deep: true },
);

const handleCheckAll = () => {
  let correctCount = 0;
  const newFeedbacks: Record<number, boolean> = {};
  shuffledQuestions.value.forEach((question, index) => {
    const userAnswer = answers.value[index] || "";
    const isCorrect = compareAnswersLocal(userAnswer, question.answer);
    newFeedbacks[index] = isCorrect;
    if (isCorrect) correctCount++;
  });
  feedbacks.value = newFeedbacks;
  score.value = correctCount;
  allChecked.value = true;

  const percentage = shuffledQuestions.value.length
    ? (correctCount / shuffledQuestions.value.length) * 100
    : 0;
  if (percentage === 100) playSound("success");
  else if (percentage >= 70) playSound("correct");
  else playSound("failure");
};

const handleInputChange = (index: number, value: string) => {
  answers.value = {
    ...answers.value,
    [index]: value,
  };
};

const resetGame = () => {
  shuffleQuestions();
  allAnswered.value = false;
  allChecked.value = false;
  score.value = 0;
  answers.value = {};
  feedbacks.value = {};
  showResults.value = false;
};

const contentStyle = computed(() => ({
  fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : "20px",
}));

const getInputLabel = (index: number, word: string) =>
  `Question ${index + 1}. Answer for ${word}`;
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-two-clauses-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-two-clauses-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Jaza kila sehemu ya jibu kwa kutumia kitufe cha Tab kupita kwenye shughuli. Baada ya kukagua majibu yako, tumia kitufe cha Tazama Matokeo kuona muhtasari."
        : "Fill in each answer field using the Tab key to move through the activity. After checking your answers, use the View Results button to see the summary." }}
    </p>

    <div v-if="!showResults" class="flex flex-col h-full bg-picton-blue-100" :style="contentStyle">
      <div class="grid grid-cols-2 gap-4 py-4 flex-1 overflow-y-auto" role="list" :aria-label="ui.completeSentenceQuestions.value">
        <div
          v-for="(question, index) in shuffledQuestions"
          :key="index"
          class="bg-picton-blue-50 h-fit flex flex-col rounded-lg p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
          role="listitem"
          tabindex="0"
          :aria-labelledby="`complete-sentences-two-clauses-question-${index}`"
          :class="
            cn({
              'bg-green-100 text-green-700': allChecked && feedbacks[index],
              'bg-red-100 text-red-700': allChecked && feedbacks[index] === false,
            })
          "
        >
          <div class="flex flex-col justify-between h-full">
            <p :id="`complete-sentences-two-clauses-question-${index}`" class="mb-4">{{ question.word }}</p>
            <div>
              <Input
                :model-value="answers[index] || ''"
                :disabled="allChecked"
                :aria-label="getInputLabel(index, question.word)"
                :aria-describedby="activityInstructionsId"
                class="px-2 border-none bg-transparent text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
                @update:modelValue="(v: string | number) => handleInputChange(index, String(v ?? ''))"
              />
              <div
                class="w-full border-b border-dashed border-picton-blue-700 mt-2"
                :class="
                  cn({
                    'border-green-700': allChecked && feedbacks[index],
                    'border-red-700': allChecked && feedbacks[index] === false,
                  })
                "
              />
            </div>
          </div>
          <div v-if="allChecked" class="flex justify-center mt-4">
            <div
              class="flex items-center justify-center rounded-full p-1"
              :class="feedbacks[index] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              role="status"
              :aria-label="ui.formatQuestionResult(index + 1, feedbacks[index])"
            >
              <Icon :icon="feedbacks[index] ? 'mdi:check' : 'mdi:close'" class="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      <Button
        v-if="!allChecked"
        :onClick="handleCheckAll"
        :disabled="!allAnswered"
        variant="brand-lemon"
        class="ml-auto text-lg py-3"
        :aria-describedby="activityInstructionsId"
      >
        {{ ui.checkAnswers }}
      </Button>

      <div v-if="allChecked" class="p-4 bg-picton-blue-100 border-t">
        <Button
          :onClick="() => { showResults = true; }"
          variant="brand-lemon"
          class="w-full text-lg py-3"
          :aria-describedby="activityInstructionsId"
        >
          {{ ui.viewResults }}
        </Button>
      </div>
    </div>

    <div v-else class="flex flex-col h-full bg-picton-blue-100 p-6 overflow-y-auto" :style="contentStyle">
      <div class="bg-picton-blue-50 rounded-lg p-6">
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div
            v-for="(question, idx) in shuffledQuestions"
            :key="idx"
            class="p-4 rounded-lg border"
            :class="compareAnswersLocal(answers[idx] || '', question.answer) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
          >
            <div class="flex justify-between items-center mb-2">
              <p class="font-medium">{{ question.word }}</p>
              <div
                class="flex items-center justify-center rounded-full p-1"
                :class="compareAnswersLocal(answers[idx] || '', question.answer) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              >
                <Icon
                  :icon="compareAnswersLocal(answers[idx] || '', question.answer) ? 'mdi:check' : 'mdi:close'"
                  class="h-5 w-5"
                />
              </div>
            </div>

            <div class="space-y-2">
              <div>
                <p class="text-sm text-gray-500">{{ ui.yourAnswer }}</p>
                <p :class="compareAnswersLocal(answers[idx] || '', question.answer) ? 'text-green-600' : 'text-red-600'">
                  {{ answers[idx] || "(no answer)" }}
                </p>
              </div>
              <div
                v-if="props.feedback === 'wrong-correct-answers' && !compareAnswersLocal(answers[idx] || '', question.answer)"
              >
                <p class="text-sm text-gray-500">{{ ui.correctAnswer }}</p>
                <p class="text-green-600">
                  {{ Array.isArray(question.answer) ? question.answer.join(" / ") : question.answer }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <ActivityResults :score="score" :total="shuffledQuestions.length" :onRestart="resetGame" />
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
      :open="allChecked && !showResults"
      :onOpenChange="(open: boolean) => {
        if (!open) showResults = true;
      }"
    />
  </section>
</template>
