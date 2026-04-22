<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn } from "@/lib/utils";
import { useObjects } from "@/hooks/useObjects";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "~/composables/use-sound-effects";
import { GameModeWrapper } from "@/components/ui/game-mode";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type HiddenWordsActivityProps = {
  questions: {
    title: string;
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    words: string[];
    forChildren: boolean;
  };
};

type Cell = {
  row: number;
  col: number;
};

type WordPlacement = {
  word: string;
  cells: Cell[];
};

const GRID_SIZE = { rows: 12, cols: 19 };
const FOR_CHILDREN_GRID_SIZE = { rows: 8, cols: 10 };
const WORD_COLORS = [
  { bg: "bg-stone-200", text: "text-stone-800", hover: "hover:bg-stone-300" },
  { bg: "bg-blue-200", text: "text-blue-800", hover: "hover:bg-blue-300" },
  { bg: "bg-green-200", text: "text-green-800", hover: "hover:bg-green-300" },
  { bg: "bg-purple-200", text: "text-purple-800", hover: "hover:bg-purple-300" },
  { bg: "bg-orange-200", text: "text-orange-800", hover: "hover:bg-orange-300" },
  { bg: "bg-pink-200", text: "text-pink-800", hover: "hover:bg-pink-300" },
  { bg: "bg-teal-200", text: "text-teal-800", hover: "hover:bg-teal-300" },
  { bg: "bg-indigo-200", text: "text-indigo-800", hover: "hover:bg-indigo-300" },
];

const props = defineProps<HiddenWordsActivityProps>();

const completedObjectIds = ref<number[]>([]);
const { objects, loading, error, refetch } = useObjects({
  type: props.questions.isGameMode ? props.questions.type || null : null,
  limit: 9,
  autoFetch: !!props.questions.isGameMode,
});

const grid = ref<string[][]>([]);
const selectedCells = ref<Cell[]>([]);
const foundWords = ref<string[]>([]);
const wordPlacements = ref<WordPlacement[]>([]);
const showResultsDialog = ref(false);
const showResults = ref(false);
const timeUp = ref(false);
const completedWords = ref(new Set<number>());
const incorrectWords = ref(new Set<number>());
const wordColors = ref<Map<string, (typeof WORD_COLORS)[number]>>(new Map());
const activityInstructionsId = "hidden-words-instructions";
const ui = useActivityUiText();
const activityStatusId = "hidden-words-status";
const keyboardStatusMessage = ref("");

const { playSound } = useSoundEffects();

const isGameMode = computed(() => !!props.questions.isGameMode);
const gameWords = computed(() =>
  isGameMode.value
    ? objects.value.map((item) => item.name.toLowerCase())
    : props.questions.words.map((word) => word.toLowerCase()),
);
const gridSize = computed(() => (props.questions.forChildren ? FOR_CHILDREN_GRID_SIZE : GRID_SIZE));
const isActivityDisabled = computed(() => showResultsDialog.value || timeUp.value || showResults.value);

const randomLetter = () => String.fromCharCode(97 + Math.floor(Math.random() * 26));

const createEmptyGrid = () =>
  Array.from({ length: gridSize.value.rows }, () =>
    Array.from({ length: gridSize.value.cols }, () => ""),
  );

const canPlaceWord = (
  nextGrid: string[][],
  word: string,
  row: number,
  col: number,
  isHorizontal: boolean,
) => {
  if (isHorizontal) {
    if (col + word.length > gridSize.value.cols) return false;
    for (let index = 0; index < word.length; index += 1) {
      if (nextGrid[row][col + index] && nextGrid[row][col + index] !== word[index]) {
        return false;
      }
    }
    return true;
  }

  if (row + word.length > gridSize.value.rows) return false;
  for (let index = 0; index < word.length; index += 1) {
    if (nextGrid[row + index][col] && nextGrid[row + index][col] !== word[index]) {
      return false;
    }
  }
  return true;
};

const placeWord = (nextGrid: string[][], word: string): WordPlacement | null => {
  const isHorizontal = Math.random() > 0.5;
  const positions: Cell[] = [];

  for (let row = 0; row < gridSize.value.rows; row += 1) {
    for (let col = 0; col < gridSize.value.cols; col += 1) {
      if (canPlaceWord(nextGrid, word, row, col, isHorizontal)) {
        positions.push({ row, col });
      }
    }
  }

  if (!positions.length) return null;

  const { row, col } = positions[Math.floor(Math.random() * positions.length)];
  const cells: Cell[] = [];

  if (isHorizontal) {
    for (let index = 0; index < word.length; index += 1) {
      nextGrid[row][col + index] = word[index];
      cells.push({ row, col: col + index });
    }
  } else {
    for (let index = 0; index < word.length; index += 1) {
      nextGrid[row + index][col] = word[index];
      cells.push({ row: row + index, col });
    }
  }

  return { word, cells };
};

