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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSoundEffects } from "~/composables/use-sound-effects";

type PlaceValuesQuestion = {
  id: number;
  number: string;
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: PlaceValuesQuestion[];
  };
};

type AnswerRecord = {
  questionIndex: number;
  question: string;
  userAnswers: Record<string, string>;
  isCorrect: boolean;
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const userAnswers = ref<Record<number, Record<string, string>>>({});
const showFeedback = ref(false);
const score = ref(0);
const showResultsDialog = ref(false);
const answerRecords = ref<AnswerRecord[]>([]);
const showResults = ref(false);
const validationError = ref<string | null>(null);
const questionsData = ref(props.questions);

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
    return baseNames.slice(0, numDigits).reverse();
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
      result.push(suffix);
    } else if (powerOfTen % 3 === 1) {
      result.push(`Ten ${result[index - 1]}`);
    } else {
      result.push(`Hundred ${result[index - 2]}`);
    }
  }

  return result.reverse();
};

const totalQuestions = computed(() => questionsData.value.questions.length);

const initializeAnswers = () => {
  const initialAnswers: Record<number, Record<string, string>> = {};
  questionsData.value.questions.forEach((question, questionIndex) => {
    initialAnswers[questionIndex] = {};
    getExtendedPlaceValueNames(question.number.length).forEach((placeValue) => {
      initialAnswers[questionIndex][placeValue] = "";
    });
  });
  userAnswers.value = initialAnswers;
};

watch(() => props.questions, () => {
  questionsData.value = props.questions;
  showFeedback.value = false;
  score.value = 0;
  showResultsDialog.value = false;
  answerRecords.value = [];
  showResults.value = false;
  validationError.value = null;
  initializeAnswers();
}, { deep: true, immediate: true });

const getPlaceValues = (number: string) => getExtendedPlaceValueNames(number.length);
const getMaxPlaceValues = () => {
  const maxLength = Math.max(...questionsData.value.questions.map((question) => question.number.length));
  return getExtendedPlaceValueNames(maxLength);
};

const handlePlaceValueInput = (questionIndex: number, placeValue: string, value: string) => {
  const text = String(value ?? "");
  if (text === "" || /^\d+$/.test(text)) {
    userAnswers.value = {
      ...userAnswers.value,
      [questionIndex]: {
        ...userAnswers.value[questionIndex],
        [placeValue]: text,
      },
    };
  }
};

const getExpectedDigitForPlaceValue = (question: PlaceValuesQuestion, placeValue: string) => {
  const digits = question.number.split("");
  const placeValueNames = getExtendedPlaceValueNames(digits.length);
  const index = placeValueNames.indexOf(placeValue);
  return index !== -1 ? digits[index] : "";
};

const checkAnswers = () => {
  const allInputsFilled = Object.values(userAnswers.value).every((answers) =>
    Object.values(answers).every((value) => value !== ""),
  );

  if (!allInputsFilled) {
    validationError.value = "Please fill in all answers before checking.";
    setTimeout(() => {
      validationError.value = null;
    }, 4000);
    return;
  }

  let correctCount = 0;
  const records: AnswerRecord[] = [];

  questionsData.value.questions.forEach((question, questionIndex) => {
    const placeValues = getExtendedPlaceValueNames(question.number.length);
    const isCorrect = placeValues.every(
      (placeValue) => userAnswers.value[questionIndex]?.[placeValue] === getExpectedDigitForPlaceValue(question, placeValue),
    );

    if (isCorrect) {
      correctCount += 1;
    }

    records.push({
      questionIndex,
      question: question.number,
      userAnswers: { ...userAnswers.value[questionIndex] },
      isCorrect,
    });
  });

  answerRecords.value = records;
  score.value = correctCount;
  if (correctCount > 0) playSound("success");
  else playSound("failure");

  if (props.feedback !== "none") {
    showFeedback.value = true;
  }

  showResultsDialog.value = true;
};

const resetActivity = () => {
  const digitCount = questionsData.value.questions[0]?.number.length || 1;
  const nextQuestions = Array.from({ length: totalQuestions.value }, (_, index) => {
    const min = Math.pow(10, digitCount - 1);
    const max = Math.pow(10, digitCount) - 1;
    return {
      id: index,
      number: Math.floor(min + Math.random() * (max - min + 1)).toString(),
    };
  });

  questionsData.value = {
    ...questionsData.value,
    questions: nextQuestions,
  };
  showFeedback.value = false;
  score.value = 0;
  answerRecords.value = [];
  showResults.value = false;
  validationError.value = null;
  initializeAnswers();
};

