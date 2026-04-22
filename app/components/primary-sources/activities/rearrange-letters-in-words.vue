<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn, getImageUrl } from "@/lib/utils";
import ActivityResults from "@/components/templates/results";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "~/composables/use-sound-effects";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import { useObjects } from "@/hooks/useObjects";
import { GameModeWrapper } from "@/components/ui/game-mode";

type RearrangeLettersInWordsProps = {
  questions: {
    title: string;
    isGameMode?: boolean;
    type?: string;
    words?: string;
    gameTimeLimit?: number;
    questions: {
      word: string;
      image?: string;
      id?: number;
    }[];
  };
};

type WordState = {
  word: string;
  image?: string;
  id?: number;
  scrambled: string[];
};

const props = defineProps<RearrangeLettersInWordsProps>();
const ui = useActivityUiText();

const scrambleWord = (word: string) => {
  const letters = word.split("");
  let attempts = 0;

  while (attempts < 20) {
    const shuffled = [...letters];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }

    if (shuffled.join("").toLowerCase() !== word.toLowerCase()) {
      return shuffled;
    }

    attempts += 1;
  }

  return letters.reverse();
};

const limit = Number.parseInt(props.questions.words || "10", 10) || 10;
const { objects, loading, error, refetch } = useObjects({
  type: props.questions.isGameMode ? props.questions.type || null : null,
  limit,
  autoFetch: !!props.questions.isGameMode,
});

const scrambledWords = ref<WordState[]>([]);
const currentAnswer = ref<string[][]>([]);
const completedWords = ref(new Set<number>());
const incorrectWords = ref(new Set<number>());
const showResultsDialog = ref(false);
const showResults = ref(false);
const timeUp = ref(false);
const completedObjectIds = ref<number[]>([]);
const instructionsId = "rearrange-letters-in-words-instructions";
const statusId = "rearrange-letters-in-words-status";
const keyboardStatusMessage = ref("");

const { playSound } = useSoundEffects();

const isGameMode = computed(() => !!props.questions.isGameMode);
const gameQuestions = computed(() =>
  isGameMode.value
    ? objects.value.map((object) => ({
        word: object.name.toLowerCase(),
        image: object.imagePath ? getImageUrl(object.imagePath, true) : undefined,
        id: object.id,
      }))
    : props.questions.questions,
);

const initializeWords = () => {
  scrambledWords.value = gameQuestions.value.map((item) => ({
    ...item,
    scrambled: scrambleWord(item.word),
  }));
  currentAnswer.value = scrambledWords.value.map((item) => Array(item.word.length).fill(""));
  completedWords.value = new Set();
  incorrectWords.value = new Set();
  showResultsDialog.value = false;
  showResults.value = false;
  timeUp.value = false;
  keyboardStatusMessage.value = "";
};

watch([gameQuestions, loading], ([questions, isLoading]) => {
  if (isLoading || !questions.length) return;
  initializeWords();
}, { immediate: true });

const isActivityDisabled = computed(() => timeUp.value || showResultsDialog.value);
const score = computed(() => completedWords.value.size);

const checkWord = (wordIndex: number) => {
  const expected = scrambledWords.value[wordIndex]?.word || "";
  const current = currentAnswer.value[wordIndex]?.join("") || "";
  return current.length === expected.length && current.toLowerCase() === expected.toLowerCase();
};

const returnPlacedLetters = (wordIndex: number) => {
  const placedLetters = currentAnswer.value[wordIndex].filter(Boolean);
  const reshuffled = scrambleWord(placedLetters.join(""));

  scrambledWords.value = scrambledWords.value.map((item, index) =>
    index === wordIndex
      ? {
          ...item,
          scrambled: [...item.scrambled.filter(Boolean), ...reshuffled],
        }
      : item,
  );

  currentAnswer.value = currentAnswer.value.map((item, index) =>
    index === wordIndex ? Array(scrambledWords.value[wordIndex].word.length).fill("") : item,
  );
};

const finalizeWord = (wordIndex: number) => {
  if (checkWord(wordIndex)) {
    const nextCompleted = new Set(completedWords.value);
    nextCompleted.add(wordIndex);
    completedWords.value = nextCompleted;
    incorrectWords.value = new Set([...incorrectWords.value].filter((value) => value !== wordIndex));
    playSound("correct");

    if (nextCompleted.size === scrambledWords.value.length) {
      keyboardStatusMessage.value = `${ui.resultsReady.value}. ${score.value + 1} / ${scrambledWords.value.length}.`;
      showResultsDialog.value = true;
    }
    return;
  }

  const nextIncorrect = new Set(incorrectWords.value);
  nextIncorrect.add(wordIndex);
  incorrectWords.value = nextIncorrect;
  playSound("failure");

  setTimeout(() => {
    returnPlacedLetters(wordIndex);
    incorrectWords.value = new Set([...incorrectWords.value].filter((value) => value !== wordIndex));
  }, 700);
};

const handleLetterClick = (wordIndex: number, letterIndex: number) => {
  if (isActivityDisabled.value || completedWords.value.has(wordIndex)) return;

  const nextSlotIndex = currentAnswer.value[wordIndex].findIndex((value) => value === "");
  if (nextSlotIndex < 0) return;

  const letter = scrambledWords.value[wordIndex].scrambled[letterIndex];
  if (!letter) return;

  currentAnswer.value = currentAnswer.value.map((slots, index) =>
    index === wordIndex
      ? slots.map((slot, slotIndex) => (slotIndex === nextSlotIndex ? letter : slot))
      : slots,
  );
  keyboardStatusMessage.value = `Placed: ${letter.toUpperCase()}.`;

  scrambledWords.value = scrambledWords.value.map((item, index) =>
    index === wordIndex
      ? {
          ...item,
          scrambled: item.scrambled.map((value, indexValue) => (indexValue === letterIndex ? "" : value)),
        }
      : item,
  );

  playSound("click");

  if (!currentAnswer.value[wordIndex].includes("")) {
    finalizeWord(wordIndex);
  }
};

