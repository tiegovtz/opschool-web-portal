<script setup lang="ts">
// @ts-nocheck
import { computed, ref } from "vue";
import { cn } from "@/lib/utils";
import Input from "@/components/ui/inputs/input.vue";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    instructions?: string[];
    options?: string[];
    questions: {
      textOne: string;
      textTwo: string;
      image?: string;
    }[];
  };
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const { playSound } = useSoundEffects();
const contentLayoutLanguage = useContentLayoutLanguage();
const completionMessage = computed(() =>
  score.value === props.questions.questions.length
    ? contentLayoutLanguage.value === "kiswahili"
      ? "Hongera! Umefanikiwa kukamilisha maneno yote kwa kujaza herufi zilizokosekana!"
      : "Fantastic! You've successfully completed all the words by filling in the missing letters!"
    : contentLayoutLanguage.value === "kiswahili"
      ? `Kazi nzuri! Umepata ${score.value} kati ya ${props.questions.questions.length} kwa usahihi. Endelea kufanya mazoezi ili uboreshe zaidi!`
      : `Good work! You completed ${score.value} out of ${props.questions.questions.length} words correctly. Keep practicing to improve!`,
);

const showResults = ref(false);
const userAnswers = ref<Record<number, Record<number, string>>>({});
const checkedItems = ref<number[]>([]);
const feedbacks = ref<Record<number, boolean>>({});
const allAnswered = ref(false);
const score = ref(0);

const blankGroups = (text: string) => text.match(/_+/g) || [];
const splitQuestionParts = (text: string) =>
  text.split(/(_+)/).filter((part) => part.length > 0);
const isBlankPart = (part: string) => /^_+$/.test(part);

const allQuestionsAnswered = computed(() =>
  props.questions.questions.every((question, questionIndex) => {
    const blankCount = blankGroups(question.textOne).length;
    const answers = userAnswers.value[questionIndex] || {};

    for (let index = 0; index < blankCount; index += 1) {
      if (!answers[index] || answers[index].trim() === "") {
        return false;
      }
    }

    return true;
  }),
);

const handleInputChange = (questionIndex: number, blankIndex: number, value: string) => {
  const nextValue = value.trim().toLowerCase();
  userAnswers.value = {
    ...userAnswers.value,
    [questionIndex]: {
      ...userAnswers.value[questionIndex],
      [blankIndex]: nextValue,
    },
  };
};

const checkWordAnswer = (questionIndex: number) => {
  const wordWithBlanks = props.questions.questions[questionIndex].textOne.toLowerCase();
  const correctWord = props.questions.questions[questionIndex].textTwo.toLowerCase();
  const answers = userAnswers.value[questionIndex] || {};
  let blankIndex = 0;
  const reconstructed = splitQuestionParts(wordWithBlanks)
    .map((part) => {
      if (!isBlankPart(part)) {
        return part;
      }

      const answer = answers[blankIndex] || "_".repeat(part.length);
      blankIndex += 1;
      return answer;
    })
    .join("");

  return reconstructed === correctWord;
};

const handleCheckAllAnswers = () => {
  let nextScore = 0;
  const nextFeedbacks: Record<number, boolean> = {};
  const nextCheckedItems: number[] = [];

  props.questions.questions.forEach((_, questionIndex) => {
    const correct = checkWordAnswer(questionIndex);
    nextFeedbacks[questionIndex] = correct;
    nextCheckedItems.push(questionIndex);
    if (correct) {
      nextScore += 1;
    }
  });

  score.value = nextScore;
  feedbacks.value = nextFeedbacks;
  checkedItems.value = nextCheckedItems;
  allAnswered.value = true;
  playSound(nextScore === props.questions.questions.length ? "success" : "failure");
};

const handleReset = () => {
  userAnswers.value = {};
  checkedItems.value = [];
  feedbacks.value = {};
  allAnswered.value = false;
  score.value = 0;
  showResults.value = false;
};