const getCellClassName = (questionIndex: number, placeValue: string) => {
  if (!showFeedback.value) return "";
  const question = questionsData.value.questions[questionIndex];
  const digit = userAnswers.value[questionIndex]?.[placeValue];
  const expectedDigit = getExpectedDigitForPlaceValue(question, placeValue);
  return digit === expectedDigit
    ? "bg-green-100 text-green-700 border-green-300"
    : "bg-red-100 text-red-700 border-red-300";
};

const getRowClassName = (questionIndex: number) => {
  if (!showFeedback.value) return "";
  const record = answerRecords.value.find((item) => item.questionIndex === questionIndex);
  return record?.isCorrect ? "bg-green-50/70" : "bg-red-50/70";
};
</script>

<template>
  <div class="relative flex h-full flex-col">
    <ActivityTitle :title="questionsData.title" />

    <div
      v-if="validationError"
      class="absolute left-0 right-0 top-0 z-50 mx-auto flex w-fit items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700 shadow-md"
    >
      <span>{{ validationError }}</span>
    </div>

    <div class="flex flex-1 flex-col justify-center">
      <div class="h-full w-full pb-4">
        <Table>
          <TableHeader>
            <TableRow class="bg-picton-blue-50">
              <TableHead class="whitespace-nowrap text-center font-bold text-picton-blue-800">Number</TableHead>
              <TableHead
                v-for="placeValue in getMaxPlaceValues()"
                :key="placeValue"
                class="whitespace-nowrap text-center font-bold text-picton-blue-800"
              >
                {{ placeValue }}
              </TableHead>
              <TableHead
                v-if="showFeedback"
                class="whitespace-nowrap text-center font-bold text-picton-blue-800"
              >
                Result
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody class="bg-picton-blue-50">
            <TableRow
              v-for="(question, questionIndex) in questionsData.questions"
              :key="question.id"
              :class="cn('border-none', getRowClassName(questionIndex))"
            >
              <TableCell class="border-r text-center text-lg font-bold text-picton-blue-700">
                {{ question.number }}
              </TableCell>

              <TableCell
                v-for="paddingIndex in getMaxPlaceValues().length - getPlaceValues(question.number).length"
                :key="`padding-${questionIndex}-${paddingIndex}`"
                class="border-r"
              />

              <TableCell
                v-for="placeValue in getPlaceValues(question.number)"
                :key="`${questionIndex}-${placeValue}`"
                :class="cn('border-r text-center', getCellClassName(questionIndex, placeValue))"
              >
                <Input
                  :model-value="userAnswers[questionIndex]?.[placeValue] || ''"
                  type="text"
                  maxlength="1"
                  :disabled="showFeedback"
                  class="mx-auto w-20 text-center !text-xl"
                  @update:model-value="
                    (value) => handlePlaceValueInput(questionIndex, placeValue, String(value ?? ''))
                  "
                />

                <div
                  v-if="
                    showFeedback &&
                    props.feedback === 'wrong-correct-answers' &&
                    userAnswers[questionIndex]?.[placeValue] !== getExpectedDigitForPlaceValue(question, placeValue)
                  "
                  class="mt-1 text-xs text-red-700"
                >
                  Correct: {{ getExpectedDigitForPlaceValue(question, placeValue) }}
                </div>
              </TableCell>

              <TableCell v-if="showFeedback" class="border-r text-center">
                <div
                  :class="
                    answerRecords.find((item) => item.questionIndex === questionIndex)?.isCorrect
                      ? 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700'
                      : 'mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700'
                  "
                >
                  {{
                    answerRecords.find((item) => item.questionIndex === questionIndex)?.isCorrect ? "✓" : "✕"
                  }}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <div v-if="showResults" class="flex flex-1 flex-col items-center justify-between">
      <div class="w-full">
        <ActivityResults :score="score" :total="totalQuestions" :onRestart="resetActivity" />
      </div>
    </div>

    <div v-else-if="!showFeedback" class="mb-4 flex justify-center">
      <Button variant="brand-lemon" @click="checkAnswers">Check Answers</Button>
    </div>

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
