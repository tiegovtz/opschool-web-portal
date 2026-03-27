<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useWindowSize } from "@vueuse/core";
import { cn, getImageUrl } from "@/lib/utils";
import { useObjects } from "@/hooks/useObjects";
import ActivityTitle from "@/components/templates/activity-title";
import type { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "~/composables/use-sound-effects";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type Direction = "across" | "down";

interface BasicWord {
  id: number;
  word: string;
  clue: string;
  imageUrl?: string;
}

interface PositionedWord extends BasicWord {
  direction: Direction;
  startRow: number;
  startCol: number;
  clueNumber?: number;
}

interface Cell {
  row: number;
  col: number;
  value: string;
  correctValue: string;
  isEmpty: boolean;
  wordIds: number[];
  clueNumber?: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
}

type CrosswordProps = {
  questions: {
    words: BasicWord[];
    numberOfWords: number;
    title: string;
    isGameMode?: boolean;
    isImageMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
};

const props = defineProps<CrosswordProps>();
const { width } = useWindowSize();
const { playSound } = useSoundEffects();

const completedObjectIds = ref<number[]>([]);
const { objects, loading, error, refetch } = useObjects({
  type: props.questions.isGameMode ? props.questions.type || null : null,
  limit: Math.max(props.questions.numberOfWords || 0, 10),
  autoFetch: !!props.questions.isGameMode,
});

const words = computed<BasicWord[]>(() =>
  props.questions.isGameMode
    ? objects.value.map((obj, index) => ({
        id: index + 1,
        word: obj.name.toUpperCase(),
        clue: obj.syllables || obj.name,
        imageUrl: props.questions.isImageMode ? getImageUrl(obj.imagePath, true) : undefined,
      }))
    : props.questions.words.map((word) => ({
        ...word,
        word: word.word.toUpperCase(),
      })),
);

const positionedWords = ref<PositionedWord[] | null>(null);
const crosswordGrid = ref<Cell[][]>([]);
const dimensions = ref({ rows: 0, cols: 0 });
const isGenerating = ref(true);
const generationError = ref<string | null>(null);
const selectedCell = ref<{ row: number; col: number } | null>(null);
const selectedDirection = ref<Direction>("across");
const selectedWordId = ref<number | null>(null);
const allAnswered = ref(false);
const showingFeedback = ref(false);
const totalWords = ref(0);
const correctWords = ref(0);
const gameComplete = ref(false);
const timeUp = ref(false);
const isResetting = ref(false);
const completedWordIds = ref(new Set<number>());
const completedQuestions = ref(new Set<number>());
const incorrectQuestions = ref(new Set<number>());
const activeInputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref("");
const isTouchDevice = ref(false);

const isActivityDisabled = computed(
  () => allAnswered.value || timeUp.value || gameComplete.value,
);

const cloneGrid = (grid: Cell[][]) => grid.map((row) => row.map((cell) => ({ ...cell })));

onMounted(() => {
  const hasTouchScreen =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error legacy platform field
    navigator.msMaxTouchPoints > 0;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  isTouchDevice.value = hasTouchScreen || isIOS || isIPadOS;
});

watch(selectedCell, async (value) => {
  if (!value || isActivityDisabled.value) return;
  await nextTick();
  activeInputRef.value?.focus();
}, { deep: true });

const generateCrosswordLayout = () => {
  try {
    if (!words.value.length) {
      generationError.value = "No words provided for crossword generation";
      return null;
    }

    const sortedWords = [...words.value].sort((left, right) => right.word.length - left.word.length);
    const tempGridSize = Math.max(14, sortedWords.length * 2);
    const grid: (string | null)[][] = Array.from({ length: tempGridSize }, () =>
      Array.from({ length: tempGridSize }, () => null),
    );

    const positioned: PositionedWord[] = [];
    const unconnectable: BasicWord[] = [];

    const firstWord = sortedWords[0];
    const centerRow = Math.floor(tempGridSize / 2);
    const centerCol = Math.floor((tempGridSize - firstWord.word.length) / 2);

    positioned.push({
      ...firstWord,
      direction: "across",
      startRow: centerRow,
      startCol: centerCol,
    });

    for (let index = 0; index < firstWord.word.length; index += 1) {
      grid[centerRow][centerCol + index] = firstWord.word[index];
    }

    const canPlaceWord = (word: string, row: number, col: number, direction: Direction) => {
      if (direction === "across" && col + word.length > tempGridSize) return false;
      if (direction === "down" && row + word.length > tempGridSize) return false;
      if (row < 0 || col < 0) return false;

      for (let index = 0; index < word.length; index += 1) {
        const currentRow = direction === "across" ? row : row + index;
        const currentCol = direction === "across" ? col + index : col;

        if (grid[currentRow][currentCol] !== null && grid[currentRow][currentCol] !== word[index]) {
          return false;
        }

        if (direction === "across") {
          if (index === 0 && col > 0 && grid[row][col - 1] !== null) return false;
          if (index === word.length - 1 && col + index + 1 < tempGridSize && grid[row][col + index + 1] !== null) {
            return false;
          }
          if (grid[currentRow][currentCol] === null) {
            if (row > 0 && grid[row - 1][currentCol] !== null) return false;
            if (row + 1 < tempGridSize && grid[row + 1][currentCol] !== null) return false;
          }
        } else {
          if (index === 0 && row > 0 && grid[row - 1][col] !== null) return false;
          if (index === word.length - 1 && row + index + 1 < tempGridSize && grid[row + index + 1][col] !== null) {
            return false;
          }
          if (grid[currentRow][currentCol] === null) {
            if (col > 0 && grid[currentRow][col - 1] !== null) return false;
            if (col + 1 < tempGridSize && grid[currentRow][col + 1] !== null) return false;
          }
        }
      }

      return true;
    };

    for (let wordIndex = 1; wordIndex < sortedWords.length; wordIndex += 1) {
      const currentWord = sortedWords[wordIndex];
      let placed = false;

      for (const placedWord of positioned) {
        if (placed) break;

        for (let leftIndex = 0; leftIndex < placedWord.word.length; leftIndex += 1) {
          if (placed) break;

          for (let rightIndex = 0; rightIndex < currentWord.word.length; rightIndex += 1) {
            if (placedWord.word[leftIndex] !== currentWord.word[rightIndex]) continue;

            const newDirection = placedWord.direction === "across" ? "down" : "across";
            const newRow =
              newDirection === "across"
                ? placedWord.startRow + leftIndex
                : placedWord.startRow - rightIndex;
            const newCol =
              newDirection === "across"
                ? placedWord.startCol - rightIndex
                : placedWord.startCol + leftIndex;

            if (!canPlaceWord(currentWord.word, newRow, newCol, newDirection)) continue;

            for (let index = 0; index < currentWord.word.length; index += 1) {
              const row = newDirection === "across" ? newRow : newRow + index;
              const col = newDirection === "across" ? newCol + index : newCol;
              grid[row][col] = currentWord.word[index];
            }

            positioned.push({
              ...currentWord,
              direction: newDirection,
              startRow: newRow,
              startCol: newCol,
            });
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        unconnectable.push(currentWord);
      }
    }

    let minConnectedRow = tempGridSize;
    let maxConnectedRow = 0;
    let minConnectedCol = tempGridSize;
    let maxConnectedCol = 0;

    positioned.forEach((word) => {
      const endRow = word.direction === "across" ? word.startRow : word.startRow + word.word.length - 1;
      const endCol = word.direction === "across" ? word.startCol + word.word.length - 1 : word.startCol;
      minConnectedRow = Math.min(minConnectedRow, word.startRow);
      maxConnectedRow = Math.max(maxConnectedRow, endRow);
      minConnectedCol = Math.min(minConnectedCol, word.startCol);
      maxConnectedCol = Math.max(maxConnectedCol, endCol);
    });

    const padding = 2;
    let currentRow = maxConnectedRow + padding;
    const isolatedWords: PositionedWord[] = [];

    for (const word of unconnectable) {
      let placed = false;
      if (currentRow < tempGridSize && currentRow >= 0) {
        const startCol = minConnectedCol;
        if (startCol + word.word.length <= tempGridSize) {
          const clear = word.word.split("").every((_, index) => grid[currentRow][startCol + index] === null);
          if (clear) {
            for (let index = 0; index < word.word.length; index += 1) {
              grid[currentRow][startCol + index] = word.word[index];
            }
            isolatedWords.push({
              ...word,
              direction: "across",
              startRow: currentRow,
              startCol,
            });
            placed = true;
          }
        }
      }

      if (!placed) {
        const startCol = maxConnectedCol + padding;
        const startRow = minConnectedRow;
        if (startCol < tempGridSize && startRow + word.word.length <= tempGridSize) {
          const clear = word.word.split("").every((_, index) => grid[startRow + index][startCol] === null);
          if (clear) {
            for (let index = 0; index < word.word.length; index += 1) {
              grid[startRow + index][startCol] = word.word[index];
            }
            isolatedWords.push({
              ...word,
              direction: "down",
              startRow,
              startCol,
            });
            placed = true;
          }
        }
      }

      if (!placed) {
        while (currentRow < tempGridSize && grid[currentRow].some((cell) => cell !== null)) {
          currentRow += 1;
        }
        if (currentRow < tempGridSize - word.word.length) {
          for (let index = 0; index < word.word.length; index += 1) {
            grid[currentRow][minConnectedCol + index] = word.word[index];
          }
          isolatedWords.push({
            ...word,
            direction: "across",
            startRow: currentRow,
            startCol: minConnectedCol,
          });
          currentRow += 1;
        }
      }
    }

    let minRow = tempGridSize;
    let maxRow = 0;
    let minCol = tempGridSize;
    let maxCol = 0;

    for (let row = 0; row < tempGridSize; row += 1) {
      for (let col = 0; col < tempGridSize; col += 1) {
        if (grid[row][col] === null) continue;
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }

    const normalized = [...positioned, ...isolatedWords].map((word) => ({
      ...word,
      startRow: word.startRow - minRow,
      startCol: word.startCol - minCol,
    }));

    return {
      positionedWords: normalized,
      dimensions: {
        rows: maxRow - minRow + 1,
        cols: maxCol - minCol + 1,
      },
    };
  } catch (error) {
    console.error("Error generating crossword:", error);
    return { error: "An unexpected error occurred while generating the crossword puzzle." };
  }
};

const initializeGrid = () => {
  if (!positionedWords.value) return [];

  const rows = dimensions.value.rows;
  const cols = dimensions.value.cols;
  const grid: Cell[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      value: "",
      correctValue: "",
      isEmpty: true,
      wordIds: [],
      isSelected: false,
      isHighlighted: false,
      isCorrect: false,
      isIncorrect: false,
    })),
  );

  positionedWords.value.forEach((word) => {
    for (let index = 0; index < word.word.length; index += 1) {
      const row = word.direction === "across" ? word.startRow : word.startRow + index;
      const col = word.direction === "across" ? word.startCol + index : word.startCol;
      grid[row][col].isEmpty = false;
      grid[row][col].correctValue = word.word[index];
      grid[row][col].wordIds.push(word.id);
    }
  });

  let clueNumber = 1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (grid[row][col].isEmpty) continue;
      const startsWord = positionedWords.value?.some((word) => word.startRow === row && word.startCol === col);
      if (!startsWord) continue;
      grid[row][col].clueNumber = clueNumber;
      positionedWords.value?.forEach((word) => {
        if (word.startRow === row && word.startCol === col) {
          word.clueNumber = clueNumber;
        }
      });
      clueNumber += 1;
    }
  }

  totalWords.value = positionedWords.value.length;
  return grid;
};

