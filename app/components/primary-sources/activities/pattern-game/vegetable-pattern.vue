<script setup lang="ts">
import { computed, ref, watch } from "vue";

type Vegetable = "broccoli" | "pepper" | "onion" | "tomato" | "cucumber" | "cabbage";

const ui = useActivityUiText();
const activityInstructionsId = "vegetable-pattern-instructions";
const activityStatusId = "vegetable-pattern-status";

const patterns: Vegetable[][] = [
  ["broccoli", "pepper", "onion", "broccoli", "pepper", "onion", "broccoli", "pepper", "onion"],
  ["tomato", "tomato", "cucumber", "cucumber", "tomato", "tomato", "cucumber", "cucumber", "tomato"],
  ["cabbage", "cabbage", "cabbage", "pepper", "pepper", "pepper", "cabbage", "cabbage", "cabbage"],
  ["cucumber", "cucumber", "tomato", "tomato", "broccoli", "broccoli", "cucumber", "cucumber", "tomato"],
  ["tomato", "onion", "tomato", "onion", "tomato", "onion", "tomato", "onion", "tomato"],
  ["tomato", "cucumber", "broccoli", "pepper", "tomato", "cucumber", "broccoli", "pepper", "tomato"],
];

const patternAnswers: Vegetable[] = ["broccoli", "tomato", "pepper", "tomato", "onion", "cucumber"];
const draggableVegetables: Vegetable[] = ["tomato", "cucumber", "broccoli", "pepper", "onion", "cabbage"];

const answers = ref<(Vegetable | null)[]>(Array(patterns.length).fill(null));
const score = ref(0);
const allAnswered = ref(false);
const selectedVegetable = ref<Vegetable | null>(null);
const showResults = ref(false);
const keyboardStatusMessage = ref("");