const initializeGrid = () => {
  if (!gameWords.value.length) return;

  let attempts = 0;
  while (attempts < 100) {
    const nextGrid = createEmptyGrid();
    const placements: WordPlacement[] = [];
    let success = true;

    for (const word of [...gameWords.value].sort((left, right) => right.length - left.length)) {
      const placement = placeWord(nextGrid, word);
      if (!placement) {
        success = false;
        break;
      }
      placements.push(placement);
    }

    if (success) {
      for (let row = 0; row < gridSize.value.rows; row += 1) {
        for (let col = 0; col < gridSize.value.cols; col += 1) {
          if (!nextGrid[row][col]) {
            nextGrid[row][col] = randomLetter();
          }
        }
      }

      grid.value = nextGrid;
      wordPlacements.value = placements;
      selectedCells.value = [];
      foundWords.value = [];
      completedWords.value = new Set();
      incorrectWords.value = new Set();
      wordColors.value = new Map();
      keyboardStatusMessage.value = "";
      return;
    }

    attempts += 1;
  }
};

watch([gameWords, loading], ([words, isLoading]) => {
  if (isLoading || !words.length) return;

  showResultsDialog.value = false;
  showResults.value = false;
  timeUp.value = false;
  initializeGrid();
}, { immediate: true });

watch(foundWords, (value) => {
  completedWords.value = new Set(value.map((_, index) => index));
  if (value.length && value.length === gameWords.value.length) {
    showResultsDialog.value = true;
    playSound("success");
  }
}, { deep: true });

const getNextAvailableColor = () => {
  const usedColors = Array.from(wordColors.value.values());
  const available = WORD_COLORS.filter(
    (color) =>
      !usedColors.some(
        (usedColor) => usedColor.bg === color.bg && usedColor.text === color.text,
      ),
  );

  if (!available.length) {
    return WORD_COLORS[wordColors.value.size % WORD_COLORS.length];
  }

  return available[Math.floor(Math.random() * available.length)];
};

const checkForWord = (cells: Cell[]) => {
  if (cells.length < 2) return null;

  return (
    wordPlacements.value.find(({ word, cells: wordCells }) => {
      if (foundWords.value.includes(word) || cells.length !== wordCells.length) {
        return false;
      }

      return cells.every((selectedCell) =>
        wordCells.some(
          (wordCell) => wordCell.row === selectedCell.row && wordCell.col === selectedCell.col,
        ),
      );
    })?.word || null
  );
};

const handleCellClick = (row: number, col: number) => {
  if (isActivityDisabled.value) return;

  const selectedIndex = selectedCells.value.findIndex(
    (cell) => cell.row === row && cell.col === col,
  );

  if (selectedIndex >= 0) {
    selectedCells.value = selectedCells.value.slice(0, selectedIndex);
    return;
  }

  const nextSelectedCells = [...selectedCells.value, { row, col }];
  selectedCells.value = nextSelectedCells;

  const foundWord = checkForWord(nextSelectedCells);
  if (!foundWord) return;

  const nextColors = new Map(wordColors.value);
  if (!nextColors.has(foundWord)) {
    nextColors.set(foundWord, getNextAvailableColor());
  }

  wordColors.value = nextColors;
  foundWords.value = [...foundWords.value, foundWord];
  selectedCells.value = [];
  keyboardStatusMessage.value = ui.formatActivitySelected(ui.availableAnswerChoices.value, foundWord);
  playSound("correct");
};

const isCellPartOfFoundWord = (row: number, col: number) =>
  wordPlacements.value.some(
    ({ word, cells }) =>
      foundWords.value.includes(word) &&
      cells.some((cell) => cell.row === row && cell.col === col),
  );

const getCellColor = (row: number, col: number) => {
  for (const { word, cells } of wordPlacements.value) {
    if (
      foundWords.value.includes(word) &&
      cells.some((cell) => cell.row === row && cell.col === col)
    ) {
      return wordColors.value.get(word) || null;
    }
  }
  return null;
};

const handleGameTimeUp = () => {
  timeUp.value = true;
  showResultsDialog.value = true;
  keyboardStatusMessage.value = ui.timesUp.value;
  playSound("failure");
};

const handleGameComplete = () => {
  showResultsDialog.value = true;
  keyboardStatusMessage.value = `${ui.resultsReady.value}. ${foundWords.value.length} / ${gameWords.value.length}.`;
};