watch([words, loading], ([nextWords, isLoading]) => {
  if (props.questions.isGameMode && (isLoading || !nextWords.length)) return;

  isGenerating.value = true;
  generationError.value = null;
  showingFeedback.value = false;
  completedWordIds.value = new Set();
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
  allAnswered.value = false;
  gameComplete.value = false;
  timeUp.value = false;
  selectedCell.value = null;
  selectedWordId.value = null;
  correctWords.value = 0;

  const result = generateCrosswordLayout();
  if (!result) {
    isGenerating.value = false;
    generationError.value = "Failed to generate crossword puzzle";
    return;
  }
  if ("error" in result) {
    isGenerating.value = false;
    generationError.value = result.error;
    return;
  }

  positionedWords.value = result.positionedWords;
  dimensions.value = result.dimensions;
  crosswordGrid.value = initializeGrid();
  isGenerating.value = false;
}, { immediate: true });

const findWordForCell = (row: number, col: number, direction: Direction) => {
  if (!positionedWords.value || !crosswordGrid.value.length || crosswordGrid.value[row][col].isEmpty) {
    return null;
  }

  return (
    positionedWords.value.find((word) => {
      if (word.direction !== direction) return false;
      for (let index = 0; index < word.word.length; index += 1) {
        const wordRow = word.direction === "across" ? word.startRow : word.startRow + index;
        const wordCol = word.direction === "across" ? word.startCol + index : word.startCol;
        if (wordRow === row && wordCol === col) return true;
      }
      return false;
    }) || null
  );
};

