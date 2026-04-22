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
const activityInstructionsId = "pattern-matching-instructions";
const ui = useActivityUiText();
const activityStatusId = "pattern-matching-status";
const keyboardStatusMessage = ref("");

const initializeActivity = () => {
  answers.value = Array(props.questions.patterns.length).fill(null);
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  selectedItem.value = null;
  keyboardStatusMessage.value = "";
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
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${finalScore} / ${props.questions.patterns.length}.`;
  playSound("success");
  props.onActivityComplete?.(finalScore, props.questions.patterns.length, nextAnswers);
}, { deep: true });

const getItemImage = (item: string) => {
  const imagePath = props.questions.imageMap[item];
  return imagePath ? getImageUrl(imagePath) : "";
};

const placeSelectedItem = (rowIndex: number) => {
  if (!selectedItem.value) {
    keyboardStatusMessage.value = ui.isSwahili.value
      ? "Chagua kipengee kwanza kabla ya kukiweka kwenye nafasi."
      : "Select an item first before placing it in a slot.";
    return;
  }

  const nextAnswers = [...answers.value];
  nextAnswers[rowIndex] = selectedItem.value;
  answers.value = nextAnswers;
  keyboardStatusMessage.value = ui.formatActivityPlaced(ui.formatQuestion(rowIndex + 1), selectedItem.value);

  const isCorrect = selectedItem.value === props.questions.patternAnswers[rowIndex];
  props.onAnswerRecorded?.(rowIndex, selectedItem.value, isCorrect);
  playSound("click");
  selectedItem.value = null;
};

const clearAnswer = (rowIndex: number) => {
  const removedItem = answers.value[rowIndex];
  const nextAnswers = [...answers.value];
  nextAnswers[rowIndex] = null;
  answers.value = nextAnswers;
  if (removedItem) {
    keyboardStatusMessage.value = ui.formatActivityRemoved(ui.formatQuestion(rowIndex + 1), removedItem);
  }
  playSound("click");
};

const resetActivity = () => {
  initializeActivity();
};
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="pattern-matching-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="pattern-matching-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye chaguo na nafasi zilizo wazi. Chagua kipengee kwa enter au space, kisha chagua nafasi ya kukiweka."
          : "Use Tab to move through the options and empty slots. Select an item with Enter or Space, then choose the slot where you want to place it."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <div class="flex flex-1 flex-col justify-between gap-6">
      <div class="space-y-4">
        <div
          v-for="(pattern, rowIndex) in props.questions.patterns"
          :key="rowIndex"
          class="flex flex-col gap-4 rounded-2xl bg-picton-blue-50 p-4 md:flex-row md:items-center"
          :aria-labelledby="`pattern-matching-row-${rowIndex}`"
        >
          <h3 :id="`pattern-matching-row-${rowIndex}`" class="text-xl font-bold text-picton-blue-800 md:w-10">
            {{ rowIndex + 1 }}.
          </h3>

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
            type="button"
            :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
            :aria-label="
              answers[rowIndex]
                ? ui.isSwahili
                  ? `Swali la ${rowIndex + 1}, ondoa ${answers[rowIndex]}`
                  : `Pattern ${rowIndex + 1}, remove ${answers[rowIndex]}`
                : ui.isSwahili
                  ? `Swali la ${rowIndex + 1}, weka kipengee kilichochaguliwa`
                  : `Pattern ${rowIndex + 1}, place the selected item`
            "
            :class="
              cn(
                'relative flex h-16 w-24 items-center justify-center rounded-xl border-2 border-dashed transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
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
            <span v-else class="text-xs font-medium text-picton-blue-700">
              {{ ui.isSwahili ? "Weka hapa" : "Place here" }}
            </span>
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
        <div
          class="flex flex-wrap gap-3"
          role="group"
          :aria-label="ui.isSwahili ? 'Chaguo zinazopatikana' : 'Available options'"
        >
          <button
            v-for="item in availableItems"
            :key="item"
            type="button"
            :aria-pressed="selectedItem === item"
            :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
            :aria-label="ui.isSwahili ? `Chagua ${item}` : `Choose ${item}`"
            :class="
              cn(
                'flex h-16 w-24 items-center justify-center rounded-xl bg-white p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
                selectedItem === item ? 'ring-2 ring-picton-blue-600' : 'hover:bg-picton-blue-50',
              )
            "
            @click="() => { const isRemoving = selectedItem === item; selectedItem = isRemoving ? null : item; keyboardStatusMessage = isRemoving ? ui.formatActivityRemoved(ui.availableAnswerChoices.value, item) : ui.formatActivitySelected(ui.availableAnswerChoices.value, item); }"
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
  </section>
</template>
