<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn, getImageUrl } from "@/lib/utils";
import ActivityResults from "@/components/templates/results";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "~/composables/use-sound-effects";
import type { ActivityComponentProps } from "@/lib/types/activity-types";
import { ActivityResultsAlertDialog } from "@/components/templates/results";

type PatternMatchingActivityProps = ActivityComponentProps & {
  questions: {
    title: string;
    patterns: string[][];
    patternAnswers: string[];
    imageMap: { [key: string]: string };
    draggableItems: string[];
  };
};

const props = defineProps<PatternMatchingActivityProps>();
const { playSound } = useSoundEffects();

const answers = ref<(string | null)[]>([]);
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const selectedItem = ref<string | null>(null);

const initializeActivity = () => {
  answers.value = Array(props.questions.patterns.length).fill(null);
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  selectedItem.value = null;
};

watch(() => props.questions, initializeActivity, { deep: true, immediate: true });

const availableItems = computed(() =>
  props.questions.draggableItems.filter((item) => !answers.value.includes(item)),
);

watch(answers, (nextAnswers) => {
  if (!nextAnswers.length || nextAnswers.some((answer) => answer === null)) {
    return;
  }

  const finalScore = nextAnswers.reduce(
    (total, answer, index) => total + (answer === props.questions.patternAnswers[index] ? 1 : 0),
    0,
  );

  score.value = finalScore;
  allAnswered.value = true;
  playSound("success");
  props.onActivityComplete?.(finalScore, props.questions.patterns.length, nextAnswers);
}, { deep: true });

const getItemImage = (item: string) => {
  const imagePath = props.questions.imageMap[item];
  return imagePath ? getImageUrl(imagePath) : "";
};

const placeSelectedItem = (rowIndex: number) => {
  if (!selectedItem.value) return;

  const nextAnswers = [...answers.value];
  nextAnswers[rowIndex] = selectedItem.value;
  answers.value = nextAnswers;

  const isCorrect = selectedItem.value === props.questions.patternAnswers[rowIndex];
  props.onAnswerRecorded?.(rowIndex, selectedItem.value, isCorrect);
  playSound("click");
  selectedItem.value = null;
};

const clearAnswer = (rowIndex: number) => {
  const nextAnswers = [...answers.value];
  nextAnswers[rowIndex] = null;
  answers.value = nextAnswers;
  playSound("click");
};

const resetActivity = () => {
  initializeActivity();
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex flex-1 flex-col justify-between gap-6">
      <div class="space-y-4">
        <div
          v-for="(pattern, rowIndex) in props.questions.patterns"
          :key="rowIndex"
          class="flex flex-col gap-4 rounded-2xl bg-picton-blue-50 p-4 md:flex-row md:items-center"
        >
          <div class="text-xl font-bold text-picton-blue-800 md:w-10">
            {{ rowIndex + 1 }}.
          </div>

          <div class="flex flex-1 flex-wrap items-center gap-3">
            <div
              v-for="(item, colIndex) in pattern"
              :key="`${rowIndex}-${colIndex}`"
              class="h-16 w-24 rounded-xl bg-white p-2"
            >
              <img :src="getItemImage(item)" :alt="item" class="h-full w-full rounded-lg object-contain">
            </div>
          </div>

          <button
            :class="
              cn(
                'relative flex h-16 w-24 items-center justify-center rounded-xl border-2 border-dashed transition',
                answers[rowIndex]
                  ? showResults
                    ? answers[rowIndex] === props.questions.patternAnswers[rowIndex]
                      ? 'border-green-400 bg-green-100'
                      : 'border-red-400 bg-red-100'
                    : 'border-lemon-400 bg-lemon-100'
                  : 'border-picton-blue-400 bg-white hover:bg-picton-blue-50',
              )
            "
            @click="answers[rowIndex] ? clearAnswer(rowIndex) : placeSelectedItem(rowIndex)"
          >
            <img
              v-if="answers[rowIndex]"
              :src="getItemImage(answers[rowIndex] || '')"
              :alt="answers[rowIndex] || ''"
              class="h-full w-full rounded-lg object-contain"
            >
            <span
              v-if="showResults && answers[rowIndex]"
              :class="
                cn(
                  'absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white',
                  answers[rowIndex] === props.questions.patternAnswers[rowIndex] ? 'bg-green-500' : 'bg-red-500',
                )
              "
            >
              {{ answers[rowIndex] === props.questions.patternAnswers[rowIndex] ? "✓" : "✕" }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="!showResults" class="ml-auto w-fit rounded-2xl bg-picton-blue-200 p-3">
        <div class="flex flex-wrap gap-3">
          <button
            v-for="item in availableItems"
            :key="item"
            :class="
              cn(
                'flex h-16 w-24 items-center justify-center rounded-xl bg-white p-2 transition',
                selectedItem === item ? 'ring-2 ring-picton-blue-600' : 'hover:bg-picton-blue-50',
              )
            "
            @click="selectedItem = selectedItem === item ? null : item"
          >
            <img :src="getItemImage(item)" :alt="item" class="h-full w-full object-contain">
          </button>
        </div>
      </div>

      <ActivityResults
        v-if="showResults"
        :score="score"
        :total="props.questions.patterns.length"
        :on-restart="resetActivity"
      />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="props.questions.patterns.length"
      :open="allAnswered && !showResults"
      :on-open-change="
        (open) => {
          if (open) {
            return;
          }
          showResults = true;
        }
      "
    />
  </div>
</template>