const highlightWord = (word: PositionedWord) => {
  const nextGrid = cloneGrid(crosswordGrid.value).map((row) =>
    row.map((cell) => ({ ...cell, isSelected: false, isHighlighted: false })),
  );

  for (let index = 0; index < word.word.length; index += 1) {
    const row = word.direction === "across" ? word.startRow : word.startRow + index;
    const col = word.direction === "across" ? word.startCol + index : word.startCol;
    nextGrid[row][col].isHighlighted = true;
    if (selectedCell.value && selectedCell.value.row === row && selectedCell.value.col === col) {
      nextGrid[row][col].isSelected = true;
    }
  }

  crosswordGrid.value = nextGrid;
};

const handleCellClick = (row: number, col: number) => {
  if (crosswordGrid.value[row][col].isEmpty) return;

  if (selectedCell.value?.row === row && selectedCell.value?.col === col) {
    const nextDirection = selectedDirection.value === "across" ? "down" : "across";
    const word = findWordForCell(row, col, nextDirection);
    if (word) {
      selectedDirection.value = nextDirection;
      selectedWordId.value = word.id;
      highlightWord(word);
    }
  } else {
    selectedCell.value = { row, col };
    const directWord = findWordForCell(row, col, selectedDirection.value);
    const word = directWord || findWordForCell(row, col, selectedDirection.value === "across" ? "down" : "across");
    if (word) {
      selectedDirection.value = word.direction;
      selectedWordId.value = word.id;
      highlightWord(word);
    }
  }

  inputValue.value = crosswordGrid.value[row][col].value;
  activeInputRef.value?.focus();
};