const handlePlayAgain = async () => {
  showResultsDialog.value = false;
  showResults.value = false;
  timeUp.value = false;
  keyboardStatusMessage.value = "";

  if (isGameMode.value) {
    const updatedIds = [...new Set([...completedObjectIds.value, ...objects.value.map((item) => item.id)])];
    completedObjectIds.value = updatedIds;
    await refetch(updatedIds);
    return;
  }

  initializeGrid();
};
</script>

<template>
  <div v-if="isGameMode && loading" class="flex h-full items-center justify-center">
    <p class="text-xl font-semibold text-oceanBlue">Loading objects...</p>
  </div>

  <div v-else-if="isGameMode && error" class="flex h-full items-center justify-center">
    <p class="text-xl font-semibold text-red-700">{{ error }}</p>
  </div>

  <div v-else-if="isGameMode && !gameWords.length" class="flex h-full items-center justify-center">
    <p class="text-xl font-semibold text-oceanBlue">No objects found for this activity.</p>
  </div>

  <GameModeWrapper
    v-else
    class="flex h-full flex-col"
    :is-game-mode="isGameMode"
    :total-questions="gameWords.length"
    :completed-questions="completedWords"
    :incorrect-questions="incorrectWords"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleGameTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <section
      class="flex h-full flex-col"
      aria-labelledby="hidden-words-title"
      :aria-describedby="activityInstructionsId"
    >
      <h2 id="hidden-words-title" class="sr-only">
        {{ props.questions.title }}
      </h2>
      <ActivityTitle :title="props.questions.title" />
      <p :id="activityInstructionsId" class="sr-only">
        {{
          ui.isSwahili
            ? "Tumia tab kusogea kwenye visanduku vya herufi. Bonyeza enter au space kuchagua herufi na kuunda neno lililofichwa."
            : "Use Tab to move through the letter cells. Press Enter or Space to select letters and build a hidden word."
        }}
      </p>
      <p :id="activityStatusId" class="sr-only" aria-live="polite">
        {{ keyboardStatusMessage }}
      </p>

    <div class="flex flex-1 flex-col gap-4 md:flex-row">
      <div class="rounded-2xl bg-picton-blue-50 p-4 md:w-72">
        <h3 class="mb-3 font-bold text-picton-blue-800">Hidden Words</h3>
        <ul class="flex flex-wrap gap-2 md:flex-col">
          <li
            v-for="word in gameWords"
            :key="word"
            :class="
              cn(
                'rounded-lg px-2 py-1 text-sm transition-all',
                foundWords.includes(word)
                  ? [wordColors.get(word)?.bg || 'bg-lemon-100', wordColors.get(word)?.text || 'text-lemon-800', 'line-through']
                  : 'text-neutral-700',
              )
            "
          >
            {{ word }}
          </li>
        </ul>
      </div>

      <div class="flex-1 rounded-2xl bg-picton-blue-50 p-2 md:p-4">
        <div class="grid gap-[2px] overflow-auto">
          <div
            v-for="(row, rowIndex) in grid"
            :key="rowIndex"
            class="flex gap-[2px]"
          >
            <button
              v-for="(cell, colIndex) in row"
              :key="`${rowIndex}-${colIndex}`"
              type="button"
              :aria-pressed="selectedCells.some((selected) => selected.row === rowIndex && selected.col === colIndex)"
              :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
              :aria-label="ui.isSwahili ? `Herufi ${cell}, mstari ${rowIndex + 1}, safu ${colIndex + 1}` : `Letter ${cell}, row ${rowIndex + 1}, column ${colIndex + 1}`"
              :class="
                cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg border-2 border-transparent text-lg font-semibold uppercase transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-picton-blue-500 focus-visible:ring-offset-2 md:h-11 md:w-11',
                  selectedCells.some((selected) => selected.row === rowIndex && selected.col === colIndex)
                    ? 'border-picton-blue-500 bg-picton-blue-300'
                    : 'bg-picton-blue-100 hover:bg-picton-blue-200',
                  props.questions.forChildren ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl',
                  isActivityDisabled ? 'cursor-not-allowed opacity-80' : '',
                  isCellPartOfFoundWord(rowIndex, colIndex) && !selectedCells.some((selected) => selected.row === rowIndex && selected.col === colIndex)
                    ? [getCellColor(rowIndex, colIndex)?.bg, getCellColor(rowIndex, colIndex)?.text]
                    : '',
                )
              "
              :disabled="isActivityDisabled"
              @click="handleCellClick(rowIndex, colIndex)"
            >
              {{ cell }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showResults" class="mt-4">
      <ActivityResults :score="foundWords.length" :total="gameWords.length" :on-restart="handlePlayAgain" />
    </div>

    <ActivityResultsAlertDialog
      :score="foundWords.length"
      :total="gameWords.length"
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
    </section>
  </GameModeWrapper>
</template>
