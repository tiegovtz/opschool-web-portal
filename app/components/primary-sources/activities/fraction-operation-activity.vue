<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type FractionQuestion = {
  id: number;
  question: string;
  answers: string[];
};

type Props = {
  questions: FractionQuestion[];
  feedback?: "wrong-correct" | "wrong-correct-answers" | "none";
  isExamMode?: boolean;
  onActivityComplete?: (
    score: number,
    totalQuestions: number,
    userAnswers: string[],
  ) => void;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct",
});

const userAnswers = ref<string[]>(Array.from({ length: props.questions.length }, () => ""));
const submitted = ref(false);

const parseQuestionParts = (question: string) =>
  question.split(/(\s+)/).map((part, index) => {
    const match = part.match(/\((\d+)\/(\d+)\)/);
    if (!match) {
      return { key: `${index}-${part}`, type: "text" as const, text: part };
    }

    return {
      key: `${index}-${part}`,
      type: "fraction" as const,
      numerator: match[1],
      denominator: match[2],
    };
  });

const normalize = (value: string) => value.replace(/[()\s]/g, "");

const checkAnswer = (userAnswer: string, correctAnswers: string[]) =>
  correctAnswers.some((answer) => {
    const normalizedAnswer = normalize(answer);
    const normalizedUser = normalize(userAnswer);

    if (normalizedAnswer === normalizedUser) {
      return true;
    }

    if (userAnswer.includes("/")) {
      const [num, den] = userAnswer.split("/");
      if (num && den && Number.parseInt(num, 10) === Number.parseInt(den, 10)) {
        return normalizedAnswer === "1";
      }
    }

    if (!userAnswer.includes("/") && answer.includes("/")) {
      const match = answer.match(/\((\d+)\/(\d+)\)/);
      if (match && Number.parseInt(match[1], 10) === Number.parseInt(match[2], 10)) {
        return userAnswer.trim() === "1";
      }
    }

    return false;
  });

const score = computed(() =>
  props.questions.reduce(
    (total, question, index) =>
      total + (checkAnswer(userAnswers.value[index], question.answers) ? 1 : 0),
    0,
  ),
);

const parseInputValue = (value: string) => {
  if (value.includes("/")) {
    const [numerator = "", denominator = ""] = value.split("/");
    return { numerator, denominator };
  }

  return { numerator: value, denominator: "" };
};

const updateAnswerPart = (
  index: number,
  part: "numerator" | "denominator",
  value: string,
) => {
  const current = parseInputValue(userAnswers.value[index]);
  const next = { ...current, [part]: value };

  userAnswers.value[index] =
    next.denominator || part === "denominator"
      ? `${next.numerator}/${next.denominator}`
      : next.numerator;
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
          <div class="grid h-full grid-cols-1 gap-6 xl:grid-cols-3">
            <div
              v-for="(question, index) in props.questions"
              :key="question.id"
              :class="
                cn(
                  'relative flex items-center justify-center gap-4 rounded-lg p-6',
                  !submitted && 'bg-picton-blue-100',
                  submitted && checkAnswer(userAnswers[index], question.answers) && 'border-2 border-green-200 bg-green-50',
                  submitted && !checkAnswer(userAnswers[index], question.answers) && 'border-2 border-red-200 bg-red-50',
                )
              "
            >
              <div class="text-center text-2xl font-medium">
                <div class="flex items-center">
                  <template v-for="part in parseQuestionParts(question.question)" :key="part.key">
                    <span v-if="part.type === 'text'">{{ part.text }}</span>
                    <span v-else class="mx-1 inline-flex flex-col items-center text-3xl">
                      <span class="leading-none">{{ part.numerator }}</span>
                      <span class="w-full border-t border-picton-blue-700" />
                      <span class="leading-none">{{ part.denominator }}</span>
                    </span>
                  </template>
                </div>
              </div>

              <div class="flex w-16 flex-col items-center justify-center rounded-lg border border-gray-400 bg-white">
                <input
                  :value="parseInputValue(userAnswers[index]).numerator"
                  :disabled="submitted"
                  inputmode="numeric"
                  class="h-10 w-full border-none text-center text-2xl font-medium outline-none"
                  @input="updateAnswerPart(index, 'numerator', ($event.target as HTMLInputElement).value)"
                >
                <div class="w-full border-t border-gray-400" />
                <input
                  :value="parseInputValue(userAnswers[index]).denominator"
                  :disabled="submitted"
                  inputmode="numeric"
                  class="h-10 w-full border-none text-center text-2xl font-medium outline-none"
                  @input="updateAnswerPart(index, 'denominator', ($event.target as HTMLInputElement).value)"
                >
              </div>

              <div
                v-if="submitted"
                :class="
                  cn(
                    'absolute right-2 top-2 flex items-center justify-center rounded-full p-1',
                    checkAnswer(userAnswers[index], question.answers)
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600',
                  )
                "
              >
                {{ checkAnswer(userAnswers[index], question.answers) ? "✓" : "✕" }}
              </div>

              <div
                v-if="
                  submitted &&
                  !checkAnswer(userAnswers[index], question.answers) &&
                  props.feedback === 'wrong-correct-answers'
                "
                class="mt-2 text-center"
              >
                <p class="text-sm text-gray-500">Correct answer:</p>
                <p class="font-medium text-green-600">{{ question.answers[0] }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!submitted" class="flex justify-end p-4">
          <Button @click="handleSubmit">Check Answers</Button>
        </div>

        <div v-else-if="props.feedback !== 'none'" class="bg-picton-blue-50 p-4 text-center">
          <div class="text-xl font-bold text-gray-700">Score: {{ score }}/{{ props.questions.length }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