watch(
  answers,
  (nextAnswers) => {
    if (nextAnswers.some((answer) => answer === null)) {
      allAnswered.value = false;
      return;
    }

    score.value = nextAnswers.reduce(
      (total, answer, index) => total + (answer === patternAnswers[index] ? 1 : 0),
      0,
    );
    allAnswered.value = true;
    keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value} / ${patterns.length}.`;
  },
  { deep: true },
);

const availableVegetables = computed(() =>
  draggableVegetables.filter((vegetable) => !answers.value.includes(vegetable)),
);

const getVegetableImage = (vegetable: Vegetable | null) =>
  vegetable ? `/assets/${vegetable}.png` : "";

const placeSelectedVegetable = (rowIndex: number) => {
  if (!selectedVegetable.value) {
    keyboardStatusMessage.value = ui.isSwahili.value
      ? "Chagua mboga kwanza kabla ya kuiweka."
      : "Select a vegetable first before placing it.";
    return;
  }

  answers.value = answers.value.map((answer, index) =>
    index === rowIndex ? selectedVegetable.value : answer,
  );
  keyboardStatusMessage.value = ui.formatActivityPlaced(
    ui.formatQuestion(rowIndex + 1),
    selectedVegetable.value,
  );
  selectedVegetable.value = null;
};

const clearAnswer = (rowIndex: number) => {
  const removedAnswer = answers.value[rowIndex];
  answers.value = answers.value.map((answer, index) => (index === rowIndex ? null : answer));
  keyboardStatusMessage.value = ui.formatActivityRemoved(
    ui.formatQuestion(rowIndex + 1),
    removedAnswer,
  );
};

const resetGame = () => {
  answers.value = Array(patterns.length).fill(null);
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  selectedVegetable.value = null;
  keyboardStatusMessage.value = "";
};
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="vegetable-pattern-title"
    :aria-describedby="activityInstructionsId"
  >
    <h1 id="vegetable-pattern-title" class="mb-4 text-center text-2xl font-bold">
      Fill in the next vegetable in the pattern
    </h1>
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye nafasi zilizo wazi na mboga zilizopo. Chagua mboga kwa enter au space, kisha chagua nafasi ya kuiweka."
          : "Use Tab to move through the empty slots and available vegetables. Select a vegetable with Enter or Space, then choose the slot where you want to place it."
      }}
    </p>
    <p :id="activityStatusId" aria-live="polite" class="sr-only">
      {{ keyboardStatusMessage }}
    </p>

    <div class="flex flex-1 flex-col justify-between gap-6">
      <div class="space-y-4">
        <div
          v-for="(pattern, rowIndex) in patterns"
          :key="rowIndex"
          class="flex flex-col gap-4 rounded-2xl bg-picton-blue-50 p-4 md:flex-row md:items-center"
          :aria-labelledby="`vegetable-pattern-row-${rowIndex}`"
        >
          <h2
            :id="`vegetable-pattern-row-${rowIndex}`"
            class="text-xl font-bold text-picton-blue-800 md:w-10"
          >
            {{ rowIndex + 1 }}.
          </h2>

          <div class="flex flex-1 flex-wrap items-center gap-3">
            <div
              v-for="(vegetable, colIndex) in pattern"
              :key="`${rowIndex}-${colIndex}`"
              class="h-16 w-24 rounded-xl bg-white p-2"
            >
              <img
                :src="getVegetableImage(vegetable)"
                :alt="vegetable"
                class="h-full w-full rounded-lg object-contain"
              >
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
                  ? `Swali la ${rowIndex + 1}, weka mboga iliyochaguliwa`
                  : `Pattern ${rowIndex + 1}, place the selected vegetable`
            "
            :class="
              [
                'relative flex h-16 w-24 items-center justify-center rounded-xl border-2 border-dashed transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
                answers[rowIndex]
                  ? showResults
                    ? answers[rowIndex] === patternAnswers[rowIndex]
                      ? 'border-green-400 bg-green-100'
                      : 'border-red-400 bg-red-100'
                    : 'border-lemon-400 bg-lemon-100'
                  : 'border-picton-blue-400 bg-white hover:bg-picton-blue-50',
                !answers[rowIndex] && !selectedVegetable ? 'opacity-60' : '',
              ]
            "
            @click="answers[rowIndex] ? clearAnswer(rowIndex) : placeSelectedVegetable(rowIndex)"
          >
            <img
              v-if="answers[rowIndex]"
              :src="getVegetableImage(answers[rowIndex])"
              :alt="answers[rowIndex] || ''"
              class="h-full w-full rounded-lg object-contain"
            >
            <span
              v-else
              class="text-xs font-medium text-picton-blue-700"
            >
              {{ ui.isSwahili ? "Weka hapa" : "Place here" }}
            </span>
            <span
              v-if="showResults && answers[rowIndex]"
              :class="[
                'absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-white',
                answers[rowIndex] === patternAnswers[rowIndex] ? 'bg-green-500' : 'bg-red-500',
              ]"
            >
              {{ answers[rowIndex] === patternAnswers[rowIndex] ? "✓" : "✕" }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="!showResults" class="ml-auto w-fit rounded-2xl bg-picton-blue-200 p-3">
        <div
          class="flex flex-wrap gap-3"
          role="group"
          :aria-label="ui.isSwahili ? 'Mboga zinazopatikana' : 'Available vegetables'"
        >
          <button
            v-for="vegetable in availableVegetables"
            :key="vegetable"
            type="button"
            :aria-pressed="selectedVegetable === vegetable"
            :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
            :aria-label="ui.isSwahili ? `Chagua ${vegetable}` : `Choose ${vegetable}`"
            :class="[
              'flex h-16 w-24 items-center justify-center rounded-xl bg-white p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2',
              selectedVegetable === vegetable ? 'ring-2 ring-picton-blue-600' : 'hover:bg-picton-blue-50',
            ]"
            @click="
              () => {
                const isSelected = selectedVegetable === vegetable;
                selectedVegetable = isSelected ? null : vegetable;
                keyboardStatusMessage = isSelected
                  ? ui.formatActivityRemoved(ui.availableAnswerChoices.value, vegetable)
                  : ui.formatActivitySelected(ui.availableAnswerChoices.value, vegetable);
              }
            "
          >
            <img :src="getVegetableImage(vegetable)" :alt="vegetable" class="h-full w-full object-contain">
          </button>
        </div>
      </div>

      <div v-if="showResults" class="mt-6 text-center">
        <p class="text-xl font-bold">{{ ui.isSwahili ? "Mchezo Umeisha" : "Game Over" }}</p>
        <p>
          {{
            ui.isSwahili
              ? `Umefanya ${score} kati ya ${patterns.length}.`
              : `You scored ${score} out of ${patterns.length}.`
          }}
        </p>
        <button
          type="button"
          class="mt-4 rounded bg-blue-500 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          @click="resetGame"
        >
          {{ ui.isSwahili ? "Cheza Tena" : "Play Again" }}
        </button>
      </div>
    </div>

    <div v-if="allAnswered && !showResults" class="mt-4 text-center">
      <button
        type="button"
        class="rounded bg-picton-blue-600 px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2"
        @click="showResults = true"
      >
        {{ ui.isSwahili ? "Ona Matokeo" : "Show Results" }}
      </button>
    </div>
  </section>
</template>