const handleClueClick = (word: PositionedWord) => {
  selectedWordId.value = word.id;
  selectedDirection.value = word.direction;
  selectedCell.value = { row: word.startRow, col: word.startCol };
  highlightWord(word);
  inputValue.value = crosswordGrid.value[word.startRow][word.startCol].value;
  activeInputRef.value?.focus();
};

const updateGridSelection = (row: number, col: number) => {
  const nextGrid = cloneGrid(crosswordGrid.value);
  nextGrid.forEach((gridRow) => {
    gridRow.forEach((cell) => {
      cell.isSelected = cell.row === row && cell.col === col;
    });
  });
  crosswordGrid.value = nextGrid;
};

const checkCompletion = () => {
  if (!positionedWords.value) return false;

  let correctCount = 0;
  const completed = new Set<number>();

  positionedWords.value.forEach((word) => {
    const isWordCorrect = word.word.split("").every((_, index) => {
      const row = word.direction === "across" ? word.startRow : word.startRow + index;
      const col = word.direction === "across" ? word.startCol + index : word.startCol;
      return crosswordGrid.value[row][col].value.toUpperCase() === crosswordGrid.value[row][col].correctValue;
    });
    if (isWordCorrect) {
      correctCount += 1;
      completed.add(word.id);
    }
  });

  correctWords.value = correctCount;
  completedQuestions.value = new Set(Array.from(completed));

  if (correctCount === positionedWords.value.length && !allAnswered.value) {
    allAnswered.value = true;
    playSound("success");
  }

  return correctCount === positionedWords.value.length;
};

