<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";

type SequenceItem = {
  sequence: string[];
  answers: string[];
};

type Props = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    numberRange: string;
    sequences: SequenceItem[];
  };
};

const props = defineProps<Props>();

const { playSound } = useSoundEffects();
const contentLayoutLanguage = useContentLayoutLanguage();
const completionMessage = computed(() =>
  contentLayoutLanguage.value === "kiswahili"
    ? `Umefanikiwa kukamilisha mipangilio yote ${props.questions.sequences.length} ya namba!`
    : `You've completed all ${props.questions.sequences.length} number sequences!`,
);

const currentSequenceIndex = ref(0);
const placedNumbers = ref<string[]>([]);
const isCorrect = ref(false);
const isIncorrect = ref(false);
const showDialog = ref(false);
const isTransitioning = ref(false);
const targetPositions = ref<number[]>([]);
const sequenceResults = ref<boolean[]>([]);
const showResults = ref(false);
const score = ref(0);
const activityInstructionsId = "missing-values-junior-instructions";
const activityStatusId = "missing-values-junior-status";
const keyboardStatusMessage = ref("");

const currentSequenceData = computed(
  () => props.questions.sequences[currentSequenceIndex.value] || { sequence: [], answers: [] },
);
const currentSequence = computed(() => currentSequenceData.value.sequence);
const correctAnswers = computed(() => currentSequenceData.value.answers);

const numberPad = computed(() => {
  const [min, max] = props.questions.numberRange.split("/").map(Number);
  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
});

const setCurrentTargets = () => {
  const positions = currentSequence.value.reduce<number[]>((acc, item, index) => {
    if (item === "_") {
      acc.push(index);
    }
    return acc;
  }, []);

  targetPositions.value = positions;
  placedNumbers.value = Array.from({ length: positions.length }, () => "");

  if (!sequenceResults.value.length) {
    sequenceResults.value = Array.from({ length: props.questions.sequences.length }, () => false);
  }
};

watch(currentSequence, setCurrentTargets, { immediate: true });

watch(isIncorrect, (value) => {
  if (!value) return;

  window.setTimeout(() => {
    moveToNextSequence(false);
  }, 1500);
});

watch(isCorrect, (value) => {
  if (!value || isTransitioning.value) return;

  window.setTimeout(() => {
    moveToNextSequence(true);
  }, 1000);
});

const resetActivity = () => {
  currentSequenceIndex.value = 0;
  isTransitioning.value = false;
  isCorrect.value = false;
  isIncorrect.value = false;
  showDialog.value = false;
  showResults.value = false;
  score.value = 0;
  sequenceResults.value = Array.from({ length: props.questions.sequences.length }, () => false);
  setCurrentTargets();
  keyboardStatusMessage.value = "";
};

const moveToNextSequence = (sequenceCorrect: boolean) => {
  isTransitioning.value = true;
  const nextResults = [...sequenceResults.value];
  nextResults[currentSequenceIndex.value] = sequenceCorrect;
  sequenceResults.value = nextResults;
  score.value = nextResults.filter(Boolean).length;

  window.setTimeout(() => {
    if (currentSequenceIndex.value < props.questions.sequences.length - 1) {
      currentSequenceIndex.value += 1;
      isCorrect.value = false;
      isIncorrect.value = false;
      isTransitioning.value = false;
      keyboardStatusMessage.value = "";
      return;
    }

    keyboardStatusMessage.value = completionMessage.value;
    showDialog.value = true;
  }, 500);
};

const handleNumberClick = (number: number) => {
  if (isTransitioning.value) return;

  const emptyIndex = placedNumbers.value.findIndex((value) => value === "");
  if (emptyIndex === -1) return;

  const nextNumbers = [...placedNumbers.value];
  nextNumbers[emptyIndex] = String(number);
  placedNumbers.value = nextNumbers;
  keyboardStatusMessage.value = `${
    contentLayoutLanguage.value === "kiswahili" ? "Imewekwa" : "Placed"
  }: ${number}.`;

  if (!nextNumbers.includes("")) {
    const allCorrect = nextNumbers.every((value, index) => value === correctAnswers.value[index]);
    if (allCorrect) {
      isCorrect.value = true;
      keyboardStatusMessage.value = contentLayoutLanguage.value === "kiswahili"
        ? `Mpangilio wa ${currentSequenceIndex.value + 1} ni sahihi.`
        : `Sequence ${currentSequenceIndex.value + 1} is correct.`;
      playSound("success");
    } else {
      isIncorrect.value = true;
      keyboardStatusMessage.value = contentLayoutLanguage.value === "kiswahili"
        ? "Mpangilio wa namba si sahihi. Jaribu tena."
        : "The number sequence is incorrect. Try again.";
      playSound("failure");
    }
    return;
  }

  playSound("correct");
};

const handleRemoveNumber = (index: number) => {
  if (isTransitioning.value) return;

  const removedNumber = placedNumbers.value[index];
  const nextNumbers = [...placedNumbers.value];
  nextNumbers[index] = "";
  placedNumbers.value = nextNumbers;
  isCorrect.value = false;
  keyboardStatusMessage.value = `${
    contentLayoutLanguage.value === "kiswahili" ? "Imeondolewa" : "Removed"
  }: ${removedNumber}.`;
};

const renderedResults = computed(() =>
  props.questions.sequences.map((sequence, sequenceIndex) => ({
    ...sequence,
    isCorrect: sequenceResults.value[sequenceIndex],
  })),
);
</script>

