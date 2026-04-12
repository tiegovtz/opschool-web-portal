<script setup lang="ts">
// @ts-nocheck
import { ref, watch } from "vue";
import { shuffle } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Question = {
  text: string;
  order: number;
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: Question[];
  };
};

const props = defineProps<Props>();

const score = ref(0);
const allAnswered = ref(false);
const showFeedback = ref(false);
const theQuestions = ref<Question[]>([...props.questions.questions]);
const order = ref<string[]>(Array(props.questions.questions.length).fill(""));

const { playSound } = useSoundEffects();

watch(
  order,
  (value) => {
    if (!value.every((item) => item !== "")) return;

    score.value = value.reduce((acc, current, index) => {
      return Number(current) === theQuestions.value[index].order ? acc + 1 : acc;
    }, 0);
    allAnswered.value = true;
    playSound("success");
  },
  { deep: true },
);

const handleChange = (index: number, value: string) => {
  if (value === "") {
    order.value = order.value.map((item, currentIndex) => (currentIndex === index ? "" : item));
    return;
  }

  if (!Number.isNaN(Number(value)) && Number(value) > 0 && Number(value) <= theQuestions.value.length) {
    const nextOrder = [...order.value];
    nextOrder[index] = value;
    order.value = nextOrder;
  }
};

const resetActivity = () => {
  allAnswered.value = false;
  showFeedback.value = false;
  score.value = 0;
  order.value = Array(theQuestions.value.length).fill("");
  theQuestions.value = shuffle([...props.questions.questions]);
};

const isAnswerCorrect = (index: number) => Number(order.value[index]) === theQuestions.value[index].order;

const handleDialogChange = (open: boolean) => {
  if (open) return;

  if (props.feedback === "none") {
    resetActivity();
  } else {
    showFeedback.value = true;
  }

  allAnswered.value = false;
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <ul class="mt-4 flex flex-col justify-between gap-1">
      <li
        v-for="(question, index) in theQuestions"
        :key="`${question.text}-${index}`"
        class="flex items-center gap-4 rounded text-lg"
      >
        <div class="relative">
          <Input
            type="number"
            min="1"
            :value="order[index]"
            :disabled="showFeedback"
            :class="[
              'h-16 w-16 text-center text-2xl no-number-input-arrows text-black rounded border-2 transition-colors duration-300',
              showFeedback
                ? isAnswerCorrect(index)
                  ? 'border-green-500 bg-green-100'
                  : 'border-red-500 bg-red-100 text-red-700'
                : 'bg-picton-blue-200',
            ]"
            @change="(event) => handleChange(index, (event.target as HTMLInputElement).value)"
          />

          <div
            v-if="showFeedback && !isAnswerCorrect(index) && props.feedback === 'wrong-correct-answers'"
            class="absolute right-0 top-0 rounded bg-green-500 px-2 py-1 text-xs text-white"
          >
            {{ question.order }}
          </div>
        </div>

        <span :class="showFeedback && !isAnswerCorrect(index) ? 'text-red-500' : ''">
          {{ question.text }}
        </span>
      </li>
    </ul>

    <ActivityResults
      v-if="showFeedback"
      :score="score"
      :total="theQuestions.length"
      :on-restart="resetActivity"
    />

    <ActivityResultsAlertDialog
      :score="score"
      :total="theQuestions.length"
      :open="allAnswered"
      :on-open-change="handleDialogChange"
    />
  </div>
</template>
