<script setup lang="ts">
import { Fragment, computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    fontSize?: string;
    paragraph: string;
    image?: string;
    answers: string[];
    options?: string[];
    withClues: boolean;
  };
};

const props = defineProps<Props>();
const answerChecker = new AnswerChecker();
const { playSound } = useSoundEffects();

const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const userAnswers = ref<string[]>([]);
const isCorrectAnswers = ref<boolean[]>([]);

const initialize = () => {
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  userAnswers.value = Array.from({ length: props.questions.answers.length }, () => "");
  isCorrectAnswers.value = Array.from({ length: props.questions.answers.length }, () => false);
};

watch(() => props.questions, initialize, { deep: true, immediate: true });

const allAnswersFilled = computed(() => userAnswers.value.every((answer) => answer.trim() !== ""));
const paragraphParts = computed(() => props.questions.paragraph.split("___"));

const checkAnswers = () => {
  const correctness = userAnswers.value.map((answer, index) =>
    answerChecker.checkAnswer(answer.trim().toLowerCase(), {
      acceptedAnswers: [props.questions.answers[index]?.trim().toLowerCase() ?? ""],
    }).isCorrect,
  );

  score.value = correctness.reduce((total, value) => total + (value ? 1 : 0), 0);
  isCorrectAnswers.value = correctness;
  allAnswered.value = true;
  playSound(score.value === props.questions.answers.length ? "success" : "failure");
};

const resetActivity = () => {
  initialize();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <template v-if="showResults">
      <div
        class="flex h-full w-full flex-col justify-between overflow-auto rounded-xl bg-picton-blue-50 p-4"
        :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '18px' }"
      >
        <div class="p-4 leading-loose">
          <template v-for="(part, index) in paragraphParts" :key="index">
            <span>{{ part }}</span>
            <span v-if="index < paragraphParts.length - 1" class="mx-1">
              <template v-if="props.feedback === 'wrong-correct-answers'">
                <span
                  v-if="userAnswers[index]"
                  :class="
                    cn(
                      'rounded px-2 py-1 font-medium',
                      isCorrectAnswers[index]
                        ? 'bg-green-200 text-green-800'
                        : 'mr-1 bg-red-200 text-red-800 line-through',
                    )
                  "
                >
                  {{ userAnswers[index] }}
                </span>
                <span
                  v-if="!userAnswers[index] || !isCorrectAnswers[index]"
                  class="rounded bg-green-200 px-2 py-1 font-medium text-green-800"
                >
                  {{ props.questions.answers[index] }}
                </span>
              </template>
              <span
                v-else
                :class="
                  cn(
                    'rounded px-2 py-1 font-medium',
                    isCorrectAnswers[index]
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800',
                  )
                "
              >
                {{ userAnswers[index] || "_____" }}
              </span>
            </span>
          </template>
        </div>
      </div>

      <div class="mt-4 w-full">
        <ActivityResults
          :score="score"
          :total="props.questions.answers.length"
          :onRestart="resetActivity"
        />
      </div>
    </template>

    <div
      v-else
      class="flex h-full flex-col gap-4"
      :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : '18px' }"
    >
      <div class="flex h-full flex-col gap-4 md:flex-row">
        <div class="flex h-full w-full flex-col gap-4 overflow-auto rounded-xl bg-picton-blue-50 p-6">
          <div
            v-if="props.questions.withClues"
            class="flex w-fit flex-wrap gap-4 rounded border-2 border-picton-blue-300 bg-picton-blue-100 py-4"
          >
            <p
              v-for="(answer, index) in props.questions.options || []"
              :key="index"
              class="px-3 text-lg leading-4 text-picton-blue-700"
            >
              {{ answer }}
            </p>
          </div>

          <div class="leading-loose">
            <template v-for="(part, index) in paragraphParts" :key="index">
              <span>
                <template v-for="(word, wordIndex) in part.split(' ')" :key="wordIndex">
                  <template v-if="wordIndex > 0"> </template>
                  <span
                    :class="word.startsWith('_') ? 'rounded bg-yellow-100 p-1 text-lemon-700' : ''"
                  >
                    {{ word.startsWith("_") ? word.slice(1) : word }}
                  </span>
                </template>
              </span>
              <span v-if="index < paragraphParts.length - 1" class="mx-2 inline-block align-middle">
                <Input
                  :model-value="userAnswers[index]"
                  type="text"
                  class="max-w-40 rounded-none border-none bg-transparent text-center !text-lg text-picton-blue-700"
                  :disabled="showResults"
                  @update:model-value="
                    (value) => {
                      const nextAnswers = [...userAnswers];
                      nextAnswers[index] = String(value ?? '');
                      userAnswers = nextAnswers;
                    }
                  "
                />
                <div class="border-b border-dashed border-picton-blue-700" />
              </span>
            </template>
          </div>
        </div>

        <div
          v-if="props.questions.image"
          class="flex items-center justify-center rounded-xl bg-white p-4 md:w-1/2"
        >
          <img
            :src="props.questions.image"
            alt="complete paragraph with clues"
            class="max-h-[600px] w-full object-contain"
          >
        </div>
      </div>

      <div class="flex justify-end">
        <Button :disabled="!allAnswersFilled" @click="checkAnswers">Check Answers</Button>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.answers.length"
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
