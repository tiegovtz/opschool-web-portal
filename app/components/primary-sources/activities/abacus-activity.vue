<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import type { FeedbackType } from "@/lib/types/activity-types";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { useSoundEffects } from "~/composables/use-sound-effects";

type AbacusQuestion = {
  id: number;
  number: string;
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: AbacusQuestion[];
  };
};

type AnswerRecord = {
  questionIndex: number;
  question: string;
  userAnswer: string;
  isCorrect: boolean;
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();

const currentQuestionIndex = ref(0);
const userAnswers = ref<Record<string, string>>({});
const wholeNumberAnswer = ref("");
const showFeedback = ref(false);
const score = ref(0);
const showResultsDialog = ref(false);
const answerRecords = ref<AnswerRecord[]>([]);
const showResults = ref(false);
const validationError = ref<string | null>(null);
const activityInstructionsId = "abacus-activity-instructions";
const activityStatusId = "abacus-activity-status";
const keyboardStatusMessage = ref("");

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

  if (numDigits <= baseNames.length) {
    return baseNames.slice(0, numDigits);
  }

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
      result.push(suffix as string);
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

const digitsByPlace = computed(() => {
  const digits = currentQuestion.value?.number.split("") || [];
  const mapping: Record<string, string> = {};
  placeValues.value.forEach((placeValue, index) => {
    mapping[placeValue] = digits[index] || "";
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
  const initialAnswers: Record<string, string> = {};
  placeValues.value.forEach((placeValue) => {
    initialAnswers[placeValue] = "";
  });
  userAnswers.value = initialAnswers;
  wholeNumberAnswer.value = "";
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
  keyboardStatusMessage.value = "";
  initializeQuestionState();
}, { deep: true });

const validateDigitsMatchWholeNumber = () =>
  placeValues.value.every((placeValue) => userAnswers.value[placeValue] !== "") &&
  placeValues.value.map((placeValue) => userAnswers.value[placeValue]).join("") === wholeNumberAnswer.value;

const checkAnswers = () => {
  const allInputsFilled =
    placeValues.value.every((placeValue) => userAnswers.value[placeValue] !== "") &&
    wholeNumberAnswer.value !== "";

  if (!allInputsFilled) {
    validationError.value = "Please fill in all text fields.";
    keyboardStatusMessage.value = validationError.value;
    setTimeout(() => {
      validationError.value = null;
    }, 4000);
    return;
  }

  if (!validateDigitsMatchWholeNumber()) {
    validationError.value = "The individual place value digits don't match the whole number.";
    keyboardStatusMessage.value = validationError.value;
    setTimeout(() => {
      validationError.value = null;
    }, 4000);
    return;
  }

  const isCorrect = wholeNumberAnswer.value === currentQuestion.value?.number;
  answerRecords.value = [
    ...answerRecords.value,
    {
      questionIndex: currentQuestionIndex.value,
      question: currentQuestion.value?.number as string,
      userAnswer: wholeNumberAnswer.value,
      isCorrect,
    },
  ];

  if (isCorrect) {
    score.value += 1;
    playSound("correct");
  } else {
    playSound("failure");
  }

  if (props.feedback !== "none") {
    showFeedback.value = true;
  }
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value + (isCorrect ? 1 : 0)} / ${totalQuestions.value}.`;

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
  keyboardStatusMessage.value = "";
  initializeQuestionState();
};
</script>

<template>
  <section
    class="relative flex h-full flex-col"
    aria-labelledby="abacus-activity-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="abacus-activity-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kila thamani ya nafasi, sehemu zake za jibu, na kisanduku cha namba kamili."
          : "Use Tab to move through each place value, its answer field, and the whole number answer field."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

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
              <span>{{ ui.correctAnswer }} <strong>{{ question.number }}</strong></span>
              <span
                v-if="
                  props.feedback === 'wrong-correct-answers' &&
                  answerRecords.find((record) => record.questionIndex === index) &&
                  !answerRecords.find((record) => record.questionIndex === index)?.isCorrect
                "
                class="text-red-600"
              >
                {{ ui.yourAnswer }}
                <strong>{{ answerRecords.find((record) => record.questionIndex === index)?.userAnswer || "No answer" }}</strong>
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
        <div class="flex w-full items-end justify-center gap-1 overflow-x-auto pb-4">
          <div
            v-for="placeValue in placeValues"
            :key="placeValue"
            class="flex w-24 flex-shrink-0 flex-col items-center rounded-lg"
          >
            <div class="mb-2 flex h-16 items-center justify-center">
              <h3 class="px-1 text-center text-sm font-bold leading-tight text-picton-blue-700">
                {{ placeValue }}
              </h3>
            </div>

            <div class="relative mb-4 h-64 w-20 overflow-hidden rounded-lg border-2 border-lemon-800/50 bg-lemon-100">
              <div class="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 rounded-full bg-lemon-900" />
              <div
                v-for="beadIndex in Number.parseInt(digitsByPlace[placeValue] || '0', 10)"
                :key="`${placeValue}-${beadIndex}`"
                :class="[
                  'absolute left-1/2 h-[25px] w-10 -translate-x-1/2 rounded-[20px] border border-black/30 shadow-[0_2px_4px_rgba(0,0,0,0.2),inset_0_-2px_4px_rgba(0,0,0,0.2),inset_0_2px_4px_rgba(255,255,255,0.5)]',
                  getBeadColor(placeValue),
                ]"
                :style="{ top: `${256 - beadIndex * 28}px` }"
              />
            </div>

            <div class="mx-auto mt-4 w-[90%]">
              <Input
                :model-value="userAnswers[placeValue] || ''"
                type="text"
                maxlength="1"
                :disabled="showFeedback"
                :aria-label="ui.isSwahili ? `Namba ya ${placeValue}` : `${placeValue} digit`"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                class="w-full text-center !text-xl"
                @update:model-value="
                  (value) => {
                    const text = String(value ?? '');
                    if (text === '' || /^\\d+$/.test(text)) {
                      userAnswers = { ...userAnswers, [placeValue]: text };
                      keyboardStatusMessage = ui.formatActivityUpdated(placeValue, text);
                    }
                  }
                "
              />
            </div>
          </div>

          <div class="ml-4 flex items-center gap-2">
            <span class="text-2xl">=</span>
            <Input
              :model-value="wholeNumberAnswer"
              type="text"
              :disabled="showFeedback"
              :aria-label="ui.isSwahili ? 'Namba kamili' : 'Whole number answer'"
              :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
              :class="
                cn('mx-auto min-w-32 text-center !text-xl', {
                  'border-green-500 bg-green-100 text-green-700':
                    wholeNumberAnswer === currentQuestion?.number && showFeedback,
                  'border-red-500 bg-red-100 text-red-700':
                    wholeNumberAnswer !== currentQuestion?.number && showFeedback,
                })
              "
              @update:model-value="
                (value) => {
                  const text = String(value ?? '');
                  if (text === '' || /^\\d+$/.test(text)) {
                    wholeNumberAnswer = text;
                    keyboardStatusMessage = ui.formatActivityUpdated(ui.yourAnswer.value, text);
                  }
                }
              "
            />
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

        <Button variant="brand-lemon" class="w-fit" :aria-describedby="`${activityInstructionsId} ${activityStatusId}`" @click="checkAnswers">
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
  </section>
</template>