const markAnswers = () => {
  if (!positionedWords.value) return;

  const nextGrid = cloneGrid(crosswordGrid.value).map((row) =>
    row.map((cell) => ({
      ...cell,
      isHighlighted: false,
      isSelected: false,
    })),
  );

  let nextCorrectCount = 0;

  positionedWords.value.forEach((word) => {
    const isWordCorrect = word.word.split("").every((_, index) => {
      const row = word.direction === "across" ? word.startRow : word.startRow + index;
      const col = word.direction === "across" ? word.startCol + index : word.startCol;
      return nextGrid[row][col].value.toUpperCase() === nextGrid[row][col].correctValue;
    });

    if (isWordCorrect) {
      nextCorrectCount += 1;
    }

    word.word.split("").forEach((_, index) => {
      const row = word.direction === "across" ? word.startRow : word.startRow + index;
      const col = word.direction === "across" ? word.startCol + index : word.startCol;
      const cell = nextGrid[row][col];
      cell.isCorrect = isWordCorrect && cell.value.toUpperCase() === cell.correctValue;
      cell.isIncorrect = !cell.isCorrect;
    });
  });

  correctWords.value = nextCorrectCount;
  crosswordGrid.value = nextGrid;
  showingFeedback.value = true;
  selectedCell.value = null;
  selectedWordId.value = null;
};

const moveToNextCell = () => {
  if (!selectedCell.value || !selectedWordId.value || !positionedWords.value) return;
  if (completedWordIds.value.has(selectedWordId.value)) return;

  const word = positionedWords.value.find((item) => item.id === selectedWordId.value);
  if (!word) return;

  const nextRow = word.direction === "across" ? selectedCell.value.row : selectedCell.value.row + 1;
  const nextCol = word.direction === "across" ? selectedCell.value.col + 1 : selectedCell.value.col;

  if (
    nextRow >= crosswordGrid.value.length ||
    nextCol >= crosswordGrid.value[0].length ||
    crosswordGrid.value[nextRow][nextCol].isEmpty
  ) {
    return;
  }

  selectedCell.value = { row: nextRow, col: nextCol };
  updateGridSelection(nextRow, nextCol);
};

const moveToPreviousCell = () => {
  if (!selectedCell.value || !selectedWordId.value || !positionedWords.value) return;
  if (completedWordIds.value.has(selectedWordId.value)) return;

  const word = positionedWords.value.find((item) => item.id === selectedWordId.value);
  if (!word) return;

  const prevRow = word.direction === "across" ? selectedCell.value.row : selectedCell.value.row - 1;
  const prevCol = word.direction === "across" ? selectedCell.value.col - 1 : selectedCell.value.col;

  if (prevRow < 0 || prevCol < 0 || crosswordGrid.value[prevRow][prevCol].isEmpty) {
    return;
  }

  selectedCell.value = { row: prevRow, col: prevCol };
  updateGridSelection(prevRow, prevCol);
};

