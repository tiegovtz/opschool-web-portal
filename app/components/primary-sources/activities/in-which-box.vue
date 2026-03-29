<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import type { FeedbackType } from "@/lib/types/activity-types";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type Option = {
  id: string;
  content: string | { imageSrc: string; title: string };
  answer: string;
};

type Question = {
  id: string;
  category: "text" | "image" | "text-image";
  title: string;
  firstOption: {
    id: string;
    title: string;
    noOfAnswers: number;
  };
  thirdOption?: {
    id: string;
    title: string;
    noOfAnswers: number;
  };
  secondOption: {
    id: string;
    title: string;
    noOfAnswers: number;
  };
  questions: Option[];
};

type OptionWithIndex = Option & {
  index: number;
};

type BoxKey = "first" | "second" | "third";

type Props = {
  questions: Question;
  feedback?: FeedbackType;
};

const props = withDefaults(defineProps<Props>(), {
  feedback: "wrong-correct",
});

const { playSound } = useSoundEffects();

const selectedOptionId = ref<string | null>(null);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const remainingOptions = ref<OptionWithIndex[]>([]);
const answers = ref<{
  first: (OptionWithIndex | null)[];
  second: (OptionWithIndex | null)[];
  third: (OptionWithIndex | null)[];
}>({
  first: [],
  second: [],
  third: [],
});

const currentQuestion = computed(() => props.questions);

const initializeAnswers = () => {
  answers.value = {
    first: Array.from({ length: currentQuestion.value.firstOption.noOfAnswers }, () => null),
    second: Array.from({ length: currentQuestion.value.secondOption.noOfAnswers }, () => null),
    third: Array.from(
      { length: currentQuestion.value.thirdOption?.noOfAnswers || 0 },
      () => null,
    ),
  };
  remainingOptions.value = shuffle(
    currentQuestion.value.questions.map((question, index) => ({
      ...question,
      index,
    })),
  );
  selectedOptionId.value = null;
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
};

watch(() => props.questions, initializeAnswers, { deep: true, immediate: true });

const selectedOption = computed(
  () => remainingOptions.value.find((option) => option.id === selectedOptionId.value) || null,
);

const totalPlaced = computed(
  () =>
    answers.value.first.filter(Boolean).length +
    answers.value.second.filter(Boolean).length +
    answers.value.third.filter(Boolean).length,
);

watch(totalPlaced, (placedCount) => {
  if (!currentQuestion.value.questions.length || placedCount !== currentQuestion.value.questions.length) {
    return;
  }

  const nextScore = [
    ...answers.value.first,
    ...answers.value.second,
    ...answers.value.third,
  ].reduce((total, answer) => {
    if (!answer) return total;
    return total + (answer.answer === answerPlacement(answer.id) ? 1 : 0);
  }, 0);

  score.value = nextScore;
  allAnswered.value = true;
  playSound("success");
}, { deep: true });

const optionPlacement = (boxKey: BoxKey) => {
  if (boxKey === "first") return currentQuestion.value.firstOption.id;
  if (boxKey === "second") return currentQuestion.value.secondOption.id;
  return currentQuestion.value.thirdOption?.id || "";
};

const answerPlacement = (optionId: string) => {
  if (answers.value.first.some((answer) => answer?.id === optionId)) return currentQuestion.value.firstOption.id;
  if (answers.value.second.some((answer) => answer?.id === optionId)) return currentQuestion.value.secondOption.id;
  if (answers.value.third.some((answer) => answer?.id === optionId)) return currentQuestion.value.thirdOption?.id || "";
  return "";
};

const placeSelectedOption = (boxKey: BoxKey, slotIndex: number) => {
  if (!selectedOption.value || showResults.value || answers.value[boxKey][slotIndex]) return;

  answers.value = {
    ...answers.value,
    [boxKey]: answers.value[boxKey].map((item, index) =>
      index === slotIndex ? selectedOption.value : item,
    ),
  };
  remainingOptions.value = remainingOptions.value.filter((option) => option.id !== selectedOption.value?.id);
  selectedOptionId.value = null;
  playSound("click");
};

