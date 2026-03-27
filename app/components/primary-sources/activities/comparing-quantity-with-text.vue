<script setup lang="ts">
import { ref } from "vue";
import DNDContext from "@/components/layout/dnd-context";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Question = {
  firstNumber: number;
  lastNumber: number;
  answer: string;
};

type DragEndEvent = {
  active: { id: string };
  over?: { id: string };
};

const options = ["is less than", "is equal to", "is greater than"];
const serverQuestions: Question[] = [
  { firstNumber: 5, lastNumber: 3, answer: "is greater than" },
  { firstNumber: 2, lastNumber: 7, answer: "is less than" },
  { firstNumber: 4, lastNumber: 4, answer: "is equal to" },
  { firstNumber: 9, lastNumber: 6, answer: "is greater than" },
  { firstNumber: 1, lastNumber: 8, answer: "is less than" },
];

const { playSound } = useSoundEffects();

const questions = ref(serverQuestions.map((question) => ({ ...question, answer: "" })));
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);

const handleDragEnd = (event: DragEndEvent) => {
  const overId = String(event.over?.id || "");
  const activeId = String(event.active?.id || "");
  if (!overId || !activeId) return;

  const questionIndex = Number(overId);
  const option = activeId.split("%")[2];
  if (!option) return;

  const nextQuestions = [...questions.value];
  nextQuestions[questionIndex] = {
    ...nextQuestions[questionIndex],
    answer: option,
  };

  questions.value = nextQuestions;

  if (nextQuestions.every((question) => question.answer !== "")) {
    score.value = nextQuestions.filter(
      (question, index) => question.answer === serverQuestions[index]?.answer,
    ).length;
    allAnswered.value = true;
    playSound("success");
  }
};

const resetActivity = () => {
  questions.value = serverQuestions.map((question) => ({ ...question, answer: "" }));
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
};
</script>

<template>
  <DNDContext :onDragEnd="handleDragEnd">
    <div class="flex h-full flex-col">
      <ActivityTitle title="Drag the labels to the gaps to complete the sentences" />

      <div v-if="!showResults" class="flex h-full flex-col justify-between gap-4">
        <div
          v-for="(question, questionIndex) in questions"
          :key="questionIndex"
          class="flex h-full items-center justify-between bg-picton-blue-50 p-2"
        >
          <div class="flex w-full items-center justify-between">
            <div class="flex items-center gap-4 text-xl">
              <p>{{ questionIndex + 1 }}</p>
              <div class="flex items-center gap-4">
                <span>{{ question.firstNumber }}</span>
                <span
                  v-if="question.answer"
                  class="rounded-xl bg-lemon-100 px-4 py-2 text-lemon-700"
                >
                  {{ question.answer }}
                </span>
                <Droppable
                  v-else
                  :id="String(questionIndex)"
                  class="flex h-12 w-28 items-center justify-center rounded-xl bg-picton-blue-200"
                  isOverClassName="bg-lemon-200"
                />
                <span>
                  {{
                    `${question.firstNumber > question.lastNumber || question.firstNumber < question.lastNumber ? "than" : "to"} ${question.lastNumber}`
                  }}
                </span>
              </div>
            </div>

            <div class="flex space-x-2">
              <Draggable
                v-for="option in options.filter((option) => !question.answer || question.answer !== option)"
                :key="option"
                :id="`option%${questionIndex}%${option}`"
                :disabled="question.answer !== ''"
                :class="[
                  'flex items-center justify-center rounded-xl bg-picton-blue-200 p-2',
                  question.answer !== '' && 'cursor-not-allowed opacity-50',
                ]"
              >
                {{ option }}
              </Draggable>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-1 flex-col items-center justify-between p-4">
        <div class="w-full space-y-3">
          <div
            v-for="(question, index) in questions"
            :key="index"
            :class="
              question.answer === serverQuestions[index]?.answer
                ? 'flex items-center gap-3 rounded-md border border-green-300 bg-green-50 p-3'
                : 'flex items-center gap-3 rounded-md border border-red-300 bg-red-50 p-3'
            "
          >
            <div
              :class="
                question.answer === serverQuestions[index]?.answer
                  ? 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700'
                  : 'flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700'
              "
            >
              {{ question.answer === serverQuestions[index]?.answer ? "✓" : "✕" }}
            </div>

            <div class="flex-1">
              <p class="font-medium">Question {{ index + 1 }}</p>
              <div class="mt-1 text-sm">
                <span>{{ question.firstNumber }} </span>
                <span
                  :class="
                    question.answer === serverQuestions[index]?.answer
                      ? 'font-medium text-green-700'
                      : 'font-medium text-red-600'
                  "
                >
                  {{ question.answer }}
                </span>
                <span>
                  {{
                    ` ${
                      question.firstNumber > question.lastNumber || question.firstNumber < question.lastNumber
                        ? "than"
                        : "to"
                    } ${question.lastNumber}`
                  }}
                </span>
                <div
                  v-if="question.answer !== serverQuestions[index]?.answer"
                  class="mt-1 text-green-700"
                >
                  Correct answer: {{ serverQuestions[index]?.answer }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 w-full">
          <ActivityResults :score="score" :total="questions.length" :onRestart="resetActivity" />
        </div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="questions.length"
      :open="allAnswered && !showResults"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            showResults = true;
          }
          allAnswered = open;
        }
      "
    />
  </DNDContext>
</template>