const handleLetterInput = (letter: string) => {
  if (!selectedCell.value || showingFeedback.value || isActivityDisabled.value) return;
  if (selectedWordId.value && completedWordIds.value.has(selectedWordId.value)) return;

  const nextGrid = cloneGrid(crosswordGrid.value);
  nextGrid[selectedCell.value.row][selectedCell.value.col].value = letter.toUpperCase();
  crosswordGrid.value = nextGrid;

  const word = positionedWords.value?.find((item) => item.id === selectedWordId.value);
  if (!word) {
    moveToNextCell();
    return;
  }

  const allFilled = word.word.split("").every((_, index) => {
    const row = word.direction === "across" ? word.startRow : word.startRow + index;
    const col = word.direction === "across" ? word.startCol + index : word.startCol;
    return nextGrid[row][col].value !== "";
  });

  if (!allFilled) {
    moveToNextCell();
    return;
  }

  const isCorrect = word.word.split("").every((_, index) => {
    const row = word.direction === "across" ? word.startRow : word.startRow + index;
    const col = word.direction === "across" ? word.startCol + index : word.startCol;
    return nextGrid[row][col].value.toUpperCase() === nextGrid[row][col].correctValue;
  });

  if (isCorrect) {
    playSound("correct");
    word.word.split("").forEach((_, index) => {
      const row = word.direction === "across" ? word.startRow : word.startRow + index;
      const col = word.direction === "across" ? word.startCol + index : word.startCol;
      nextGrid[row][col].isCorrect = true;
      nextGrid[row][col].isIncorrect = false;
    });
    crosswordGrid.value = nextGrid;
    completedWordIds.value = new Set([...completedWordIds.value, word.id]);
    checkCompletion();
    return;
  }

  playSound("failure");
  word.word.split("").forEach((_, index) => {
    const row = word.direction === "across" ? word.startRow : word.startRow + index;
    const col = word.direction === "across" ? word.startCol + index : word.startCol;
    nextGrid[row][col].isIncorrect = true;
  });
  crosswordGrid.value = nextGrid;

  setTimeout(() => {
    const clearedGrid = cloneGrid(crosswordGrid.value);
    word.word.split("").forEach((_, index) => {
      const row = word.direction === "across" ? word.startRow : word.startRow + index;
      const col = word.direction === "across" ? word.startCol + index : word.startCol;
      if (!clearedGrid[row][col].wordIds.some((wordId) => completedWordIds.value.has(wordId))) {
        clearedGrid[row][col].value = "";
        clearedGrid[row][col].isIncorrect = false;
      }
    });
    crosswordGrid.value = clearedGrid;
    inputValue.value = "";
  }, 1000);
};

const handleBackspace = () => {
  if (!selectedCell.value || showingFeedback.value || isActivityDisabled.value) return;

  const nextGrid = cloneGrid(crosswordGrid.value);
  const cell = nextGrid[selectedCell.value.row][selectedCell.value.col];
  if (cell.value === "") {
    moveToPreviousCell();
    return;
  }
  cell.value = "";
  crosswordGrid.value = nextGrid;
  inputValue.value = "";
};

const handleKeyPress = (event: KeyboardEvent) => {
  if (/^[A-Za-z]$/.test(event.key)) {
    handleLetterInput(event.key);
  } else if (event.key === "Backspace" || event.key === "Delete") {
    handleBackspace();
  }
};

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const newValue = target.value.toUpperCase();

  if (newValue.length === 0 && inputValue.value.length > 0) {
    handleBackspace();
    return;
  }

  if (newValue.length > 0 && /^[A-Z]$/.test(newValue.slice(-1))) {
    const lastChar = newValue.slice(-1);
    handleLetterInput(lastChar);
    inputValue.value = lastChar;
  }
};

const resetCrossword = () => {
  if (!positionedWords.value || !dimensions.value.rows) return;
  crosswordGrid.value = initializeGrid();
  selectedCell.value = null;
  selectedDirection.value = "across";
  completedWordIds.value = new Set();
  selectedWordId.value = null;
  allAnswered.value = false;
  showingFeedback.value = false;
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
  correctWords.value = 0;
};

const handleGameTimeUp = () => {
  if (!allAnswered.value && !timeUp.value) {
    timeUp.value = true;
    allAnswered.value = true;
    playSound("failure");
  }
};

const handleGameComplete = () => {
  if (!allAnswered.value && !timeUp.value) {
    allAnswered.value = true;
  }
};

const handleReset = () => {
  isResetting.value = true;
  allAnswered.value = false;
  gameComplete.value = true;
  setTimeout(() => {
    isResetting.value = false;
  }, 50);
};

const handlePlayAgain = async () => {
  isResetting.value = true;
  allAnswered.value = false;
  gameComplete.value = false;
  timeUp.value = false;
  showingFeedback.value = false;
  completedWordIds.value = new Set();
  completedQuestions.value = new Set();
  incorrectQuestions.value = new Set();
  selectedCell.value = null;
  selectedWordId.value = null;

  if (props.questions.isGameMode) {
    const updatedIds = [...new Set([...completedObjectIds.value, ...objects.value.map((item) => item.id)])];
    completedObjectIds.value = updatedIds;
    await refetch(updatedIds);
  } else {
    const result = generateCrosswordLayout();
    if (result && !("error" in result)) {
      positionedWords.value = result.positionedWords;
      dimensions.value = result.dimensions;
      crosswordGrid.value = initializeGrid();
    }
  }

  setTimeout(() => {
    isResetting.value = false;
  }, 100);
};