<template>
  <section
    class="flex h-full flex-col"
    aria-labelledby="missing-values-junior-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="missing-values-junior-title" class="sr-only">
      {{ props.questions.title }}
    </h2>
    <ActivityTitle :title="props.questions.title" />
    <p :id="activityInstructionsId" class="sr-only">
      {{
        contentLayoutLanguage === "kiswahili"
          ? "Tumia tab kusogea kwenye namba zilizopo. Bonyeza enter au space kuweka namba kwenye nafasi inayofuata. Tumia tab kufikia namba uliyoweka na bonyeza enter au space kuiondoa."
          : "Use Tab to move through the available numbers. Press Enter or Space to place a number in the next empty slot. Use Tab to reach a placed number and press Enter or Space to remove it."
      }}
    </p>
    <p :id="activityStatusId" aria-live="polite" class="sr-only">
      {{ keyboardStatusMessage }}
    </p>

    <div v-if="showResults && props.feedback !== 'none'" class="w-full space-y-6">
      <div class="space-y-4">
        <div
          v-for="(sequence, index) in renderedResults"
          :key="`result-${index}`"
          :class="[
            'flex items-center rounded-lg p-4 transition-colors duration-300',
            sequence.isCorrect ? 'bg-green-100' : props.feedback !== 'none' ? 'bg-red-100' : 'bg-gray-100',
          ]"
        >
          <div class="mr-4 shrink-0 text-xl">
            <span v-if="sequence.isCorrect" class="text-green-600">✓</span>
            <span v-else-if="props.feedback !== 'none'" class="text-red-600">✕</span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <template v-for="(item, seqIndex) in sequence.sequence" :key="`result-${index}-${seqIndex}`">
              <div
                v-if="item !== '_'"
                class="flex h-12 w-12 items-center justify-center rounded-md bg-picton-blue-50 text-xl font-bold"
              >
                {{ item }}
              </div>
              <div
                v-else
                :class="[
                  'flex h-12 w-12 items-center justify-center rounded-md text-xl font-bold',
                  (props.feedback === 'wrong-correct-answers' || props.feedback === 'wrong-correct')
                    ? sequence.isCorrect
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                    : 'bg-gray-200',
                ]"
              >
                {{
                  props.feedback === "wrong-correct-answers" && !sequence.isCorrect
                    ? sequence.answers[sequence.sequence.slice(0, seqIndex).filter((value) => value === "_").length]
                    : "?"
                }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <ActivityResults :score="score" :total="props.questions.sequences.length" :onRestart="resetActivity" />
    </div>

    <div v-else class="mx-auto flex h-full w-4/5 flex-col items-center justify-between">
      <div class="flex flex-wrap justify-center gap-2 text-center font-bold">
        <button
          v-for="number in numberPad"
          :key="number"
          type="button"
          :aria-label="contentLayoutLanguage === 'kiswahili' ? `Chagua namba ${number}` : `Choose number ${number}`"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
          class="flex h-10 w-10 items-center justify-center rounded-md bg-picton-blue-200 text-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2 md:h-14 md:w-14 md:text-3xl"
          @click="handleNumberClick(number)"
        >
          {{ number }}
        </button>
      </div>

      <div
        :class="[
          'flex items-center justify-center gap-1 rounded-lg p-2 transition-colors duration-300 md:gap-3 md:p-4',
          !isCorrect && !isIncorrect && 'bg-picton-blue-200',
          isCorrect && 'bg-green-200',
          isIncorrect && 'bg-red-200',
        ]"
      >
        <template v-for="(item, index) in currentSequence" :key="`sequence-${index}`">
          <div
            v-if="item !== '_'"
            class="flex h-10 w-10 items-center justify-center rounded-md bg-picton-blue-50 text-2xl font-bold md:h-16 md:w-16 md:text-3xl"
          >
            {{ item }}
          </div>

          <div v-else class="relative">
            <div
              :class="
                cn(
                  'flex h-10 w-10 items-center justify-center rounded-md bg-picton-blue-200 text-2xl font-bold md:h-16 md:w-16 md:text-3xl',
                  {
                    'border-2 border-picton-blue-300': !placedNumbers[currentSequence.slice(0, index).filter((value) => value === '_').length - 1],
                    'text-lemon-700':
                      placedNumbers[currentSequence.slice(0, index).filter((value) => value === '_').length - 1] && !isIncorrect,
                    'text-red-600':
                      placedNumbers[currentSequence.slice(0, index).filter((value) => value === '_').length - 1] && isIncorrect,
                  },
                )
              "
            >
              <button
                v-if="placedNumbers[currentSequence.slice(0, index).filter((value) => value === '_').length - 1]"
                type="button"
                :aria-label="contentLayoutLanguage === 'kiswahili' ? `Ondoa namba kutoka nafasi ya ${currentSequence.slice(0, index).filter((value) => value === '_').length}` : `Remove number from slot ${currentSequence.slice(0, index).filter((value) => value === '_').length}`"
                :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
                class="flex h-full w-full cursor-pointer items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2"
                @click="handleRemoveNumber(currentSequence.slice(0, index).filter((value) => value === '_').length - 1)"
              >
                {{ placedNumbers[currentSequence.slice(0, index).filter((value) => value === "_").length - 1] }}
              </button>
            </div>
          </div>
        </template>

        <div v-if="isCorrect" class="ml-2 text-3xl text-green-600">✓</div>
        <div v-if="isIncorrect" class="ml-2 text-3xl text-red-600">✕</div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :open="showDialog"
      :onOpenChange="
        (open: boolean) => {
          showDialog = open;
          if (!open) {
            if (props.feedback === 'none' || showResults) {
              resetActivity();
            } else {
              showResults = true;
            }
          }
        }
      "
      :isCompletionOnly="props.feedback === 'none'"
      :score="score"
      :total="props.questions.sequences.length"
      :completionMessage="completionMessage"
    />
  </section>
</template>
