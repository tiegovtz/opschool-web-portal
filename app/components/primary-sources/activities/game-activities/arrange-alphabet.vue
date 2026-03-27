<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useWindowSize } from "@vueuse/core";
import { cn, getImageUrl } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper";
import type { GameStats } from "@/components/ui/game-mode";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useObjects } from "~/composables/useObjects";
import { useSoundEffects } from "~/composables/use-sound-effects";

type Props = {
  questions: {
    title: string;
    type?: string;
    fontSize?: number;
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
};

const props = defineProps<Props>();

const { objects, loading, error, refetch } = useObjects({
  type: props.questions.type || null,
  limit: 10,
  autoFetch: true,
});

const currentWordIndex = ref(0);
const placedLetters = ref<string[]>([]);
const isCorrect = ref(false);
const isIncorrect = ref(false);
const showDialog = ref(false);
const isTransitioning = ref(false);
const gameComplete = ref(false);
const score = ref(0);
const totalWords = ref(0);
const completedObjectIds = ref<number[]>([]);
const wrongAttempts = ref(0);
const showHint = ref(false);
const completedQuestions = ref(new Set<number>());
const incorrectQuestions = ref(new Set<number>());

const { playSound } = useSoundEffects();
const { width } = useWindowSize();

const currentObject = computed(() => objects.value[currentWordIndex.value]);
const currentWord = computed(() => currentObject.value?.name?.toLowerCase() || "");
const currentImage = computed(() => getImageUrl(currentObject.value?.imagePath || "", true));

watch(
  objects,
  (value) => {
    totalWords.value = value.length;
    if (value[0]?.name) {
      placedLetters.value = Array(value[0].name.length).fill("");
    }
  },
  { immediate: true },
);

watch(
  currentWord,
  (value) => {
    if (!value) return;

    placedLetters.value = Array(value.length).fill("");
    wrongAttempts.value = 0;
    showHint.value = false;
  },
  { immediate: true },
);

watch(isIncorrect, (value, _, onCleanup) => {
  if (!value) return;

  const timer = setTimeout(() => {
    placedLetters.value = Array(currentWord.value.length).fill("");
    isCorrect.value = false;
    isIncorrect.value = false;

    if (wrongAttempts.value >= 2) {
      showHint.value = true;
    }
  }, 1500);

  onCleanup(() => {
    clearTimeout(timer);
  });
});

watch(isCorrect, (value, _, onCleanup) => {
  if (!value || isTransitioning.value) return;

  const timer = setTimeout(() => {
    score.value += 1;
    const nextCompletedQuestions = new Set(completedQuestions.value);
    nextCompletedQuestions.add(currentWordIndex.value);
    completedQuestions.value = nextCompletedQuestions;
    moveToNextWord();
  }, 1000);

  onCleanup(() => {
    clearTimeout(timer);
  });
});

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

const resetActivity = async () => {
  currentWordIndex.value = 0;
  isTransitioning.value = false;
  score.value = 0;
  gameComplete.value = false;
  wrongAttempts.value = 0;
  showHint.value = false;
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
  isCorrect.value = false;
  isIncorrect.value = false;
  showDialog.value = false;

  if (objects.value[0]?.name) {
    placedLetters.value = Array(objects.value[0].name.length).fill("");
  }

  await refetch(completedObjectIds.value);
};

const handleDialogChange = (open: boolean) => {
  showDialog.value = open;
  if (!open) {
    void resetActivity();
  }
};

const handleTimeUp = () => {
  if (!gameComplete.value) {
    gameComplete.value = true;
    showDialog.value = true;
  }
};

const handleGameComplete = (_stats: GameStats) => {
  gameComplete.value = true;
  showDialog.value = true;
};

const moveToNextWord = () => {
  isTransitioning.value = true;

  if (currentObject.value) {
    completedObjectIds.value = [...completedObjectIds.value, currentObject.value.id];
  }

  setTimeout(() => {
    if (currentWordIndex.value < objects.value.length - 1) {
      currentWordIndex.value += 1;
      isCorrect.value = false;
      isTransitioning.value = false;
      wrongAttempts.value = 0;
      showHint.value = false;
      return;
    }

    gameComplete.value = true;
    showDialog.value = true;
  }, 500);
};

const handleLetterClick = (letter: string) => {
  if (isTransitioning.value || !currentWord.value || isCorrect.value || isIncorrect.value) return;

  const emptyIndex = placedLetters.value.findIndex((value) => value === "");
  if (emptyIndex === -1) return;

  const nextPlacedLetters = [...placedLetters.value];
  nextPlacedLetters[emptyIndex] = letter;
  placedLetters.value = nextPlacedLetters;

  if (nextPlacedLetters.includes("")) {
    playSound("correct");
    return;
  }

  const wordIsCorrect = nextPlacedLetters.join("").toLowerCase() === currentWord.value.toLowerCase();

  if (wordIsCorrect) {
    isCorrect.value = true;
    playSound("success");
    return;
  }

  isIncorrect.value = true;
  wrongAttempts.value += 1;
  const nextIncorrectQuestions = new Set(incorrectQuestions.value);
  nextIncorrectQuestions.add(currentWordIndex.value);
  incorrectQuestions.value = nextIncorrectQuestions;
  playSound("failure");
};

const handleRemoveLetter = (index: number) => {
  if (isTransitioning.value || !currentWord.value || isCorrect.value) return;

  const nextPlacedLetters = [...placedLetters.value];
  nextPlacedLetters[index] = "";
  placedLetters.value = nextPlacedLetters;
  isCorrect.value = false;
  isIncorrect.value = false;
};
</script>

<template>
  <div
    v-if="loading"
    class="flex h-full flex-1 flex-col items-center justify-center"
  >
    <div class="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-picton-blue-600" />
    <p class="text-lg text-gray-600">Loading words...</p>
  </div>

  <div
    v-else-if="error || objects.length === 0"
    class="flex h-full flex-1 flex-col items-center justify-center"
  >
    <p class="mb-4 text-lg text-red-600">
      {{ error || "No words available for this activity" }}
    </p>
    <button
      type="button"
      class="rounded-lg bg-picton-blue-600 px-4 py-2 text-white hover:bg-picton-blue-700"
      @click="refetch()"
    >
      Try Again
    </button>
  </div>

  <GameModeWrapper
    v-else
    class="flex h-full flex-1 flex-col"
    :is-game-mode="props.questions.isGameMode || false"
    :total-questions="totalWords"
    :completed-questions="completedQuestions"
    :incorrect-questions="incorrectQuestions"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleTimeUp"
    :on-game-complete="handleGameComplete"
    :show-timer="props.questions.isGameMode || false"
    :show-progress="props.questions.isGameMode || false"
  >
    <div class="flex h-full flex-1 flex-col">
      <ActivityTitle :title="props.questions.title" />

      <div class="flex h-full flex-1 flex-col items-center justify-between gap-10">
        <div
          class="grid gap-2 text-center font-bold"
          :style="{
            gridTemplateColumns: `repeat(${width > 768 ? 13 : 7}, minmax(0, 1fr))`,
          }"
        >
          <p
            v-for="letter in alphabet"
            :key="letter"
            :class="`cursor-pointer select-none text-4xl transition-transform hover:scale-110 md:text-6xl ${alphabetColors[letter]}`"
            @click="handleLetterClick(letter)"
          >
            {{ letter }}
          </p>
        </div>

        <div class="relative h-[300px] rounded-lg bg-white p-2 md:shadow-md">
          <div
            v-if="showHint"
            class="absolute left-1/2 top-[-2rem] -translate-x-1/2 transform rounded border border-yellow-300 bg-yellow-100 px-2 py-1 text-sm text-yellow-800"
          >
            Hint: First letter is "{{ currentWord[0]?.toUpperCase() }}"
          </div>

          <img
            v-if="currentImage"
            :src="currentImage"
            :alt="`Clue for word: ${currentWord}`"
            class="h-full w-full rounded object-contain"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center text-gray-500"
          >
            No image available
          </div>
        </div>

        <div
          :class="
            cn(
              'flex flex-wrap items-center justify-center gap-2 rounded-lg p-4 transition-colors duration-300 md:gap-3',
              {
                'bg-picton-blue-200': !isCorrect && !isIncorrect,
                'bg-green-200': isCorrect,
                'bg-red-200': isIncorrect,
              },
            )
          "
        >
          <div
            v-for="(_, index) in currentWord.split('')"
            :key="`${currentWordIndex}-${index}`"
            class="relative"
          >
            <div
              :class="
                cn(
                  'flex h-10 w-10 items-center justify-center rounded-md text-xl font-bold md:h-16 md:w-16 md:text-3xl',
                  {
                    'border-2 border-picton-blue-300': !placedLetters[index],
                    'text-lemon-700': placedLetters[index] && !isIncorrect,
                    'text-red-600': placedLetters[index] && isIncorrect,
                    'border-yellow-400 bg-yellow-100':
                      showHint && index === 0 && !placedLetters[index],
                  },
                )
              "
            >
              <button
                v-if="placedLetters[index]"
                type="button"
                class="flex h-full w-full items-center justify-center rounded hover:bg-red-100"
                @click="handleRemoveLetter(index)"
              >
                {{ placedLetters[index] }}
              </button>
              <span v-else-if="showHint && index === 0" class="text-gray-400">
                {{ currentWord[0]?.toUpperCase() }}
              </span>
            </div>
          </div>

          <div v-if="isCorrect" class="ml-2 text-3xl text-green-600">
            <Icon icon="mdi:check" width="32" height="32" />
          </div>
        </div>

        <ActivityResultsAlertDialog
          :score="score"
          :total="totalWords"
          :open="showDialog"
          :on-open-change="handleDialogChange"
        />
      </div>
    </div>
  </GameModeWrapper>
</template>