const blankPartIndex = (parts: string[], partIndex: number) =>
  parts.slice(0, partIndex).filter((part) => isBlankPart(part)).length;
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div
      v-if="props.questions.instructions?.length"
      class="mb-3 space-y-2 rounded-lg bg-white/80 p-4 shadow-sm"
    >
      <p
        v-for="(instruction, instructionIndex) in props.questions.instructions"
        :key="`${instruction}-${instructionIndex}`"
        class="whitespace-pre-line text-base text-slate-700"
      >
        {{ instruction }}
      </p>
    </div>

    <div
      v-if="props.questions.options?.length"
      class="mb-3 rounded-xl border border-picton-blue-200 bg-white/90 p-4 shadow-sm"
    >
      <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-picton-blue-700">
        Chaguo za kutumia
      </p>
      <div class="flex flex-wrap gap-3">
        <span
          v-for="(option, optionIndex) in props.questions.options"
          :key="`${option}-${optionIndex}`"
          class="rounded-xl border border-picton-blue-200 bg-picton-blue-50 px-4 py-2 text-lg font-semibold text-picton-blue-900 shadow-sm"
        >
          {{ option }}
        </span>
      </div>
    </div>

    <div class="flex h-full flex-col gap-2 bg-picton-blue-100">
      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <div
          v-for="(question, questionIndex) in props.questions.questions"
          :key="`question-${questionIndex}`"
          class="rounded-xl bg-picton-blue-50 p-4 shadow-sm"
        >
          <div class="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex min-w-0 items-start gap-4">
              <span class="font-medium text-gray-600">{{ questionIndex + 1 }}.</span>

              <div
                :class="
                  cn('min-w-0 rounded-xl p-4', {
                    'bg-green-100': checkedItems.includes(questionIndex) && feedbacks[questionIndex],
                    'bg-red-100': checkedItems.includes(questionIndex) && feedbacks[questionIndex] === false,
                  })
                "
              >
                <div class="flex flex-wrap items-center gap-2">
                  <template
                    v-for="(part, partIndex) in splitQuestionParts(question.textOne)"
                    :key="`${questionIndex}-${partIndex}`"
                  >
                    <Input
                      v-if="isBlankPart(part)"
                      :model-value="userAnswers[questionIndex]?.[blankPartIndex(splitQuestionParts(question.textOne), partIndex)] || ''"
                      type="text"
                      :maxlength="Math.max(part.length + 2, 6)"
                      :placeholder="part.length > 1 ? 'silabi' : ''"
                      :disabled="allAnswered || checkedItems.includes(questionIndex)"
                      :style="{ width: `${Math.max((userAnswers[questionIndex]?.[blankPartIndex(splitQuestionParts(question.textOne), partIndex)] || '').length, part.length, 2) * 1.3 + 1.8}rem` }"
                      :class="
                        cn(
                          'h-14 min-w-[4.5rem] border-2 border-dashed border-picton-blue-400 bg-white !p-0 text-center text-2xl font-semibold',
                          {
                            'border-green-400 bg-green-50 text-green-700':
                              checkedItems.includes(questionIndex) && feedbacks[questionIndex],
                            'border-red-400 bg-red-50 text-red-700':
                              checkedItems.includes(questionIndex) && feedbacks[questionIndex] === false,
                            'focus:border-picton-blue-600 focus:outline-none':
                              !checkedItems.includes(questionIndex) && !allAnswered,
                            'cursor-not-allowed': allAnswered,
                          },
                        )
                      "
                      @update:model-value="
                        (value) =>
                          handleInputChange(
                            questionIndex,
                            blankPartIndex(splitQuestionParts(question.textOne), partIndex),
                            String(value ?? ''),
                          )
                      "
                    />

                    <span
                      v-else
                      :class="
                        cn(
                          'flex min-h-14 min-w-[3.5rem] items-center justify-center rounded-lg bg-picton-blue-200 px-3 text-2xl font-semibold',
                          {
                            'text-green-700':
                              checkedItems.includes(questionIndex) && feedbacks[questionIndex],
                            'text-red-700':
                              checkedItems.includes(questionIndex) && feedbacks[questionIndex] === false,
                          },
                        )
                      "
                    >
                      {{ part }}
                    </span>
                  </template>
                </div>

                <p
                  v-if="checkedItems.includes(questionIndex)"
                  class="mt-3 text-sm font-medium"
                  :class="feedbacks[questionIndex] ? 'text-green-700' : 'text-slate-700'"
                >
                  Jibu: <span class="font-bold">{{ question.textTwo }}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div
                v-if="checkedItems.includes(questionIndex)"
                :class="
                  cn(
                    'flex items-center justify-center rounded-full p-1',
                    feedbacks[questionIndex] ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
                  )
                "
              >
                {{ feedbacks[questionIndex] ? "✓" : "✕" }}
              </div>

              <div v-if="question.image" class="relative h-32">
                <img :src="question.image" alt="Word image" class="h-full w-full object-contain">
              </div>
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="brand-lemon"
        size="lg"
        class="ml-auto w-fit"
        :disabled="!allQuestionsAnswered || allAnswered"
        @click="handleCheckAllAnswers"
      >
        {{ allAnswered ? ui.answersChecked : ui.checkAllAnswers }}
      </Button>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.questions.length"
      :open="allAnswered && !showResults"
      :onOpenChange="
        (open: boolean) => {
          if (!open) {
            showResults = true;
          }
        }
      "
      :completionMessage="completionMessage"
    />
  </div>
</template>
