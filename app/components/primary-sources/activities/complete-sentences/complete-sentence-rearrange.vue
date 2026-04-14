<script setup lang="ts">
import { ref, watch } from "vue";
import ActivityTitle from "@/components/templates/activity-title";
import { Button } from "~/components/ui/button";
import { shuffle } from "~/utilities/utils";

type Question = {
  id: string;
  question: string;
  answer: string;
  options: string[];
};

const props = defineProps<{
  questions: {
    title: string;
    questions: Question[];
  };
}>();

const ui = useActivityUiText();
const { playSound } = useSoundEffects();

// STATE
const shuffledQuestions = ref(
  props.questions.questions.map((q) => ({
    ...q,
    options: shuffle([...q.options]),
  }))
);

const selectedWordIndices = ref<Record<number, number[]>>({});
const score = ref(0);
const checkedQuestions = ref<number[]>([]);
const feedbacks = ref<Record<number, boolean>>({});
const showResults = ref(false);
const activityInstructionsId = "complete-sentences-rearrange-instructions";

// Shuffle
function shuffleQuestions() {
  shuffledQuestions.value = props.questions.questions.map((q) => ({
    ...q,
    options: shuffle([...q.options]),
  }));
}

// INIT
watch(
  () => props.questions.questions,
  () => {
    shuffleQuestions();
  },
  { immediate: true }
);

// Get selected words
function getSelectedWords(index: number) {
  const indices = selectedWordIndices.value[index] || [];
  const question = shuffledQuestions.value[index];
  if (!question) return [];
  return indices.map(i => question.options[i]).filter(Boolean);
}


// ADD WORD
function handleWordClick(questionIndex: number, wordIndex: number) {
  if (checkedQuestions.value.includes(questionIndex)) return;

  const current = selectedWordIndices.value[questionIndex] || [];
  if (current.includes(wordIndex)) return;
  const updated = [...current, wordIndex];

  selectedWordIndices.value = {
    ...selectedWordIndices.value,
    [questionIndex]: updated,
  };

  const expected = computed(()=> (shuffledQuestions.value as any[])[questionIndex].answer.split(" ").length)
    

  if (updated.length === expected.value) {
    setTimeout(() => {
      const selectedWords = updated.map(
        (i) => (shuffledQuestions.value as any[])[questionIndex].options[i]
      );

      const userAnswer = selectedWords.join(" ").trim().toLowerCase();
      const correctAnswer =
        (shuffledQuestions.value as any[])[questionIndex].answer.toLowerCase();

      const isCorrect = userAnswer === correctAnswer;

      feedbacks.value = {
        ...feedbacks.value,
        [questionIndex]: isCorrect,
      };

      checkedQuestions.value = [
        ...checkedQuestions.value,
        questionIndex,
      ];

      if (isCorrect) {
        score.value++;
        playSound("correct");
      } else {
        playSound("failure");
      }

      if (
        checkedQuestions.value.length + 1 ===
        shuffledQuestions.value.length
      ) {
        playSound("success");
      }
    }, 100);
  }
}

// REMOVE WORD
function handleRemoveWord(questionIndex: number, selectedIndex: number) {
  if (checkedQuestions.value.includes(questionIndex)) return;

  const current = selectedWordIndices.value[questionIndex] || [];
  const updated = current.filter((_, i) => i !== selectedIndex);

  selectedWordIndices.value = {
    ...selectedWordIndices.value,
    [questionIndex]: updated,
  };
}

