<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import type { FeedbackType } from "@/lib/types/activity-types";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useSoundEffects } from "~/composables/use-sound-effects";

type ReverseAbacusQuestion = {
  id: number;
  number: string;
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: ReverseAbacusQuestion[];
  };
};

type AnswerRecord = {
  questionIndex: number;
  question: string;
  isCorrect: boolean;
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const beadCounts = ref<Record<string, number>>({});
const currentQuestionIndex = ref(0);
const showFeedback = ref(false);
const score = ref(0);
const showResultsDialog = ref(false);
const answerRecords = ref<AnswerRecord[]>([]);
const showResults = ref(false);
const validationError = ref<string | null>(null);

const currentQuestion = computed(() => props.questions.questions[currentQuestionIndex.value]);
const totalQuestions = computed(() => props.questions.questions.length);

const getExtendedPlaceValueNames = (numDigits: number) => {
  const baseNames = [
    "Ones",
    "Tens",
    "Hundreds",
    "Thousands",
    "Ten Thousands",
    "Hundred Thousands",
    "Millions",
    "Ten Millions",
    "Hundred Millions",
    "Billions",
    "Ten Billions",
    "Hundred Billions",
    "Trillions",
    "Ten Trillions",
    "Hundred Trillions",
  ];

  if (numDigits <= baseNames.length) return baseNames.slice(0, numDigits);

  const result = [...baseNames];
  for (let index = baseNames.length; index < numDigits; index += 1) {
    const powerOfTen = index;
    if (powerOfTen % 3 === 0) {
      const suffixIndex = Math.floor(powerOfTen / 3);
      const suffixes = [
        "",
        "Thousand",
        "Million",
        "Billion",
        "Trillion",
        "Quadrillion",
        "Quintillion",
      ];
      const suffix = suffixIndex < suffixes.length ? suffixes[suffixIndex] : `10^${powerOfTen}`;
      result.push(suffix);
    } else if (powerOfTen % 3 === 1) {
      result.push(`Ten ${result[index - 1]}`);
    } else {
      result.push(`Hundred ${result[index - 2]}`);
    }
  }
  return result;
};

const placeValues = computed(() => {
  const digits = currentQuestion.value?.number.split("") || [];
  return getExtendedPlaceValueNames(digits.length).slice(0, digits.length).reverse();
});

const expectedDigitsByPlace = computed(() => {
  const digits = currentQuestion.value?.number.split("") || [];
  const mapping: Record<string, number> = {};
  placeValues.value.forEach((placeValue, index) => {
    mapping[placeValue] = Number.parseInt(digits[index] || "0", 10);
  });
  return mapping;
});

const getBeadColor = (placeValue: string) => {
  const pattern = placeValue.toLowerCase();
  if (pattern.includes("one")) return "bg-yellow-400";
  if (pattern.includes("ten")) return "bg-sky-400";
  if (pattern.includes("hundred")) return "bg-red-400";
  if (pattern.includes("thousand")) return "bg-green-400";
  if (pattern.includes("million")) return "bg-purple-400";
  if (pattern.includes("billion")) return "bg-orange-400";
  if (pattern.includes("trillion")) return "bg-pink-400";
  return "bg-gray-400";
};

const initializeQuestionState = () => {
  beadCounts.value = placeValues.value.reduce((acc, placeValue) => {
    acc[placeValue] = 0;
    return acc;
  }, {} as Record<string, number>);
  showFeedback.value = false;
};

watch(currentQuestionIndex, initializeQuestionState, { immediate: true });
watch(() => props.questions.questions, () => {
  currentQuestionIndex.value = 0;
  score.value = 0;
  answerRecords.value = [];
  showResults.value = false;
  showResultsDialog.value = false;
  validationError.value = null;
  initializeQuestionState();
}, { deep: true });

const handleAddBead = (placeValue: string) => {
  const count = beadCounts.value[placeValue] || 0;
  if (count >= 9) {
    validationError.value = "Maximum of 9 beads per column reached";
    setTimeout(() => {
      validationError.value = null;
    }, 2000);
    return;
  }

  beadCounts.value = {
    ...beadCounts.value,
    [placeValue]: count + 1,
  };
  playSound("click");
};

const handleRemoveBead = (placeValue: string) => {
  beadCounts.value = {
    ...beadCounts.value,
    [placeValue]: Math.max(0, (beadCounts.value[placeValue] || 0) - 1),
  };
};

const checkAnswers = () => {
  const isCorrect = placeValues.value.every(
    (placeValue) => (beadCounts.value[placeValue] || 0) === expectedDigitsByPlace.value[placeValue],
  );

  answerRecords.value = [
    ...answerRecords.value,
    {
      questionIndex: currentQuestionIndex.value,
      question: currentQuestion.value.number,
      isCorrect,
    },
  ];

  if (isCorrect) {
    score.value += 1;
    playSound("success");
  } else {
    playSound("failure");
  }

  if (props.feedback !== "none") {
    showFeedback.value = true;
  }

  if (currentQuestionIndex.value === totalQuestions.value - 1) {
    if (props.feedback === "none") {
      setTimeout(() => resetActivity(), 500);
    } else {
      showResultsDialog.value = true;
    }
    return;
  }

  setTimeout(() => {
    currentQuestionIndex.value += 1;
  }, props.feedback === "none" ? 0 : 1200);
};

const resetActivity = () => {
  currentQuestionIndex.value = 0;
  score.value = 0;
  answerRecords.value = [];
  showResults.value = false;
  showResultsDialog.value = false;
  validationError.value = null;
  initializeQuestionState();
};
</script>

<template>
  <div class="relative flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="validationError"
      class="absolute left-0 right-0 top-0 z-50 mx-auto flex w-fit items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700 shadow-md"
    >
      <span>{{ validationError }}</span>
    </div>

    <div v-if="showResults" class="flex flex-1 flex-col items-center justify-between">
      <div class="w-full space-y-3">
        <div
          v-for="(question, index) in props.questions.questions"
          :key="question.id"
          :class="
            answerRecords.find((record) => record.questionIndex === index)?.isCorrect
              ? 'flex items-center gap-3 rounded-md border border-green-300 bg-green-50 p-3'
              : 'flex items-center gap-3 rounded-md border border-red-300 bg-red-50 p-3'
          "
        >
          <div
            :class="
              answerRecords.find((record) => record.questionIndex === index)?.isCorrect
                ? 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700'
                : 'flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700'
            "
          >
            {{
              answerRecords.find((record) => record.questionIndex === index)?.isCorrect ? "✓" : "✕"
            }}
          </div>

          <div class="flex-1">
            <p class="font-medium">{{ ui.formatQuestion(index + 1) }}</p>
            <div class="mt-1 flex items-center gap-2 text-sm">
              <span>Number to represent: <strong>{{ question.number }}</strong></span>
              <span
                v-if="
                  props.feedback === 'wrong-correct-answers' &&
                  !answerRecords.find((record) => record.questionIndex === index)?.isCorrect
                "
                class="text-red-600"
              >
                You placed the beads incorrectly.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full">
        <ActivityResults :score="score" :total="totalQuestions" :onRestart="resetActivity" />
      </div>
    </div>

    <template v-else>
      <div class="flex flex-1 flex-col justify-center overflow-hidden">
        <div class="flex w-full flex-col items-center">
          <div class="flex w-full items-end justify-center gap-1 overflow-x-auto pb-4">
            <div
              v-for="placeValue in placeValues"
              :key="placeValue"
              class="flex w-24 flex-shrink-0 flex-col items-center rounded-lg"
            >
              <h3 class="my-4 px-1 text-center text-sm font-bold leading-tight text-picton-blue-700">
                {{ placeValue }}
              </h3>

              <div class="relative mb-4 h-[300px] w-20 overflow-hidden rounded-lg border-2 border-lemon-800/50 bg-lemon-100">
                <div class="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 rounded-full bg-lemon-900" />

                <button
                  v-for="beadIndex in beadCounts[placeValue] || 0"
                  :key="`${placeValue}-${beadIndex}`"
                  type="button"
                  :class="[
                    'absolute left-1/2 h-[25px] w-[50px] -translate-x-1/2 rounded-[20px] border border-black/30 shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.5)]',
                    getBeadColor(placeValue),
                    !showFeedback && 'hover:brightness-110 active:brightness-90',
                  ]"
                  :style="{ top: `${300 - beadIndex * 31 - 2}px` }"
                  :disabled="showFeedback"
                  @click="handleRemoveBead(placeValue)"
                />
              </div>

              <div class="relative mt-2">
                <button
                  type="button"
                  :disabled="(beadCounts[placeValue] || 0) >= 9 || showFeedback"
                  :class="[
                    'relative h-[50px] w-[50px] rounded-full border border-black/30 shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.5)]',
                    getBeadColor(placeValue),
                    ((beadCounts[placeValue] || 0) >= 9 || showFeedback) && 'opacity-50',
                    !((beadCounts[placeValue] || 0) >= 9 || showFeedback) && 'hover:brightness-110 active:brightness-90',
                  ]"
                  @click="handleAddBead(placeValue)"
                />

                <div
                  v-if="showFeedback"
                  :class="
                    (beadCounts[placeValue] || 0) === expectedDigitsByPlace[placeValue]
                      ? 'absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-green-100 px-2 py-1 text-sm font-semibold text-green-700'
                      : 'absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-700'
                  "
                >
                  {{ (beadCounts[placeValue] || 0) === expectedDigitsByPlace[placeValue] ? ui.correct : ui.incorrect }}
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border-2 border-picton-blue-200 bg-picton-blue-50 px-10 py-2 text-3xl font-bold text-picton-blue-700">
            {{ currentQuestion.number }}
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <div class="flex justify-center gap-4">
          <div
            v-for="(_, index) in props.questions.questions"
            :key="index"
            :class="
              cn('flex h-10 w-10 items-center justify-center rounded-lg bg-picton-blue-200', {
                'bg-lemon-200': answerRecords.find((record) => record.questionIndex === index),
                'border-2 border-picton-blue-500':
                  index === currentQuestionIndex &&
                  !answerRecords.find((record) => record.questionIndex === index),
              })
            "
          >
            <template v-if="answerRecords.find((record) => record.questionIndex === index)">
              {{
                answerRecords.find((record) => record.questionIndex === index)?.isCorrect ? "✓" : "✕"
              }}
            </template>
          </div>
        </div>

        <Button variant="brand-lemon" class="w-fit" @click="checkAnswers">
          {{ ui.checkAnswer }}
        </Button>
      </div>
    </template>

    <ActivityResultsAlertDialog
      :score="score"
      :total="totalQuestions"
      :open="showResultsDialog"
      :onOpenChange="
        (open: boolean) => {
          showResultsDialog = open;
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else {
              showResults = true;
            }
          }
        }
      "
    />
  </div>
</template>