const acrossWords = computed(() =>
  (positionedWords.value || [])
    .filter((word) => word.direction === "across")
    .sort((left, right) => (left.clueNumber || 0) - (right.clueNumber || 0)),
);

const downWords = computed(() =>
  (positionedWords.value || [])
    .filter((word) => word.direction === "down")
    .sort((left, right) => (left.clueNumber || 0) - (right.clueNumber || 0)),
);
</script>

<template>
  <div v-if="props.questions.isGameMode && loading" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">Loading objects...</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && error" class="flex h-full items-center justify-center">
    <h1 class="mb-4 text-2xl font-bold text-red-700">Error loading objects: {{ error }}</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && !loading && words.length === 0" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">No objects found for the specified criteria</h1>
  </div>

  <div v-else-if="isGenerating" class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <div class="flex h-full items-center justify-center">
      <h2 class="text-xl">Generating crossword puzzle...</h2>
    </div>
  </div>

  <div v-else-if="generationError" class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <div class="flex h-full items-center justify-center">
      <div class="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <h2 class="mb-2 text-xl text-red-600">Crossword Generation Error</h2>
        <p class="text-red-500">{{ generationError }}</p>
      </div>
    </div>
  </div>

  <div v-else-if="!positionedWords || !crosswordGrid.length" class="flex h-full flex-col">
    <ActivityTitle :title="props.questions.title" />
    <div class="flex h-full items-center justify-center">
      <h2 class="text-xl">No words available for crossword generation.</h2>
    </div>
  </div>

  <GameModeWrapper
    v-else
    class="h-full"
    :is-game-mode="!!props.questions.isGameMode"
    :total-questions="words.length"
    :completed-questions="completedQuestions"
    :incorrect-questions="incorrectQuestions"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleGameTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <div class="flex h-full flex-col">
      <ActivityTitle :title="props.questions.title" />

      <div class="flex flex-col justify-center gap-6 p-4 2xl:flex-row">
        <div class="relative flex-1">
          <input
            v-if="selectedCell"
            ref="activeInputRef"
            :value="inputValue"
            class="absolute left-0 top-0 h-px w-px opacity-0"
            style="font-size: 16px"
            inputmode="text"
            enterkeyhint="next"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="characters"
            spellcheck="false"
            :disabled="isActivityDisabled"
            @input="handleInputChange"
          >

          <div v-if="isTouchDevice && selectedCell" class="absolute -top-8 left-0 right-0 text-center">
            <span class="rounded bg-white px-2 py-1 text-xs text-gray-600 shadow">
              Tap to type
            </span>
          </div>

          <div
            tabindex="0"
            class="mx-auto w-fit outline-none"
            :style="{
              display: 'grid',
              gridTemplateRows: `repeat(${dimensions.rows}, ${width > 768 ? 48 : 25}px)`,
              gridTemplateColumns: `repeat(${dimensions.cols}, ${width > 768 ? 48 : 25}px)`,
            }"
            @keydown="(event) => handleKeyPress(event as KeyboardEvent)"
          >
            <div
              v-for="(cell, index) in crosswordGrid.flat()"
              :key="`${cell.row}-${cell.col}-${index}`"
              :class="
                cn(
                  'relative flex items-center justify-center border border-picton-blue-300/70 select-none',
                  cell.isEmpty ? 'bg-picton-blue-200/70' : 'bg-white',
                  !cell.isEmpty && !showingFeedback && !isActivityDisabled ? 'cursor-pointer' : '',
                  selectedCell?.row === cell.row && selectedCell?.col === cell.col
                    ? '!bg-lemon-400 ring-2 ring-lemon-500 ring-offset-1'
                    : '',
                  cell.isHighlighted ? 'bg-lemon-100' : '',
                  cell.value && !cell.isEmpty && !cell.isCorrect && !cell.isIncorrect ? 'bg-lemon-200 text-lemon-700' : '',
                  cell.isCorrect ? '!border-green-500 !bg-green-100 text-green-700' : '',
                  cell.isIncorrect ? '!border-red-500 !bg-red-100 text-red-800' : '',
                )
              "
              @click="
                !cell.isEmpty && !showingFeedback && !isActivityDisabled
                  ? handleCellClick(cell.row, cell.col)
                  : undefined
              "
            >
              <template v-if="!cell.isEmpty">
                <span v-if="cell.clueNumber !== undefined" class="absolute left-1 top-0.5 z-10 text-xs opacity-70">
                  {{ cell.clueNumber }}
                </span>

                <div v-if="showingFeedback && cell.isIncorrect" class="flex h-full w-full flex-col items-center justify-center leading-tight">
                  <span v-if="cell.value !== ''" class="text-base opacity-80 line-through">
                    {{ cell.value }}
                  </span>
                  <span :class="cell.value !== '' ? 'text-lg font-semibold text-green-600' : 'text-lg font-semibold text-red-700'">
                    {{ cell.correctValue }}
                  </span>
                </div>

                <span v-else class="text-xl font-bold">
                  {{ cell.value }}
                </span>
              </template>
            </div>
          </div>
        </div>

        <div class="flex flex-1 flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <div class="flex-1">
            <h3 class="mb-2 text-lg font-bold">ACROSS</h3>
            <div class="space-y-2">
              <button
                v-for="word in acrossWords"
                :key="`across-${word.id}`"
                type="button"
                :class="
                  cn(
                    'w-full rounded p-2 text-left',
                    selectedWordId === word.id && selectedDirection === 'across'
                      ? 'bg-picton-blue-200'
                      : 'hover:bg-picton-blue-200/50',
                    showingFeedback || isActivityDisabled ? 'opacity-70' : '',
                  )
                "
                @click="!showingFeedback && !isActivityDisabled ? handleClueClick(word) : undefined"
              >
                <span class="font-bold">{{ word.clueNumber }}.</span>
                <img
                  v-if="props.questions.isImageMode && word.imageUrl"
                  :src="word.imageUrl"
                  :alt="word.clue"
                  class="mt-2 h-40 rounded-lg border border-gray-200"
                >
                <span v-else class="ml-1">{{ word.clue }}</span>
              </button>
            </div>
          </div>

          <div class="flex-1">
            <h3 class="mb-2 text-lg font-bold">DOWN</h3>
            <div class="space-y-2">
              <button
                v-for="word in downWords"
                :key="`down-${word.id}`"
                type="button"
                :class="
                  cn(
                    'w-full rounded p-2 text-left',
                    selectedWordId === word.id && selectedDirection === 'down'
                      ? 'bg-picton-blue-200'
                      : 'hover:bg-picton-blue-200/50',
                    showingFeedback || isActivityDisabled ? 'opacity-70' : '',
                  )
                "
                @click="!showingFeedback && !isActivityDisabled ? handleClueClick(word) : undefined"
              >
                <span class="font-bold">{{ word.clueNumber }}.</span>
                <img
                  v-if="props.questions.isImageMode && word.imageUrl"
                  :src="word.imageUrl"
                  :alt="word.clue"
                  class="mt-2 h-40 rounded-lg border border-gray-200"
                >
                <span v-else class="ml-1">{{ word.clue }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ActivityResults
        v-if="showingFeedback"
        :score="correctWords"
        :total="totalWords"
        :on-restart="resetCrossword"
      />

      <div v-if="gameComplete" class="bg-picton-blue-50 p-4">
        <ActivityResults
          :score="correctWords"
          :total="totalWords"
          :on-restart="handlePlayAgain"
        />
      </div>

      <ActivityResultsAlertDialog
        :score="timeUp ? 0 : correctWords"
        :total="totalWords"
        :open="allAnswered && !isResetting"
        :on-open-change="
          (open) => {
            if (open) {
              return;
            }
            if (props.questions.isGameMode) {
              handleReset();
            } else if (props.feedback === 'wrong-correct-answers' || props.feedback === 'wrong-correct') {
              markAnswers();
            } else {
              resetCrossword();
            }
            if (!props.questions.isGameMode) {
              allAnswered = false;
            }
          }
        "
      />
    </div>
  </GameModeWrapper>
</template>