const returnOption = (boxKey: BoxKey, slotIndex: number) => {
  if (showResults.value) return;

  const answer = answers.value[boxKey][slotIndex];
  if (!answer) return;

  answers.value = {
    ...answers.value,
    [boxKey]: answers.value[boxKey].map((item, index) => (index === slotIndex ? null : item)),
  };
  remainingOptions.value = shuffle([...remainingOptions.value, answer]);
  playSound("click");
};

const correctBoxTitle = (answer?: OptionWithIndex | null) => {
  if (!answer) return "";
  if (answer.answer === currentQuestion.value.firstOption.id) return currentQuestion.value.firstOption.title;
  if (answer.answer === currentQuestion.value.secondOption.id) return currentQuestion.value.secondOption.title;
  return currentQuestion.value.thirdOption?.title || "";
};

const isCorrectInBox = (answer: OptionWithIndex | null, boxKey: BoxKey) =>
  !!answer && answer.answer === optionPlacement(boxKey);

const resetActivity = () => {
  initializeAnswers();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="currentQuestion.title" />

    <div v-if="!showResults" class="mb-4 overflow-x-auto">
      <div class="grid min-w-fit gap-2 md:grid-cols-4">
        <button
          v-for="option in remainingOptions"
          :key="option.id"
          :class="
            cn(
              'flex h-32 flex-col items-center justify-center rounded-xl bg-picton-blue-200 p-3 text-center transition',
              selectedOptionId === option.id ? 'ring-2 ring-picton-blue-600' : 'hover:bg-picton-blue-300',
            )
          "
          @click="selectedOptionId = selectedOptionId === option.id ? null : option.id"
        >
          <span v-if="typeof option.content === 'string'" class="text-lg">{{ option.content }}</span>
          <div v-else class="flex flex-col items-center justify-center gap-2">
            <img :src="option.content.imageSrc" :alt="option.id" class="h-20 w-32 object-contain">
            <p v-if="option.content.title" class="text-sm">{{ option.content.title }}</p>
          </div>
        </button>
      </div>
    </div>

    <div
      class="grid flex-1 gap-4"
      :class="currentQuestion.thirdOption ? 'md:grid-cols-3' : 'md:grid-cols-2'"
    >
      <div class="rounded-2xl bg-picton-blue-50 p-3">
        <h3 class="my-3 text-center text-xl font-semibold text-picton-blue-800">
          {{ currentQuestion.firstOption.title }}
        </h3>
        <div class="grid gap-2 md:grid-cols-2">
          <button
            v-for="(answer, index) in answers.first"
            :key="`first-${index}`"
            :class="
              cn(
                'relative flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition',
                answer
                  ? showResults && props.feedback !== 'none'
                    ? isCorrectInBox(answer, 'first')
                      ? 'border-green-400 bg-green-100 text-green-700'
                      : 'border-red-400 bg-red-100 text-red-700'
                    : 'border-lemon-300 bg-lemon-100 text-lemon-800'
                  : 'border-picton-blue-300 bg-picton-blue-100 hover:bg-picton-blue-200',
              )
            "
            @click="answer ? returnOption('first', index) : placeSelectedOption('first', index)"
          >
            <template v-if="answer">
              <span v-if="typeof answer.content === 'string'" class="text-lg">{{ answer.content }}</span>
              <div v-else class="flex flex-col items-center justify-center gap-2">
                <img :src="answer.content.imageSrc" :alt="answer.id" class="h-20 w-32 object-contain">
                <p v-if="answer.content.title" class="text-sm">{{ answer.content.title }}</p>
              </div>
              <span
                v-if="showResults && props.feedback === 'wrong-correct-answers' && !isCorrectInBox(answer, 'first')"
                class="absolute bottom-2 rounded bg-white/80 px-2 py-1 text-xs text-green-700"
              >
                Correct: {{ correctBoxTitle(answer) }}
              </span>
            </template>
          </button>
        </div>
      </div>

      <div class="rounded-2xl bg-picton-blue-50 p-3">
        <h3 class="my-3 text-center text-xl font-semibold text-picton-blue-800">
          {{ currentQuestion.secondOption.title }}
        </h3>
        <div class="grid gap-2 md:grid-cols-2">
          <button
            v-for="(answer, index) in answers.second"
            :key="`second-${index}`"
            :class="
              cn(
                'relative flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition',
                answer
                  ? showResults && props.feedback !== 'none'
                    ? isCorrectInBox(answer, 'second')
                      ? 'border-green-400 bg-green-100 text-green-700'
                      : 'border-red-400 bg-red-100 text-red-700'
                    : 'border-lemon-300 bg-lemon-100 text-lemon-800'
                  : 'border-picton-blue-300 bg-picton-blue-100 hover:bg-picton-blue-200',
              )
            "
            @click="answer ? returnOption('second', index) : placeSelectedOption('second', index)"
          >
            <template v-if="answer">
              <span v-if="typeof answer.content === 'string'" class="text-lg">{{ answer.content }}</span>
              <div v-else class="flex flex-col items-center justify-center gap-2">
                <img :src="answer.content.imageSrc" :alt="answer.id" class="h-20 w-32 object-contain">
                <p v-if="answer.content.title" class="text-sm">{{ answer.content.title }}</p>
              </div>
              <span
                v-if="showResults && props.feedback === 'wrong-correct-answers' && !isCorrectInBox(answer, 'second')"
                class="absolute bottom-2 rounded bg-white/80 px-2 py-1 text-xs text-green-700"
              >
                Correct: {{ correctBoxTitle(answer) }}
              </span>
            </template>
          </button>
        </div>
      </div>

      <div v-if="currentQuestion.thirdOption" class="rounded-2xl bg-picton-blue-50 p-3">
        <h3 class="my-3 text-center text-xl font-semibold text-picton-blue-800">
          {{ currentQuestion.thirdOption.title }}
        </h3>
        <div class="grid gap-2 md:grid-cols-2">
          <button
            v-for="(answer, index) in answers.third"
            :key="`third-${index}`"
            :class="
              cn(
                'relative flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition',
                answer
                  ? showResults && props.feedback !== 'none'
                    ? isCorrectInBox(answer, 'third')
                      ? 'border-green-400 bg-green-100 text-green-700'
                      : 'border-red-400 bg-red-100 text-red-700'
                    : 'border-lemon-300 bg-lemon-100 text-lemon-800'
                  : 'border-picton-blue-300 bg-picton-blue-100 hover:bg-picton-blue-200',
              )
            "
            @click="answer ? returnOption('third', index) : placeSelectedOption('third', index)"
          >
            <template v-if="answer">
              <span v-if="typeof answer.content === 'string'" class="text-lg">{{ answer.content }}</span>
              <div v-else class="flex flex-col items-center justify-center gap-2">
                <img :src="answer.content.imageSrc" :alt="answer.id" class="h-20 w-32 object-contain">
                <p v-if="answer.content.title" class="text-sm">{{ answer.content.title }}</p>
              </div>
              <span
                v-if="showResults && props.feedback === 'wrong-correct-answers' && !isCorrectInBox(answer, 'third')"
                class="absolute bottom-2 rounded bg-white/80 px-2 py-1 text-xs text-green-700"
              >
                Correct: {{ correctBoxTitle(answer) }}
              </span>
            </template>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showResults" class="mt-4 px-4">
      <ActivityResults :score="score" :total="currentQuestion.questions.length" :on-restart="resetActivity" />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="currentQuestion.questions.length"
      :open="allAnswered"
      :on-open-change="
        (open) => {
          if (open) {
            return;
          }
          allAnswered = false;
          if (props.feedback === 'none') {
            resetActivity();
          } else {
            showResults = true;
          }
        }
      "
    />
  </div>
</template>
