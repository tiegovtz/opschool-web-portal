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
        ? "Panga maneno kwa mpangilio sahihi. Baada ya kukamilisha nafasi zote, tumia kitufe cha Tazama Matokeo kuona alama yako na kuanza tena ikihitajika."
        : "Rearrange the words into the correct order. After completing all blanks, use the View Results button to review your score and restart if needed." }}
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
            <Draggable v-for="(word, index) in question.question" :key="index" :word="word" :questionId="question.id"
              :id="`draggable-item-${index}`"><template>
                {{ word }}
              </template>
            </Draggable>
          </div>

          <!-- ANSWERS -->
          <div class="flex gap-2 mt-4">
            <template v-for="(slot, index) in question.answer" :key="index">
              <Draggable v-if="slot" :word="slot" :questionId="question.id" :id="`draggable-item-${index}`">
                <template>
                  {{ slot }}
                </template>
              </Draggable>

              <Droppable v-else :id="`droppable-item${question.id}`" :questionId="question.id" :index="index"
                @drop="handleDrop" />
            </template>
          </div>
        </div>

        <div v-if="allAnswered" class="flex justify-end">
          <Button variant="brand-lemon" :aria-describedby="activityInstructionsId" @click="showResults = true">
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
