<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";
import ActivityTitle from "@/components/templates/activity-title";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { Button } from "@/components/ui/button";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type QuestionOption = {
  id: "A" | "B" | "C" | "D";
  text: string;
  correct: boolean;
};

type MultipleChoiceQuestion = {
  question: string;
  image?: string;
  options: QuestionOption[];
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    notes: string;
    image?: string;
    questions: MultipleChoiceQuestion[];
  };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const activeQuestion = ref(0);
const currentAnswer = ref("");
const attemptedQuestions = ref<Record<number, { answer: string; isCorrect: boolean; text: string }>>({});
const showResults = ref(false);
const shuffledQuestions = ref<MultipleChoiceQuestion[]>([]);
const allAnswers = ref<Record<number, string>>({});
const answersChecked = ref(false);

const hasNotes = computed(() => !!props.questions.notes?.trim());

const initialize = () => {
  shuffledQuestions.value = shuffle(props.questions.questions);
  score.value = 0;
  allAnswered.value = false;
  activeQuestion.value = 0;
  currentAnswer.value = "";
  attemptedQuestions.value = {};
  showResults.value = false;
  allAnswers.value = {};
  answersChecked.value = false;
};

watch(() => props.questions, initialize, { deep: true, immediate: true });

const allQuestionsAnswered = computed(
  () =>
    Object.keys(allAnswers.value).length === shuffledQuestions.value.length &&
    Object.values(allAnswers.value).every((answer) => answer !== ""),
);

const checkAnswer = (answer: string) => {
  const question = shuffledQuestions.value[activeQuestion.value];
  const correctOption = question.options.find((option) => option.correct);
  const isCorrect = answer.toLowerCase() === correctOption?.id.toLowerCase();

  attemptedQuestions.value = {
    ...attemptedQuestions.value,
    [activeQuestion.value]: {
      answer,
      isCorrect,
      text: question.options.find((option) => option.id === answer.toUpperCase())?.text || "",
    },
  };

  playSound(isCorrect ? "correct" : "failure");

  if (activeQuestion.value < shuffledQuestions.value.length - 1) {
    window.setTimeout(() => {
      activeQuestion.value += 1;
      currentAnswer.value = "";
    }, 500);
    return;
  }

  const nextAttempts = {
    ...attemptedQuestions.value,
    [activeQuestion.value]: {
      answer,
      isCorrect,
      text: question.options.find((option) => option.id === answer.toUpperCase())?.text || "",
    },
  };

  score.value = Object.values(nextAttempts).reduce(
    (total, item) => total + (item.isCorrect ? 1 : 0),
    0,
  );
  allAnswered.value = true;
};

const handleInputChange = (value: string) => {
  const upperValue = value.toUpperCase();
  if (!["A", "B", "C", "D", "E", ""].includes(upperValue)) {
    return;
  }

  currentAnswer.value = upperValue;
  if (upperValue !== "") {
    checkAnswer(upperValue);
  }
};

const handleAllAtOnceInputChange = (questionIndex: number, value: string) => {
  const upperValue = value.toUpperCase();
  if (!["A", "B", "C", "D", "E", ""].includes(upperValue)) {
    return;
  }

  allAnswers.value = {
    ...allAnswers.value,
    [questionIndex]: upperValue,
  };
};

const checkAllAnswers = () => {
  const nextAttempts: Record<number, { answer: string; isCorrect: boolean; text: string }> = {};

  shuffledQuestions.value.forEach((question, index) => {
    const answer = allAnswers.value[index] || "";
    const correctOption = question.options.find((option) => option.correct);
    const isCorrect = answer.toLowerCase() === correctOption?.id.toLowerCase();

    nextAttempts[index] = {
      answer,
      isCorrect,
      text: question.options.find((option) => option.id === answer.toUpperCase())?.text || "",
    };
  });

  attemptedQuestions.value = nextAttempts;
  answersChecked.value = true;
  score.value = Object.values(nextAttempts).reduce(
    (total, item) => total + (item.isCorrect ? 1 : 0),
    0,
  );

  if (score.value >= shuffledQuestions.value.length / 2) {
    playSound("correct");
  } else {
    playSound("failure");
  }

  allAnswered.value = true;
};

const resetActivity = () => {
  initialize();
};