// RESET
function resetGame() {
  shuffleQuestions();
  selectedWordIndices.value = {};
  score.value = 0;
  checkedQuestions.value = [];
  feedbacks.value = {};
  showResults.value = false;
}
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-rearrange-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-rearrange-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Tumia kitufe cha Tab kupita kwenye vitufe vya maneno. Bonyeza Enter au Space kujenga sentensi kwenye sehemu ya jibu. Maswali yote yakikamilika, fungua mwonekano wa matokeo kuona alama yako."
        : "Use the Tab key to move between word buttons. Press Enter or Space to build the sentence in the answer area. When all questions are complete, open the results view to review your score." }}
    </p>

    <!-- GAME -->
    <div v-if="!showResults" class="flex flex-col h-full bg-blue-100">
      <div class="grid grid-cols-3 gap-4 p-4 flex-1 overflow-y-auto" role="list" :aria-label="ui.sentenceRearrangeQuestions.value">
        <div
          v-for="(question, index) in shuffledQuestions"
          :key="index"
          class="rounded-lg p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
          :class="{
            'bg-blue-50': !checkedQuestions.includes(index),
            'bg-green-100 text-green-700':
              checkedQuestions.includes(index) && feedbacks[index],
            'bg-red-100 text-red-700':
              checkedQuestions.includes(index) &&
              feedbacks[index] === false,
          }"
          role="listitem"
          tabindex="0"
          :aria-labelledby="`complete-sentences-rearrange-question-${index}`"
          :aria-describedby="checkedQuestions.includes(index) ? `complete-sentences-rearrange-result-${index}` : undefined"
        >
          <!-- OPTIONS -->
          <div class="flex flex-wrap gap-2 mb-4" role="group" :aria-label="ui.isSwahili ? `Swali la ${index + 1} chaguo za maneno` : `Question ${index + 1} word choices`">
            <button
              v-for="(word, optionIndex) in question.options"
              :key="optionIndex"
              class="px-3 py-1 text-lg rounded border cursor-pointer"
              :aria-label="ui.isSwahili ? `Swali la ${index + 1}, neno la ${optionIndex + 1}: ${word}` : `Question ${index + 1} word ${optionIndex + 1}: ${word}`"
              :class="{
                'opacity-50 pointer-events-none':
                  (selectedWordIndices[index] || []).includes(optionIndex) ||
                  checkedQuestions.includes(index),
              }"
              @click="handleWordClick(index, optionIndex)"
            >
              {{ word }}
            </button>
          </div>

          <!-- ANSWER -->
          <div
            class="min-h-[3rem] border-b-2 border-dashed flex flex-wrap gap-2 p-2"
            role="group"
            :aria-labelledby="`complete-sentences-rearrange-question-${index}`"
          >
            <span :id="`complete-sentences-rearrange-question-${index}`" class="sr-only">
              Question {{ index + 1 }}
            </span>
            <span
              v-for="(word, i) in getSelectedWords(index)"
              :key="i"
              class="px-3 py-1 rounded"
              :class="{
                'pointer-events-none':
                  checkedQuestions.includes(index),
              }"
            >
              {{ word }}
            </span>
          </div>

          <!-- FEEDBACK -->
          <div class="mt-4 text-right">
            <span
              v-if="checkedQuestions.includes(index)"
              :id="`complete-sentences-rearrange-result-${index}`"
              role="status"
              :aria-label="ui.formatQuestionResult(index + 1, feedbacks[index])"
            >
              {{ feedbacks[index] ? "✅" : "❌" }}
            </span>
          </div>
        </div>
      </div>

      <!-- BUTTON -->
      <div
        v-if="checkedQuestions.length === shuffledQuestions.length"
        class="p-4"
      >
        <Button
          variant="brand-lemon"
          class="w-full"
          :aria-describedby="activityInstructionsId"
          @click="showResults = true"
        >
          {{ ui.viewResults }}
        </Button>
      </div>
    </div>

    <!-- RESULTS -->
    <div v-else class="p-6 bg-blue-100 overflow-y-auto" role="region" :aria-label="ui.sentenceRearrangeResults.value">
      <div class="grid gap-4 mb-6" role="list" :aria-label="ui.resultsByQuestion.value">
        <div
          v-for="(question, idx) in shuffledQuestions"
          :key="idx"
          class="p-4 rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
          :class="feedbacks[idx] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
          role="listitem"
          tabindex="0"
        >
          <p class="text-sm text-gray-500">{{ ui.yourAnswer }}</p>
          <div class="flex gap-2">
            <span
              v-for="(word, i) in getSelectedWords(idx)"
              :key="i"
            >
              {{ word }}
            </span>
          </div>

          <p class="text-sm text-gray-500 mt-2">
            {{ ui.correctAnswer }}
          </p>
          <div class="flex gap-2">
            <span
              v-for="(word, i) in question.answer.split(' ')"
              :key="i"
            >
              {{ word }}
            </span>
          </div>
        </div>
      </div>

      <div class="text-center">
        <p class="text-xl font-bold" role="status" aria-live="polite">
          Score: {{ score }} / {{ shuffledQuestions.length }}
        </p>

        <Button
          variant="brand"
          class="mt-4"
          :aria-describedby="activityInstructionsId"
          @click="resetGame"
        >
          Restart
        </Button>
      </div>
    </div>
  </section>
</template>
