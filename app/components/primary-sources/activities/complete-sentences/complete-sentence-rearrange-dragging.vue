<script setup lang="ts">
import { ref, computed, watch } from "vue";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults from "@/components/templates/results";
import { Button } from "~/components/ui/button";

// DND
import { DndProvider } from "vue3-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

// 
import { type FeedbackType } from "@/types/activity-types";
import { shuffle } from "~/utilities/utils";
import Droppable from "~/components/ui/dnd/droppable";
import Draggable from "~/components/ui/dnd/draggable";

const isMobile = useIsMobile()
type Question = {
  id: string;
  question: string[];
  answer: string[];
};

const props = defineProps<{
  feedback: FeedbackType;
  questionsList: {
    title: string;
    questions: Question[];
  };
}>();

const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const questionsData = ref(
  props.questionsList.questions.map((q) => ({
    id: q.id,
    question: [...q.question],
    answer: Array(q.answer.length).fill(""),
  }))
);

const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const activityInstructionsId = "complete-sentences-rearrange-dragging-instructions";
const activityStatusId = "complete-sentences-rearrange-dragging-status";
const selectedWord = ref<{ questionId: string; word: string } | null>(null);
const keyboardStatusMessage = ref("");

// ✅ Watch instead of useEffect
watch(
  questionsData,
  () => {
    const answered = questionsData.value.every((q) =>
      q.answer.every((a) => a)
    );

    if (answered) {
      allAnswered.value = true;
      playSound("success");

      const correctAnswers = props.questionsList.questions.map(
        (q) => q.answer
      );

      score.value = questionsData.value.reduce((acc, q, idx) => {
        const correct =
          q.answer.length === correctAnswers[idx]?.length &&
          q.answer.every((a, i) => a === correctAnswers[idx]?.[i]);

        return acc + (correct ? 1 : 0);
      }, 0);
      keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${props.questionsList.questions.length}.`;
    }
  },
  { deep: true }
);

// DROP HANDLER (replaces DragEndEvent)
function handleDrop(questionId: string, index: number, word: string) {
  questionsData.value = questionsData.value.map((q) => {
    if (q.id !== questionId) return q;

    const newAnswer = q.answer.map((a, i) => {
      if (i === index) return word;
      if (a === word) return "";
      return a;
    });

    const newQuestion = q.question.map((w) =>
      w === word ? "" : w
    );

    return {
      ...q,
      question: newQuestion,
      answer: newAnswer,
    };
  });
  keyboardStatusMessage.value = ui.formatActivityPlaced(ui.formatQuestion(index + 1), word);
}

function handleWordSelect(questionId: string, word: string) {
  if (showResults.value || !word) return;
  const isRemoving =
    selectedWord.value?.questionId === questionId && selectedWord.value.word === word;
  selectedWord.value = isRemoving ? null : { questionId, word };
  keyboardStatusMessage.value = isRemoving
    ? ui.formatActivityRemoved(ui.availableClueWords.value, word)
    : ui.formatActivitySelected(ui.availableClueWords.value, word);
}

function placeSelectedWord(questionId: string, index: number) {
  if (showResults.value) return;
  if (!selectedWord.value) {
    keyboardStatusMessage.value = ui.isSwahili.value
      ? "Chagua neno kwanza kabla ya kuliweka kwenye nafasi."
      : "Select a word first before placing it in a slot.";
    return;
  }
  handleDrop(questionId, index, selectedWord.value.word);
  selectedWord.value = null;
}

function removePlacedWord(questionId: string, index: number, word: string) {
  if (showResults.value) return;

  questionsData.value = questionsData.value.map((q) => {
    if (q.id !== questionId) return q;
    const newAnswer = q.answer.map((value, answerIndex) => (answerIndex === index ? "" : value));
    const newQuestion = [...q.question, word];
    return {
      ...q,
      question: shuffle(newQuestion.filter(Boolean)),
      answer: newAnswer,
    };
  });

  allAnswered.value = false;
  keyboardStatusMessage.value = ui.formatActivityRemoved(ui.formatQuestion(index + 1), word);
}

function resetActivity() {
  allAnswered.value = false;
  score.value = 0;
  showResults.value = false;

  questionsData.value = props.questionsList.questions.map((q) => ({
    id: q.id,
    question: shuffle([...q.question]),
    answer: Array(q.answer.length).fill(""),
  }));
  selectedWord.value = null;
  keyboardStatusMessage.value = "";
}
</script>

<template>
  <section
    class="h-full flex flex-col"
    aria-labelledby="complete-sentences-rearrange-dragging-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="complete-sentences-rearrange-dragging-title" class="sr-only">
      {{ questionsList.title }}
    </h2>
    <ActivityTitle :title="questionsList.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{ ui.isSwahili
        ? "Panga maneno kwa mpangilio sahihi. Unaweza kuburuta, au kutumia Tab kuchagua neno kisha kubonyeza nafasi inayofaa kuliweka. Bonyeza neno lililowekwa kuliondoa."
        : "Rearrange the words into the correct order. You can drag, or use Tab to select a word and then activate the matching blank to place it. Activate a placed word to remove it." }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <!-- DND Provider -->
    <DndProvider :backend="isMobile ? TouchBackend : HTML5Backend">
      <div v-if="!showResults" class="flex-1 flex flex-col gap-10" role="list" :aria-label="ui.sentenceRearrangeQuestions.value">
        <div
          v-for="(question, i) in questionsList.questions"
          :key="question.id"
          class="p-4 rounded-lg bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
          role="listitem"
          tabindex="0"
          :aria-labelledby="`complete-sentences-rearrange-dragging-question-${question.id}`"
        >
          <p :id="`complete-sentences-rearrange-dragging-question-${question.id}`">{{ i + 1 }}.</p>

          <!-- WORD BANK -->
          <div class="flex gap-2" role="group" :aria-label="ui.isSwahili ? `Swali la ${i + 1} benki ya maneno` : `Question ${i + 1} word bank`">
            <button
              v-for="(word, index) in question.question"
              :key="index"
              type="button"
              :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
              :aria-pressed="selectedWord?.questionId === question.id && selectedWord?.word === word"
              :class="[
                'rounded border border-picton-blue-400 bg-picton-blue-200 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2',
                selectedWord?.questionId === question.id && selectedWord?.word === word ? 'ring-2 ring-picton-blue-500 ring-offset-2' : '',
              ]"
              @click="handleWordSelect(question.id, word)"
            >
              {{ word }}
            </button>
          </div>

          <!-- ANSWERS -->
          <div class="flex gap-2 mt-4">
            <template v-for="(slot, index) in question.answer" :key="index">
              <button
                v-if="slot"
                type="button"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                :aria-label="ui.isSwahili ? `Neno ${slot} limewekwa kwenye nafasi ya ${index + 1}. Bonyeza kuliondoa.` : `Placed word ${slot} in slot ${index + 1}. Activate to remove it.`"
                class="rounded border border-lemon-400 bg-lemon-100 px-3 py-2 text-lemon-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
                :disabled="showResults"
                @click="removePlacedWord(question.id, index, slot)"
              >
                {{ slot }}
              </button>

              <button
                v-else
                type="button"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                :aria-label="
                  selectedWord
                    ? `Empty slot ${index + 1}. Activate to place ${selectedWord.word}.`
                    : `Empty slot ${index + 1}. Select a word first.`
                "
                class="min-h-10 min-w-24 rounded border border-picton-blue-300 bg-picton-blue-100 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
                @click="placeSelectedWord(question.id, index)"
              >
                <span class="text-sm text-picton-blue-700">
                  {{ selectedWord ? `Place ${selectedWord.word}` : "Blank" }}
                </span>
              </button>
            </template>
          </div>
        </div>

        <div v-if="allAnswered" class="flex justify-end">
          <Button variant="brand-lemon" :aria-describedby="`${activityInstructionsId} ${activityStatusId}`" @click="showResults = true">
            {{ ui.viewResults }}
          </Button>
        </div>
      </div>

      <div v-else class="bg-picton-blue-100 p-4 rounded-xl space-y-4" role="region" :aria-label="ui.sentenceRearrangeResults.value">
        <ActivityResults :score="score" :total="questionsList.questions.length" :onRestart="resetActivity" />
      </div>
    </DndProvider>
  </section>
</template>
