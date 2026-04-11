<script setup lang="tsx">
import { ref, computed, watch } from "vue";

// Components
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults from "@/components/templates/results";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import { shuffle } from "~/utilities/utils";

// Props
type Question = {
  id: string;
  question: string;
  answers: string[];
};

type ActivityProps = {
  feedback?: "none" | "wrong-correct" | "wrong-correct-answers";
  questions: {
    title: string;
    fontSize?: string;
    questions: Question[];
  };
};

const props = defineProps<ActivityProps>();
const ui = useActivityUiText();

// State
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const selectedWords = ref<Record<string, string[]>>({});
const shuffledQuestions = ref<Question[]>(shuffle([...props.questions.questions]));

const { playSound } = useSoundEffects();

// Utility to clean words for comparison
const cleanWord = (word: string) =>
  word.replace(/[.,!?;:()[\]{}""''`]/g, "").toLowerCase().trim();

// Handle word selection/deselection
function handleWordClick(questionId: string, word: string) {
  const current = selectedWords.value[questionId] || [];
  if (current.includes(word)) {
    selectedWords.value[questionId] = current.filter((w) => w !== word);
  } else {
    selectedWords.value[questionId] = [...current, word];
  }
}

// Check all answers
function checkAnswers() {
  let correctCount = 0;

  shuffledQuestions.value.forEach((q) => {
    const selected = selectedWords.value[q.id] || [];
    const correct = q.answers.map(cleanWord);
    const cleanedSelected = selected.map(cleanWord);

    const allCorrect =
      correct.length === cleanedSelected.length &&
      correct.every((ans) => cleanedSelected.includes(ans));

    if (allCorrect) correctCount++;
  });

  score.value = correctCount;
  allAnswered.value = true;
  playSound("success");
}

// Restart
function handleTryAgain() {
  allAnswered.value = false;
  showResults.value = false;
  score.value = 0;
  selectedWords.value = {};
  shuffledQuestions.value = shuffle([...props.questions.questions]);
}

// Render words with proper classes
function renderWords(questionId: string, question: string) {
  const words = question.split(" ");
  const q = shuffledQuestions.value.find((q) => q.id === questionId);
  const correctAnswers = q?.answers.map(cleanWord) || [];
  const selected = selectedWords.value[questionId] || [];
  const cleanedSelected = selected.map(cleanWord);
  const allCorrectSelected =
    correctAnswers.every((ans) => cleanedSelected.includes(ans)) &&
    correctAnswers.length === cleanedSelected.length;

  return words.map((word, idx) => {
    const isSelected = selected.includes(word);
    const isCorrect = correctAnswers.includes(cleanWord(word));

    let classes = "cursor-pointer mx-1 px-1 rounded ";

    if (!showResults.value) {
      classes += isSelected
        ? "bg-lemon-100 text-lemon-700 border border-lemon-700"
        : "hover:bg-picton-blue-100";
    } else {
      if (isSelected && isCorrect) {
        classes += allCorrectSelected
          ? "bg-green-100 text-green-700 border border-green-700"
          : "bg-amber-100 text-amber-700 border border-amber-700";
      } else if (isSelected && !isCorrect) {
        classes += "bg-red-100 text-red-700 border border-red-700";
      } else if (!isSelected && isCorrect && props.feedback === "wrong-correct-answers") {
        classes += "bg-amber-100 text-amber-700";
      }
    }

    return (
      <span
        key={idx}
        class={classes}
        onClick={() => !showResults.value && handleWordClick(questionId, word)}
      >
        {word}
      </span>
    );
  });
}
</script>

<template>
  <div class="h-full flex flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      class="flex flex-col gap-2"
      :style="{ fontSize: props.questions.fontSize ? props.questions.fontSize + 'px' : '20px' }"
    >
      <div
        v-for="(question, i) in shuffledQuestions"
        :key="question.id"
        class="p-4 bg-picton-blue-50 rounded-md"
      >
        <p>
          {{ i + 1 }}. <span v-for="w in renderWords(question.id, question.question)">{{ w }}</span>
        </p>
      </div>
    </div>

    <div v-if="!showResults" class="mt-4 flex justify-end">
      <button class="px-4 py-2 bg-yellow-400 rounded" @click="checkAnswers">
        {{ ui.checkAnswers }}
      </button>
    </div>

    <div v-if="showResults">
      <ActivityResults
        :score="score"
        :total="props.questions.questions.length"
        @onRestart="handleTryAgain"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered"
      @onOpenChange="(open:any) => { allAnswered = open; if (!open) showResults = true }"
    />
  </div>
</template>