const handleSlotClick = (wordIndex: number, slotIndex: number) => {
  if (isActivityDisabled.value || completedWords.value.has(wordIndex)) return;

  const letter = currentAnswer.value[wordIndex][slotIndex];
  if (!letter) return;

  scrambledWords.value = scrambledWords.value.map((item, index) =>
    index === wordIndex
      ? {
          ...item,
          scrambled: [...item.scrambled.filter(Boolean), letter],
        }
      : item,
  );

  currentAnswer.value = currentAnswer.value.map((slots, index) =>
    index === wordIndex ? slots.map((value, indexValue) => (indexValue === slotIndex ? "" : value)) : slots,
  );
  keyboardStatusMessage.value = `Removed: ${letter.toUpperCase()}.`;
};

const handleTimeUp = () => {
  timeUp.value = true;
  showResultsDialog.value = true;
  playSound("failure");
};

const handleGameComplete = () => {
  showResultsDialog.value = true;
};

const handlePlayAgain = async () => {
  if (isGameMode.value) {
    const updatedIds = [...new Set([...completedObjectIds.value, ...objects.value.map((item) => item.id)])];
    completedObjectIds.value = updatedIds;
    await refetch(updatedIds);
    return;
  }

  initializeWords();
};

const getWordPromptLabel = (word: WordState) => word.word.toUpperCase();
</script>

<template>
  <div v-if="isGameMode && loading" class="flex h-full items-center justify-center">
    <p class="text-xl font-semibold text-oceanBlue">Loading objects...</p>
  </div>

  <div v-else-if="isGameMode && error" class="flex h-full items-center justify-center">
    <p class="text-xl font-semibold text-red-700">{{ error }}</p>
  </div>

  <GameModeWrapper
    v-else
    class="flex h-full flex-col"
    :is-game-mode="isGameMode"
    :total-questions="scrambledWords.length"
    :completed-questions="completedWords"
    :incorrect-questions="incorrectWords"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <ActivityTitle :title="props.questions.title" />
    <p :id="instructionsId" class="sr-only">
      Use the Tab key to move through the scrambled letters and answer slots. Activate a scrambled
      letter to place it into the next empty slot. Activate a filled slot to return that letter to
      the scrambled letter list.
    </p>
    <p :id="statusId" aria-live="polite" class="sr-only">
      {{ keyboardStatusMessage }}
    </p>

    <div class="flex flex-1 flex-col gap-4 overflow-auto">
      <div
        v-for="(word, wordIndex) in scrambledWords"
        :key="`${word.word}-${wordIndex}`"
        class="rounded-2xl bg-picton-blue-50 p-4"
        :aria-describedby="`${instructionsId} ${statusId}`"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="space-y-3">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(letter, letterIndex) in word.scrambled"
                :key="`${wordIndex}-${letterIndex}-${letter}`"
                :class="
                  cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg bg-picton-blue-200 text-xl font-semibold uppercase transition hover:bg-picton-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2',
                    !letter || isActivityDisabled || completedWords.has(wordIndex) ? 'cursor-not-allowed opacity-40' : '',
                  )
                "
                :disabled="!letter || isActivityDisabled || completedWords.has(wordIndex)"
                :aria-describedby="`${instructionsId} ${statusId}`"
                :aria-label="`Letter ${letter.toUpperCase()} for ${getWordPromptLabel(word)}`"
                @click="handleLetterClick(wordIndex, letterIndex)"
              >
                {{ letter }}
              </button>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="(letter, slotIndex) in currentAnswer[wordIndex]"
                :key="`${wordIndex}-slot-${slotIndex}`"
                :class="
                  cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed text-xl font-semibold uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-600 focus-visible:ring-offset-2',
                    completedWords.has(wordIndex)
                      ? 'border-green-400 bg-green-100 text-green-700'
                      : incorrectWords.has(wordIndex)
                        ? 'border-red-400 bg-red-100 text-red-700'
                        : 'border-picton-blue-400 bg-white text-picton-blue-800 hover:bg-picton-blue-50',
                  )
                "
                :disabled="isActivityDisabled || completedWords.has(wordIndex)"
                :aria-describedby="`${instructionsId} ${statusId}`"
                :aria-label="
                  letter
                    ? `Filled slot ${slotIndex + 1} for ${getWordPromptLabel(word)} containing letter ${letter.toUpperCase()}. Activate to remove it.`
                    : `Empty slot ${slotIndex + 1} for ${getWordPromptLabel(word)}.`
                "
                @click="handleSlotClick(wordIndex, slotIndex)"
              >
                {{ letter }}
              </button>
            </div>
          </div>

          <div v-if="word.image" class="overflow-hidden rounded-xl bg-white p-2 md:w-40">
            <img :src="word.image" :alt="`Reference image for ${getWordPromptLabel(word)}`" class="mx-auto max-h-28 object-contain">
          </div>
        </div>
      </div>
    </div>

    <div v-if="showResults" class="mt-4">
      <ActivityResults :score="score" :total="scrambledWords.length" :on-restart="handlePlayAgain" />
    </div>

    <ActivityResultsAlertDialog
      :score="score"
      :total="scrambledWords.length"
      :open="showResultsDialog"
      :on-open-change="
        (open) => {
          if (open) {
            return;
          }
          showResultsDialog = false;
          showResults = true;
        }
      "
    />
  </GameModeWrapper>
</template>
