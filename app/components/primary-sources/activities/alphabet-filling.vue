<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ActivityTitle from "@/components/templates/activity-title";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  questions: {
    title: string;
    targetWords: string[];
  };
};

const props = defineProps<Props>();

const { playSound } = useSoundEffects();
const contentLayoutLanguage = useContentLayoutLanguage();
const completionMessage = computed(() =>
  contentLayoutLanguage.value === "kiswahili"
    ? `Hongera! Umefanikiwa kukamilisha maneno yote ${props.questions.targetWords.length}!`
    : `Great job! You've successfully completed all ${props.questions.targetWords.length} words!`,
);

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
const alphabetColors: Record<string, string> = {
  a: "text-purple-600",
  b: "text-pink-500",
  c: "text-amber-400",
  d: "text-amber-800",
  e: "text-gray-500",
  f: "text-blue-500",
  g: "text-red-600",
  h: "text-green-500",
  i: "text-yellow-400",
  j: "text-pink-500",
  k: "text-amber-400",
  l: "text-amber-800",
  m: "text-gray-500",
  n: "text-blue-500",
  o: "text-red-600",
  p: "text-green-500",
  q: "text-yellow-400",
  r: "text-purple-600",
  s: "text-pink-500",
  t: "text-amber-400",
  u: "text-amber-800",
  v: "text-gray-500",
  w: "text-blue-500",
  x: "text-red-600",
  y: "text-green-500",
  z: "text-yellow-400",
};

const currentWordIndex = ref(0);
const placedLetters = ref<string[]>([]);
const isCorrect = ref(false);
const isIncorrect = ref(false);
const showDialog = ref(false);
const isTransitioning = ref(false);

const currentWord = computed(() => props.questions.targetWords[currentWordIndex.value] || "");

const resetCurrentWord = () => {
  placedLetters.value = Array.from({ length: currentWord.value.length }, () => "");
  isCorrect.value = false;
  isIncorrect.value = false;
};

const resetActivity = () => {
  currentWordIndex.value = 0;
  isTransitioning.value = false;
  isCorrect.value = false;
  isIncorrect.value = false;
  showDialog.value = false;
  placedLetters.value = Array.from(
    { length: props.questions.targetWords[0]?.length || 0 },
    () => "",
  );
};

watch(
  currentWord,
  (value) => {
    placedLetters.value = Array.from({ length: value.length }, () => "");
  },
  { immediate: true },
);

watch(isIncorrect, (value) => {
  if (!value) return;

  window.setTimeout(() => {
    isIncorrect.value = false;
    resetCurrentWord();
  }, 1500);
});

watch(isCorrect, (value) => {
  if (!value || isTransitioning.value) return;

  window.setTimeout(() => {
    isTransitioning.value = true;

    window.setTimeout(() => {
      if (currentWordIndex.value < props.questions.targetWords.length - 1) {
        currentWordIndex.value += 1;
        isCorrect.value = false;
        isTransitioning.value = false;
      } else {
        showDialog.value = true;
      }
    }, 500);
  }, 1000);
});

const handleLetterClick = (letter: string) => {
  if (isTransitioning.value) return;

  const emptyIndex = placedLetters.value.findIndex((value) => value === "");
  if (emptyIndex === -1) return;

  const nextLetters = [...placedLetters.value];
  nextLetters[emptyIndex] = letter;
  placedLetters.value = nextLetters;

  if (!nextLetters.includes("")) {
    const wordIsCorrect = nextLetters.join("") === currentWord.value;

    if (wordIsCorrect) {
      isCorrect.value = true;
      playSound("success");
    } else {
      isIncorrect.value = true;
      playSound("failure");
    }
    return;
  }

  playSound("correct");
};

const handleRemoveLetter = (index: number) => {
  if (isTransitioning.value) return;

  const nextLetters = [...placedLetters.value];
  nextLetters[index] = "";
  placedLetters.value = nextLetters;
  isCorrect.value = false;
};
</script>

<template>
  <div class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />

    <div class="flex h-full flex-col items-center justify-between">
      <div
        class="grid grid-cols-12 gap-2 text-center font-bold"
        style="grid-template-columns: repeat(13, minmax(0, 1fr));"
      >
        <p
          v-for="letter in alphabet"
          :key="letter"
          :class="['cursor-pointer select-none text-6xl', alphabetColors[letter]]"
          @click="handleLetterClick(letter)"
        >
          {{ letter }}
        </p>
      </div>

      <div class="max-h-44 max-w-44">
        <img
          src="https://softteacher.com/smartbook/Pre-Unit/1682270887570tongue%20tranparent.png"
          alt="Clue"
          class="h-full w-full object-cover"
        >
      </div>

      <div
        :class="[
          'flex items-center justify-center gap-3 rounded-lg p-4 transition-colors duration-300',
          !isCorrect && !isIncorrect && 'bg-picton-blue-200',
          isCorrect && 'bg-green-200',
          isIncorrect && 'bg-red-200',
        ]"
      >
        <div v-for="(_, index) in currentWord.split('')" :key="index" class="relative">
          <div
            :class="[
              'flex h-16 w-16 items-center justify-center rounded-md text-3xl font-bold transition-colors',
              placedLetters[index] && !isIncorrect && 'bg-lemon-200 text-lemon-700',
              placedLetters[index] && isIncorrect && 'bg-red-100 text-red-600',
              !placedLetters[index] && 'border-2 border-picton-blue-300',
            ]"
          >
            <button
              v-if="placedLetters[index]"
              type="button"
              class="flex h-full w-full cursor-pointer items-center justify-center"
              @click="handleRemoveLetter(index)"
            >
              {{ placedLetters[index] }}
            </button>
          </div>
        </div>

        <div v-if="isCorrect" class="ml-2 text-3xl text-green-600">✓</div>
      </div>
    </div>

    <ActivityResultsAlertDialog
      :open="showDialog"
      :onOpenChange="
        (open: boolean) => {
          showDialog = open;
          if (!open) {
            resetActivity();
          }
        }
      "
      :isCompletionOnly="true"
      :completionMessage="completionMessage"
    />
  </div>
</template>
