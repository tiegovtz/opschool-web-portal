<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { cn } from "~/utilities/utils";
import { Button } from "~/components/ui/button";
import ActivityTitle from "~/components/templates/activity-title";
import { useSoundEffects } from "~/composables/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      question: string[];
      answer: number;
    }[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const answers = ref<Record<number, number>>({});
const resultsDialogOpen = ref(false);

watch(
  () => props.questions,
  () => {
    score.value = 0;
    allAnswered.value = false;
    showResults.value = false;
    answers.value = {};
    resultsDialogOpen.value = false;
  },
  { deep: true },
);

const handleCheck = (questionIndex: number, answerIndex: number) => {
  answers.value = {
    ...answers.value,
    [questionIndex]: answerIndex,
  };
  allAnswered.value = Object.keys(answers.value).length === props.questions.questions.length;
};

const isQuestionCorrect = (questionIndex: number) =>
  answers.value[questionIndex] === props.questions.questions[questionIndex]?.answer;

const getQuestionContainerColor = (questionIndex: number) => {
  if (!showResults.value) {
    return answers.value[questionIndex] !== undefined ? "bg-lemon-100" : "bg-picton-blue-50";
  }
  return isQuestionCorrect(questionIndex) ? "bg-green-100" : "bg-red-100";
};

const checkAnswers = () => {
  let correctCount = 0;
  Object.keys(answers.value).forEach((questionIndex) => {
    const qIdx = Number.parseInt(questionIndex, 10);
    if (answers.value[qIdx] === props.questions.questions[qIdx]?.answer) {
      correctCount++;
    }
  });
  score.value = correctCount;
  playSound("success");
  resultsDialogOpen.value = true;
};

const resetActivity = () => {
  allAnswered.value = false;
  showResults.value = false;
  score.value = 0;
  answers.value = {};
  resultsDialogOpen.value = false;
};

const containerStyle = computed(() => ({
  fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : "20px",
}));
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />
    <div class="flex flex-col h-full gap-4 sm:p-4 overflow-auto" :style="containerStyle">
      <div
        v-for="(q, questionIndex) in props.questions.questions"
        :key="questionIndex"
        class="rounded-lg p-4 transition-colors duration-300"
        :class="cn(getQuestionContainerColor(questionIndex))"
      >
        <div class="flex items-center gap-2 mb-3">
          <span class="font-bold text-lg">{{ questionIndex + 1 }}.</span>
          <Icon
            v-if="showResults"
            :icon="isQuestionCorrect(questionIndex) ? 'mdi:check' : 'mdi:close'"
            :class="isQuestionCorrect(questionIndex) ? 'text-green-600 w-6 h-6' : 'text-red-600 w-6 h-6'"
          />
        </div>

        <div
          v-for="(sentence, sentenceIndex) in q.question"
          :key="sentenceIndex"
          class="flex items-center justify-between gap-4 py-2"
        >
          <p
            class="flex-1"
            :class="
              cn({
                'text-picton-blue-700': !showResults,
                'text-green-700': showResults && isQuestionCorrect(questionIndex),
                'text-red-700': showResults && !isQuestionCorrect(questionIndex),
              })
            "
          >
            {{ sentence }}
          </p>

          <button
            type="button"
            class="w-6 h-6 rounded border-2 flex items-center justify-center"
            :class="
              cn({
                'border-lemon-500 bg-lemon-500': !showResults && answers[questionIndex] === sentenceIndex,
                'border-gray-400': answers[questionIndex] !== sentenceIndex,
                'border-green-500 bg-green-500': showResults && answers[questionIndex] === sentenceIndex && isQuestionCorrect(questionIndex),
                'border-red-500 bg-red-500': showResults && answers[questionIndex] === sentenceIndex && !isQuestionCorrect(questionIndex),
              })
            "
            :disabled="showResults"
            @click="handleCheck(questionIndex, sentenceIndex)"
          >
            <span v-if="answers[questionIndex] === sentenceIndex" class="block w-2 h-2 rounded-full bg-white" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="!showResults && allAnswered" class="p-4 flex justify-end">
      <Button :onClick="checkAnswers" variant="brand-lemon">{{ ui.checkAnswers }}</Button>
    </div>

    <div v-if="showResults" class="p-4">
      <ActivityResults :score="score" :total="props.questions.questions.length" :onRestart="resetActivity" />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="resultsDialogOpen"
      :onOpenChange="(open: boolean) => {
        if (!open) showResults = true;
        resultsDialogOpen = open;
      }"
    />
  </div>
</template>
