<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Button } from "~/components/ui/button";
// import Input from "~/components/ui/inputs/input";
import ActivityTitle from "~/components/templates/activity-title";
import type { FeedbackType } from "~/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "~/components/templates/results";
import { shuffle } from "~/utilities/utils";

type Props = {
  questions: {
    title: string;
    options: string[];
    questions: {
      id: number | string;
      question: string;
      correctAnswer: string;
    }[];
  };
  feedback?: FeedbackType;
};

type QuestionState = {
  id: number | string;
  question: string;
  correctAnswer: string;
  displayText: string;
  highlightedWord: string;
  userAnswer: string;
  isCorrect?: boolean;
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const buildProcessedQuestions = (): QuestionState[] =>
  props.questions.questions.map((q) => {
    const underscoreIndex = q.question.indexOf("_");
    if (underscoreIndex !== -1) {
      const highlightedWord = q.question.substring(underscoreIndex + 1).split(" ")[0] || "";
      const displayText = q.question
        .replace(`_${highlightedWord}`, highlightedWord)
        .replace(/_/g, "");
      return { ...q, displayText, highlightedWord, userAnswer: "" };
    }
    return { ...q, displayText: q.question, highlightedWord: "", userAnswer: "" };
  });

const questionsState = ref<QuestionState[]>([]);
const showResults = ref(false);
const score = ref(0);
const allAnswered = ref(false);
const isDialogOpen = ref(false);
const activityInstructionsId = "complete-sentences-selecting-clues-instructions";
const activityOptionsId = "complete-sentences-selecting-clues-options";

const resetActivity = () => {
  questionsState.value = shuffle(
    buildProcessedQuestions().map((q) => ({
      ...q,
      userAnswer: "",
      isCorrect: undefined,
    })),
  );
  showResults.value = false;
  score.value = 0;
  allAnswered.value = false;
  isDialogOpen.value = false;
};

watch(
  () => props.questions,
  () => {
    resetActivity();
  },
  { immediate: true, deep: true },
);

watch(
  questionsState,
  () => {
    allAnswered.value = questionsState.value.every((q) => q.userAnswer.trim() !== "");
  },
  { deep: true },
);

const handleInputChange = (questionId: number | string, value: string) => {
  questionsState.value = questionsState.value.map((q) =>
    q.id === questionId ? { ...q, userAnswer: value } : q,
  );
};

const checkAnswers = () => {
  let correctCount = 0;
  questionsState.value = questionsState.value.map((q) => {
    const isCorrect = q.userAnswer.trim().toLowerCase() === q.correctAnswer.toLowerCase();
    if (isCorrect) correctCount++;
    return { ...q, isCorrect };
  });
  score.value = correctCount;
  playSound("success");
  isDialogOpen.value = true;
};

const selectableWords = computed(() => (props.questions.options || []).filter((w) => w.trim() !== ""));
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-selecting-clues-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-selecting-clues-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Tumia kitufe cha Tab kupita kwenye kila sehemu ya jibu na kitufe cha Kagua Majibu. Maneno ya vidokezo yanaonyeshwa chini ya maswali kama rejea."
        : "Use the Tab key to move between each answer field and the Check Answers button. The clue words are shown below the questions for reference." }}
    </p>

    <div class="space-y-4 overflow-y-auto flex-1 p-2" role="list" :aria-label="ui.completeSentenceQuestions.value">
      <div
        v-for="(q, index) in questionsState"
        :key="q.id"
        class="p-4 bg-white rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
        role="listitem"
        tabindex="0"
        :aria-labelledby="`complete-sentences-selecting-clues-question-${q.id}`"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span :id="`complete-sentences-selecting-clues-question-${q.id}`" class="font-bold text-red-500 min-w-8">{{ index + 1 }}.</span>
          <div class="font-medium">
            {{ q.displayText.split(q.highlightedWord)[0] }}
            <span class="bg-picton-blue-200 px-2 py-1 rounded">{{ q.highlightedWord }}</span>
            {{ q.displayText.split(q.highlightedWord).slice(1).join(q.highlightedWord) }}
          </div>

          <Input
            :model-value="q.userAnswer"
            :disabled="showResults"
            class="flex-1 min-w-32 ml-4"
            placeholder="Type answer here"
            @update:modelValue="(v: string | number) => handleInputChange(q.id, String(v ?? ''))"
          />

          <div
            v-if="showResults"
            class="text-sm"
            :class="q.isCorrect ? 'text-green-600' : 'text-red-600'"
            role="status"
            :aria-label="ui.formatQuestionResult(index + 1, q.isCorrect === true)"
          >
            {{ q.isCorrect ? ui.correct : ui.incorrect }}
          </div>
        </div>
        <div
          v-if="showResults && props.feedback === 'wrong-correct-answers' && q.isCorrect === false"
          class="mt-2 text-sm text-green-600"
        >
          {{ ui.formatCorrectAnswer(q.correctAnswer) }}
        </div>
      </div>
    </div>

    <div
      v-if="!showResults"
      :id="activityOptionsId"
      class="flex flex-wrap mt-4 gap-4"
      role="group"
      :aria-label="ui.availableClueWords.value"
    >
      <span
        v-for="(word, i) in selectableWords"
        :key="i"
        tabindex="0"
        class="px-2 py-1 rounded bg-picton-blue-100 text-picton-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
      >
        {{ word }}
      </span>
    </div>

    <ActivityResults
      v-if="showResults"
      :score="score"
      :total="questionsState.length"
      :onRestart="resetActivity"
    />
    <div v-else class="flex mt-4 justify-end">
      <Button
        :onClick="checkAnswers"
        :disabled="!allAnswered"
        :aria-describedby="selectableWords.length ? activityOptionsId : activityInstructionsId"
      >
        {{ ui.checkAnswers }}
      </Button>
    </div>

    <ActivityResultsAlertDialog
      :open="isDialogOpen"
      :score="score"
      :total="questionsState.length"
      :onOpenChange="(open: boolean) => {
        if (!open) {
          if (props.feedback === 'none') resetActivity();
          else showResults = true;
          isDialogOpen = false;
        }
      }"
    />
  </section>
</template>
