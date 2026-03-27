<script setup lang="ts">
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TwoUnitsQuestion = {
  id: number;
  question: string;
  answer: string;
};

type CurrencyAnswer = {
  shs: string;
  cts: string;
};

type Props = {
  questions: TwoUnitsQuestion[];
  feedback?: "wrong-correct" | "wrong-correct-answers" | "none";
  isExamMode?: boolean;
  onActivityComplete?: (
    score: number,
    totalQuestions: number,
    userAnswers: CurrencyAnswer[],
  ) => void;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct",
});

const emptyAnswers = () => props.questions.map(() => ({ shs: "", cts: "" }));

const userAnswers = ref<CurrencyAnswer[]>(emptyAnswers());
const submitted = ref(false);
const showResults = ref(false);

const parseOperation = (question: string) => {
  const match = question.match(
    /shs\s+(\d+)\s+(\d+)\s+cts\s*([+\-])\s*shs\s+(\d+)\s+(\d+)\s+cts\s*=\s*___/,
  );

  if (!match) {
    return null;
  }

  return {
    firstNumber: { shs: match[1], cts: match[2] },
    operator: match[3],
    secondNumber: { shs: match[4], cts: match[5] },
  };
};

const parseAnswer = (answer: string) => {
  const match = answer.match(/shs\s+(\d+)\s+(\d+)\s+cts/);
  return match ? { shs: match[1], cts: match[2] } : { shs: "", cts: "" };
};

const checkAnswer = (userAnswer: CurrencyAnswer, correctAnswer: string) => {
  const correct = parseAnswer(correctAnswer);
  return (
    userAnswer.shs.trim() === correct.shs &&
    userAnswer.cts.trim() === correct.cts
  );
};

const score = computed(() =>
  props.questions.reduce(
    (total, question, index) =>
      total + (checkAnswer(userAnswers.value[index], question.answer) ? 1 : 0),
    0,
  ),
);

const allAnswered = computed(() =>
  userAnswers.value.every((answer) => answer.shs.trim() !== "" && answer.cts.trim() !== ""),
);

const updateAnswer = (index: number, value: CurrencyAnswer) => {
  const nextAnswers = [...userAnswers.value];
  nextAnswers[index] = value;
  userAnswers.value = nextAnswers;
};

const resetActivity = () => {
  submitted.value = false;
  showResults.value = false;
  userAnswers.value = emptyAnswers();
};

const handleSubmit = () => {
  submitted.value = true;
  props.onActivityComplete?.(score.value, props.questions.length, userAnswers.value);
};
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex flex-1 gap-4">
      <div class="flex h-full w-full flex-col gap-4">
        <div class="h-full bg-picton-blue-50 p-4">
          <div class="grid h-full grid-cols-1 gap-6 xl:grid-cols-2">
            <div
              v-for="(question, index) in props.questions"
              :key="question.id"
              :class="
                cn(
                  'relative flex flex-col items-center gap-4 rounded-lg p-6',
                  !submitted && 'bg-picton-blue-100',
                  submitted && checkAnswer(userAnswers[index], question.answer) && 'border-2 border-green-200 bg-green-50',
                  submitted && !checkAnswer(userAnswers[index], question.answer) && 'border-2 border-red-200 bg-red-50',
                )
              "
            >
              <div class="w-full text-center">
                <div v-if="parseOperation(question.question)" class="flex flex-col items-center gap-2 text-lg font-mono">
                  <div class="flex w-full max-w-[200px] items-center justify-end">
                    <span class="mr-2 text-gray-600">shs</span>
                    <span class="w-16 text-right">{{ parseOperation(question.question)?.firstNumber.shs }}</span>
                    <span class="w-12 text-right">{{ parseOperation(question.question)?.firstNumber.cts }}</span>
                    <span class="ml-2 text-gray-600">cts</span>
                  </div>
                  <div class="flex w-full max-w-[200px] items-center justify-end">
                    <span class="mr-1 text-xl font-bold">{{ parseOperation(question.question)?.operator }}</span>
                    <span class="mr-2 text-gray-600">shs</span>
                    <span class="w-16 text-right">{{ parseOperation(question.question)?.secondNumber.shs }}</span>
                    <span class="w-12 text-right">{{ parseOperation(question.question)?.secondNumber.cts }}</span>
                    <span class="ml-2 text-gray-600">cts</span>
                  </div>
                  <div class="w-full max-w-[200px] border-b-2 border-gray-400" />
                </div>
                <div v-else class="text-center text-lg">{{ question.question }}</div>
              </div>

              <div class="flex w-full max-w-[200px] items-center justify-center gap-4 font-mono">
                <div class="flex w-full max-w-[200px] items-center justify-center gap-1">
                  <span class="mr-2 text-gray-600">shs</span>
                  <Input
                    :model-value="userAnswers[index].shs"
                    class="w-16 rounded-none border-x-0 border-b-2 border-t-0 border-dashed border-picton-blue-700 bg-transparent px-1 text-right focus-visible:ring-transparent"
                    :disabled="submitted"
                    @update:model-value="
                      (value) => updateAnswer(index, { ...userAnswers[index], shs: String(value ?? '') })
                    "
                  />
                </div>

                <div class="flex w-full max-w-[200px] items-center justify-center gap-1">
                  <Input
                    :model-value="userAnswers[index].cts"
                    class="w-12 rounded-none border-x-0 border-b-2 border-t-0 border-dashed border-picton-blue-700 bg-transparent px-1 text-right focus-visible:ring-transparent"
                    :disabled="submitted"
                    @update:model-value="
                      (value) => updateAnswer(index, { ...userAnswers[index], cts: String(value ?? '') })
                    "
                  />
                  <span class="ml-2 text-gray-600">cts</span>
                </div>
              </div>

              <div
                v-if="submitted"
                :class="
                  cn(
                    'absolute right-2 top-2 flex items-center justify-center rounded-full p-1',
                    checkAnswer(userAnswers[index], question.answer)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600',
                  )
                "
              >
                {{ checkAnswer(userAnswers[index], question.answer) ? "✓" : "✕" }}
              </div>

              <div
                v-if="
                  submitted &&
                  !checkAnswer(userAnswers[index], question.answer) &&
                  props.feedback === 'wrong-correct-answers'
                "
                class="mt-2 text-center"
              >
                <p class="text-sm text-gray-500">Correct answer:</p>
                <p class="font-medium text-green-600">{{ question.answer }}</p>
              </div>
            </div>
          </div>
        </div>

        <Button v-if="!submitted && allAnswered" class="ml-auto w-fit" @click="handleSubmit">
          Check Answers
        </Button>

        <div v-if="showResults" class="bg-picton-blue-50 p-4">
          <ActivityResults :score="score" :total="props.questions.length" :onRestart="resetActivity" />
        </div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.length"
      :open="submitted && !showResults"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            showResults = true;
          }
        }
      "
    />
  </div>
</template>
