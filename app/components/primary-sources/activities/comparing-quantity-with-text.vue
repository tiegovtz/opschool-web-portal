<script setup lang="ts">
// @ts-nocheck
import { ref } from "vue";
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
const ui = useActivityUiText();
const activityInstructionsId = "comparing-quantity-with-text-instructions";

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

const assignOption = (questionIndex: number, option: string) => {
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
    return;
  }

  playSound("click");
};

const clearOption = (questionIndex: number) => {
  const nextQuestions = [...questions.value];
  nextQuestions[questionIndex] = {
    ...nextQuestions[questionIndex],
    answer: "",
  };
  questions.value = nextQuestions;
  playSound("click");
};
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="comparing-quantity-with-text-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="comparing-quantity-with-text-title" class="sr-only">
      Drag the labels to the gaps to complete the sentences
    </h2>
      <ActivityTitle title="Drag the labels to the gaps to complete the sentences" />
      <p :id="activityInstructionsId" class="sr-only">
        {{
          ui.isSwahili
            ? "Tumia tab kusogea kwenye chaguo na sentensi. Chagua chaguo kwa enter au space na litumie kwenye sentensi inayofaa."
            : "Use Tab to move through the choices and sentences. Select a choice with Enter or Space and apply it to the correct sentence."
        }}
      </p>

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
                <button
                  type="button"
                  class="flex h-12 w-40 items-center justify-center rounded-xl bg-picton-blue-200 px-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2"
                  :aria-label="question.answer ? `${question.answer}` : `Select relation for question ${questionIndex + 1}`"
                  @click="question.answer ? clearOption(questionIndex) : undefined"
                >
                  <span
                    v-if="question.answer"
                    class="rounded-xl bg-lemon-100 px-4 py-2 text-lemon-700"
                  >
                    {{ question.answer }}
                  </span>
                  <span v-else>{{ ui.isSwahili ? "Chagua" : "Choose" }}</span>
                </button>
                <span>
                  {{
                    `${question.firstNumber > question.lastNumber || question.firstNumber < question.lastNumber ? "than" : "to"} ${question.lastNumber}`
                  }}
                </span>
              </div>
            </div>

            <div class="flex space-x-2" role="group" :aria-label="ui.isSwahili ? `Chaguo za swali la ${questionIndex + 1}` : `Choices for question ${questionIndex + 1}`">
              <button
                v-for="option in options"
                :key="option"
                type="button"
                :disabled="question.answer === option"
                :aria-pressed="question.answer === option"
                :class="[
                  'flex items-center justify-center rounded-xl bg-picton-blue-200 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
                  question.answer === option && 'cursor-not-allowed opacity-50',
                ]"
                @click="assignOption(questionIndex, option)"
              >
                {{ option }}
              </button>
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
              <p class="font-medium">{{ ui.formatQuestion(index + 1) }}</p>
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
                  {{ ui.formatCorrectAnswer(serverQuestions[index]?.answer) }}
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
  </section>
</template>
