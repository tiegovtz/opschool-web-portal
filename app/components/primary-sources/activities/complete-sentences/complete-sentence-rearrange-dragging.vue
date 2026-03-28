<script setup lang="ts">
import { ref, computed, watch } from "vue";

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
  <div class="h-full flex flex-col">
    <h2 class="text-xl font-bold">{{ questionsList.title }}</h2>

    <!-- DND Provider -->
    <DndProvider :backend="isMobile ? TouchBackend : HTML5Backend">
      <div class="flex-1 flex flex-col gap-10">
        <div v-for="(question, i) in questionsList.questions" :key="question.id" class="p-4 rounded-lg bg-white">
          <p>{{ i + 1 }}.</p>

          <!-- WORD BANK -->
          <div class="flex gap-2">
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
      </div>
    </DndProvider>
  </div>
</template>