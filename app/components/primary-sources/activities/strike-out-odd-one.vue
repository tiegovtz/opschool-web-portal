<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type InternalWord = {
  id: number;
  text: string;
  isCorrect: boolean;
  userSelected: boolean;
};

type InternalQuestion = {
  id: number;
  words: InternalWord[];
  userAnswered: boolean;
  isCorrect: boolean;
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      id: number;
      words: {
        id: number;
        text: string;
        isCorrect: boolean;
      }[];
    }[];
  };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const currentQuestions = ref<InternalQuestion[]>([]);
const showResultsDialog = ref(false);
const allAnswered = ref(false);
const showFeedback = ref(false);
const activityInstructionsId = "strike-out-odd-one-instructions";
const ui = useActivityUiText();
const activityStatusId = "strike-out-odd-one-status";
const keyboardStatusMessage = ref("");

const initializeQuestions = (): InternalQuestion[] =>
  props.questions.questions.map((question) => ({
    id: question.id,
    words: shuffle(
      question.words.map((word) => ({
        id: word.id,
        text: word.text,
        isCorrect: word.isCorrect,
        userSelected: false,
      })),
    ),
    userAnswered: false,
    isCorrect: false,
  }));

watch(
  () => props.questions.questions,
  () => {
    currentQuestions.value = initializeQuestions();
    showResultsDialog.value = false;
    allAnswered.value = false;
    showFeedback.value = false;
    keyboardStatusMessage.value = "";
  },
  { deep: true, immediate: true },
);

watch(
  currentQuestions,
  (value) => {
    const answered = value.filter((question) => question.userAnswered);
    if (
      answered.length === value.length &&
      value.length > 0 &&
      !showResultsDialog.value &&
      !allAnswered.value
    ) {
      allAnswered.value = true;
      showResultsDialog.value = true;
      keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${total.value}.`;
      playSound("success");
    }
  },
  { deep: true },
);

const score = computed(() => currentQuestions.value.filter((question) => question.isCorrect).length);
const total = computed(() => currentQuestions.value.length);

const handleWordClick = (questionId: number, wordId: number) => {
  const selectedWord = currentQuestions.value
    .find((question) => question.id === questionId)
    ?.words.find((word) => word.id === wordId);
  currentQuestions.value = currentQuestions.value.map((question) => {
    if (question.id !== questionId) return question;

    const updatedWords = question.words.map((word) =>
      word.id === wordId
        ? { ...word, userSelected: !word.userSelected }
        : { ...word, userSelected: false },
    );

    const selectedWords = updatedWords.filter((word) => word.userSelected);
    const correctWord = updatedWords.find((word) => word.isCorrect);

    if (selectedWords.length === 0) {
      return {
        ...question,
        words: updatedWords,
        userAnswered: false,
        isCorrect: false,
      };
    }

    return {
      ...question,
      words: updatedWords,
      userAnswered: true,
      isCorrect: selectedWords[0].id === correctWord?.id,
    };
  });

  keyboardStatusMessage.value = selectedWord
    ? ui.formatActivitySelected(ui.formatQuestion(currentQuestions.value.findIndex((q) => q.id === questionId) + 1), selectedWord.text)
    : "";
  playSound("click");
};

const handlePlayAgain = () => {
  currentQuestions.value = shuffle(initializeQuestions());
  showResultsDialog.value = false;
  allAnswered.value = false;
  showFeedback.value = false;
  keyboardStatusMessage.value = "";
};
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="strike-out-odd-one-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="strike-out-odd-one-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila kundi la maneno. Tumia enter au space kuchagua neno lisilofaa."
          : "Use Tab to move through each word group. Use Enter or Space to choose the odd word out."
      }}
    </p>
    <p :id="activityStatusId" aria-live="polite" class="sr-only">
      {{ keyboardStatusMessage }}
    </p>

    <div
      class="flex-1 overflow-y-auto bg-gradient-to-b from-picton-blue-50 to-white p-6"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '18px' }"
    >
      <div class="mx-auto max-w-6xl space-y-3">
        <div
          v-for="(question, questionIndex) in currentQuestions"
          :key="question.id"
          class="flex items-center gap-6"
          :aria-labelledby="`strike-out-odd-one-question-${question.id}`"
        >
          <h3 :id="`strike-out-odd-one-question-${question.id}`" class="font-semibold text-neutral-800">{{ questionIndex + 1 }}.</h3>

          <div
            class="grid flex-1 gap-4"
            :style="{ gridTemplateColumns: `repeat(${question.words.length}, minmax(0, 1fr))` }"
            role="group"
            :aria-label="ui.isSwahili ? `Chaguo za swali la ${questionIndex + 1}` : `Options for question ${questionIndex + 1}`"
          >
            <button
              v-for="word in question.words"
              :key="word.id"
              type="button"
              :aria-pressed="word.userSelected"
              :aria-label="ui.isSwahili ? `Swali la ${questionIndex + 1}, ${word.text}` : `Question ${questionIndex + 1}, ${word.text}`"
              :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
              :class="
                cn(
                  'relative grow cursor-pointer rounded-lg bg-picton-blue-100 p-4 text-center font-medium shadow-md transition-all duration-300 hover:bg-picton-blue-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
                  {
                    'border-neutral-300 bg-neutral-100 text-neutral-700': word.userSelected && !showFeedback,
                    'bg-green-100 text-green-700':
                      showFeedback && props.feedback === 'wrong-correct' && question.isCorrect,
                    'bg-red-100 text-red-700':
                      showFeedback && props.feedback === 'wrong-correct' && !question.isCorrect,
                    'border-green-400 bg-green-100':
                      showFeedback && props.feedback === 'wrong-correct-answers' && word.isCorrect,
                    'border-red-400 bg-red-200':
                      showFeedback &&
                      props.feedback === 'wrong-correct-answers' &&
                      word.userSelected &&
                      !word.isCorrect,
                    'pointer-events-none': showFeedback,
                  },
                )
              "
              @click="handleWordClick(question.id, word.id)"
            >
              <div class="relative">
                <span :class="{ 'line-through': word.userSelected }">{{ word.text }}</span>
                <div
                  v-if="word.userSelected"
                  class="absolute left-0 right-0 top-1/2 h-0.5 origin-left bg-red-500"
                />
              </div>

              <div
                v-if="showFeedback && props.feedback === 'wrong-correct-answers' && word.isCorrect"
                class="absolute -right-2 -top-2 rounded-full bg-green-500 p-1 text-white"
              >
                ✓
              </div>

              <div
                v-if="
                  showFeedback &&
                  props.feedback === 'wrong-correct-answers' &&
                  word.userSelected &&
                  !word.isCorrect
                "
                class="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white"
              >
                ✕
              </div>
            </button>
          </div>
        </div>
      </div>

      <ActivityResults
        v-if="showFeedback"
        className="bg-picton-blue-50 shadow-none"
        :score="score"
        :total="total"
        :onRestart="handlePlayAgain"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="total"
      :open="showResultsDialog"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            showResultsDialog = false;
            showFeedback = true;
          }
        }
      "
    />
  </section>
</template>
