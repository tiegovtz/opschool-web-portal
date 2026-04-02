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
    questions: {
      textOne: string;
      textTwo: string;
      image?: string;
    }[];
  };
};

const props = defineProps<Props>();
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

const allQuestionsAnswered = computed(() =>
  props.questions.questions.every((question, questionIndex) => {
    const blankCount = (question.textOne.match(/_/g) || []).length;
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
  const nextValue = value.slice(-1).toLowerCase();
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

  let reconstructed = "";
  let blankIndex = 0;

  for (let index = 0; index < wordWithBlanks.length; index += 1) {
    if (wordWithBlanks[index] === "_") {
      reconstructed += answers[blankIndex] || "_";
      blankIndex += 1;
    } else {
      reconstructed += wordWithBlanks[index];
    }
  }

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

const blankIndicesBefore = (text: string, charIndex: number) =>
  text.slice(0, charIndex).split("").filter((char) => char === "_").length;
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex h-full flex-col gap-2 bg-picton-blue-100">
      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <div
          v-for="(question, questionIndex) in props.questions.questions"
          :key="`question-${questionIndex}`"
          class="flex items-center justify-between gap-5 rounded-lg bg-picton-blue-50 p-2"
        >
          <div class="flex w-full items-center justify-between">
            <div class="flex items-center gap-4">
              <span class="font-medium text-gray-600">{{ questionIndex + 1 }}.</span>

              <div
                :class="
                  cn('rounded p-4', {
                    'bg-green-100': checkedItems.includes(questionIndex) && feedbacks[questionIndex],
                    'bg-red-100': checkedItems.includes(questionIndex) && feedbacks[questionIndex] === false,
                  })
                "
              >
                <div class="flex items-center gap-1">
                  <template
                    v-for="(char, charIndex) in question.textOne.split('')"
                    :key="`${questionIndex}-${charIndex}`"
                  >
                    <Input
                      v-if="char === '_'"
                      :model-value="
                        userAnswers[questionIndex]?.[blankIndicesBefore(question.textOne, charIndex)] || ''
                      "
                      type="text"
                      maxlength="1"
                      :disabled="allAnswered || checkedItems.includes(questionIndex)"
                      :class="
                        cn(
                          'h-12 w-12 border-2 border-dashed border-picton-blue-400 bg-transparent !p-0 text-center text-3xl font-semibold',
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
                            blankIndicesBefore(question.textOne, charIndex),
                            String(value ?? ''),
                          )
                      "
                    />

                    <span
                      v-else
                      :class="
                        cn(
                          'flex h-12 w-12 items-center justify-center bg-picton-blue-200 text-3xl font-semibold',
                          {
                            'text-green-700':
                              checkedItems.includes(questionIndex) && feedbacks[questionIndex],
                            'text-red-700':
                              checkedItems.includes(questionIndex) && feedbacks[questionIndex] === false,
                          },
                        )
                      "
                    >
                      {{ char }}
                    </span>
                  </template>
                </div>
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
        {{ allAnswered ? "Answers Checked" : "Check All Answers" }}
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