const resultRows = computed(() =>
  shuffledQuestions.value.map((question, index) => {
    const attempt = attemptedQuestions.value[index];
    const correctOption = question.options.find((option) => option.correct);
    return {
      question,
      attempt,
      correctOption,
      isCorrect: attempt?.isCorrect || false,
    };
  }),
);
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="showResults"
      class="flex flex-1 flex-col items-center justify-between overflow-auto md:p-4"
    >
      <div class="w-full space-y-3">
        <div
          v-for="(row, index) in resultRows"
          :key="index"
          :class="
            cn(
              'flex items-center gap-3 rounded-md border p-3',
              row.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50',
            )
          "
        >
          <div
            :class="
              cn(
                'flex h-8 w-8 items-center justify-center rounded-full',
                row.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
              )
            "
          >
            {{ row.isCorrect ? "✓" : "✕" }}
          </div>

          <div class="flex-1">
            <p class="font-medium">Question {{ index + 1 }}</p>
            <div class="mt-1 flex flex-col gap-1 text-sm">
              <p>{{ row.question.question }}</p>
              <span v-if="props.feedback === 'wrong-correct-answers'">
                Correct Answer:
                <strong>{{ row.correctOption?.id }}. {{ row.correctOption?.text }}</strong>
              </span>
              <span
                v-if="row.attempt"
                :class="row.isCorrect ? 'text-green-600' : 'text-red-600'"
              >
                {{ row.attempt.answer }}. {{ row.attempt.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 w-full">
        <ActivityResults
          :score="score"
          :total="shuffledQuestions.length"
          :onRestart="resetActivity"
        />
      </div>
    </div>

    <div v-else-if="hasNotes" class="flex h-full flex-col gap-4">
      <div class="flex h-[calc(100dvh-200px)] flex-col justify-between gap-4 md:flex-row">
        <LeftNotesWithImages :notes="props.questions.notes" :image="props.questions.image" />

        <div class="flex h-full w-full flex-col justify-between rounded-xl bg-white p-4 md:p-6">
          <div
            :class="
              cn('flex h-full flex-col gap-4 overflow-auto', {
                'md:max-h-[300px]': props.questions.image,
              })
            "
          >
            <p class="text-lg text-picton-blue-700">
              {{ activeQuestion + 1 }}. {{ shuffledQuestions[activeQuestion]?.question }}
            </p>

            <div class="mt-4 flex items-center justify-between">
              <div class="flex flex-col gap-2">
                <div
                  v-for="(option, optionIndex) in shuffledQuestions[activeQuestion]?.options || []"
                  :key="optionIndex"
                  class="flex items-start gap-2 text-lg font-thin text-picton-blue-700"
                  style="font-family: var(--font-shaky-hand-some-comic);"
                >
                  <p>{{ option.id }})</p>
                  <p>{{ option.text }}</p>
                </div>
              </div>

              <Input
                :model-value="currentAnswer"
                type="text"
                maxlength="1"
                :class="
                  cn('h-12 w-12 rounded bg-picton-blue-200 text-center text-2xl', {
                    'bg-lemon-200 text-lemon-700': currentAnswer,
                  })
                "
                @update:model-value="(value) => handleInputChange(String(value ?? ''))"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex h-full items-center justify-between">
        <div class="flex flex-wrap justify-center gap-4">
          <div
            v-for="(_, index) in shuffledQuestions"
            :key="index"
            :class="
              cn('flex h-10 w-10 items-center justify-center rounded-lg', {
                'bg-lemon-200': attemptedQuestions[index],
                'bg-picton-blue-200': !attemptedQuestions[index],
                'border-2 border-picton-blue-500': index === activeQuestion && !attemptedQuestions[index],
              })
            "
          >
            <template v-if="attemptedQuestions[index]">
              {{ attemptedQuestions[index].isCorrect ? "✓" : "✕" }}
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex h-full flex-col gap-4 overflow-auto">
      <div class="rounded-xl bg-white p-4 md:p-6">
        <div class="flex flex-col gap-4">
          <div
            v-for="(question, questionIndex) in shuffledQuestions"
            :key="questionIndex"
            :class="
              cn('rounded-lg border-2 p-4 transition-colors', {
                'border-green-300 bg-green-50': answersChecked && attemptedQuestions[questionIndex]?.isCorrect,
                'border-red-300 bg-red-50':
                  answersChecked &&
                  attemptedQuestions[questionIndex] &&
                  !attemptedQuestions[questionIndex].isCorrect,
                'border-picton-blue-200 bg-picton-blue-50': !answersChecked,
              })
            "
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <p class="mb-3 text-lg text-picton-blue-700">
                  {{ questionIndex + 1 }}. {{ question.question }}
                </p>
                <div class="flex flex-col gap-1">
                  <div
                    v-for="(option, optionIndex) in question.options"
                    :key="optionIndex"
                    class="flex items-start gap-2 text-base font-thin text-picton-blue-700"
                    style="font-family: var(--font-shaky-hand-some-comic);"
                  >
                    <p>{{ option.id }})</p>
                    <p>{{ option.text }}</p>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-center gap-2">
                <Input
                  :model-value="allAnswers[questionIndex] || ''"
                  type="text"
                  maxlength="1"
                  :disabled="answersChecked"
                  :class="
                    cn('h-12 w-12 rounded text-center text-2xl', {
                      'bg-green-200 text-green-700':
                        answersChecked && attemptedQuestions[questionIndex]?.isCorrect,
                      'bg-red-200 text-red-700':
                        answersChecked &&
                        attemptedQuestions[questionIndex] &&
                        !attemptedQuestions[questionIndex].isCorrect,
                      'bg-picton-blue-200': !answersChecked && !allAnswers[questionIndex],
                      'bg-lemon-200 text-lemon-700': !answersChecked && allAnswers[questionIndex],
                    })
                  "
                  @update:model-value="
                    (value) => handleAllAtOnceInputChange(questionIndex, String(value ?? ''))
                  "
                />

                <div
                  v-if="answersChecked && attemptedQuestions[questionIndex]"
                  :class="
                    cn('flex h-8 w-8 items-center justify-center rounded-full', {
                      'bg-green-100': attemptedQuestions[questionIndex].isCorrect,
                      'bg-red-100': !attemptedQuestions[questionIndex].isCorrect,
                    })
                  "
                >
                  {{ attemptedQuestions[questionIndex].isCorrect ? "✓" : "✕" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        v-if="!answersChecked"
        class="ml-auto w-fit"
        :disabled="!allQuestionsAnswered"
        @click="checkAllAnswers"
      >
        Check Answers
      </Button>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="shuffledQuestions.length"
      :open="allAnswered"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            if (props.feedback === 'none') {
              resetActivity();
            } else {
              showResults = true;
            }
            allAnswered = false;
          }
        }
      "
    />
  </div>
</template>
