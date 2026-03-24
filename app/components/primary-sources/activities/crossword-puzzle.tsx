import * as motion from "motion/react-client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// Local imports
import { cn, getImageUrl } from "@/lib/utils";
import { useObjects } from "@/hooks/useObjects";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useWindowSize } from "@/shared/hooks/use-window-size";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

// Types
type Direction = "across" | "down";

interface BasicWord {
  id: number;
  word: string;
  clue: string;
  imageUrl?: string; // Optional image URL for image-based clues
}

interface PositionedWord {
  id: number;
  word: string;
  clue: string;
  imageUrl?: string; // Optional image URL for image-based clues
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

interface CrosswordProps {
  questions: {
    words: BasicWord[];
    numberOfWords: number;
    title: string;
    isGameMode?: boolean;
    isImageMode?: boolean; // New flag for image-based clues
    type?: string;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
}

const CrosswordPuzzle: React.FC<CrosswordProps> = ({
  questions: {
    title,
    numberOfWords,
    words: providedWords,
    isGameMode,
    isImageMode,
    type,
    gameTimeLimit,
  },
  feedback,
}) => {
  const { width } = useWindowSize();
  // State to track completed objects for replay functionality
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  // Fetch objects for game mode
  const { objects, loading, error, refetch } = useObjects({
    type: isGameMode ? type || null : null,
    words: numberOfWords,
    limit: 10,
  });

  // Use fetched objects if in game mode, otherwise use provided words
  const words = useMemo(
    () =>
      isGameMode
        ? objects.map((obj, index) => ({
            id: index + 1,
            word: obj.name.toUpperCase(),
            clue: obj.syllables || obj.name, // isImageMode ? obj.name : `Identify the ${obj.name}`, // Use object name for image mode, descriptive text for text mode
            imageUrl: isImageMode
              ? getImageUrl(obj.imagePath, true)
              : undefined,
          }))
        : providedWords,
    [isGameMode, isImageMode, objects, providedWords],
  );

  const [positionedWords, setPositionedWords] = useState<
    PositionedWord[] | null
  >(null);
  const [crosswordGrid, setCrosswordGrid] = useState<Cell[][]>([]);
  const [dimensions, setDimensions] = useState({ rows: 0, cols: 0 });
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [selectedDirection, setSelectedDirection] =
    useState<Direction>("across");
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [totalWords, setTotalWords] = useState(0);
  const [correctWords, setCorrectWords] = useState(0);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [timeUp, setTimeUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Add a set to track words that have been correctly completed
  const [completedWordIds, setCompletedWordIds] = useState<Set<number>>(
    new Set(),
  );

  // Track completed and incorrect words for game mode
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(
    new Set(),
  );

  // Add ref for touch input handling
  const activeInputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const { playSound } = useSoundEffects();

  // Check if activity is disabled (completed or timed out)
  const isActivityDisabled = allAnswered || timeUp || gameComplete;

  // Detect touch device - use more reliable detection
  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouchScreen =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - msMaxTouchPoints is legacy but still used
        navigator.msMaxTouchPoints > 0;

      // Also check for iOS/iPad specifically
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isIPadOS =
        navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

      setIsTouchDevice(hasTouchScreen || isIOS || isIPadOS);
    };

    checkTouchDevice();
  }, []);

  // Focus input when selected cell changes (for mobile devices)
  // This maintains focus as user navigates, complementing the synchronous focus in click handlers
  useEffect(() => {
    if (selectedCell && activeInputRef.current && !isActivityDisabled) {
      try {
        activeInputRef.current.focus();
      } catch (error) {
        console.debug("Focus not allowed:", error);
      }
    }
  }, [selectedCell, isActivityDisabled]);

  // Crossword generation algorithm
  const generateCrosswordLayout = useCallback(() => {
    try {
      if (!words || words.length === 0) {
        setGenerationError("No words provided for crossword generation");
        return null;
      }

      // Convert BasicWord[] to uppercase for processing
      const processedWords = words.map((word) => ({
        ...word,
        word: word.word.toUpperCase(),
      }));

      // Sort words by length (longest first) for better placement
      const sortedWords = [...processedWords].sort(
        (a, b) => b.word.length - a.word.length,
      );

      // Create a large enough temporary grid for placing words
      const maxWordLength = sortedWords[0].word.length;
      const tempGridSize = Math.max(14, sortedWords.length * 2);
      const grid: (string | null)[][] = Array(tempGridSize)
        .fill(null)
        .map(() => Array(tempGridSize).fill(null));

      const positioned: PositionedWord[] = [];
      const unconnectable: BasicWord[] = [];

      // Place first word horizontally in the center
      const firstWord = sortedWords[0];
      const centerRow = Math.floor(tempGridSize / 2);
      const centerCol = Math.floor((tempGridSize - firstWord.word.length) / 2);

      // Add first word to positioned words
      positioned.push({
        id: firstWord.id,
        word: firstWord.word,
        clue: firstWord.clue,
        imageUrl: firstWord.imageUrl,
        direction: "across",
        startRow: centerRow,
        startCol: centerCol,
      });

      // Place first word in the grid
      for (let i = 0; i < firstWord.word.length; i++) {
        grid[centerRow][centerCol + i] = firstWord.word[i];
      }

      // Helper function to check if a word can be placed at a specific position
      const canPlaceWord = (
        word: string,
        row: number,
        col: number,
        direction: Direction,
      ): boolean => {
        // Check bounds
        if (direction === "across" && col + word.length > tempGridSize)
          return false;
        if (direction === "down" && row + word.length > tempGridSize)
          return false;
        if (row < 0 || col < 0) return false;

        // Check each cell for this word
        for (let i = 0; i < word.length; i++) {
          const currentRow = direction === "across" ? row : row + i;
          const currentCol = direction === "across" ? col + i : col;

          // If this cell has a letter already, make sure it matches
          if (
            grid[currentRow][currentCol] !== null &&
            grid[currentRow][currentCol] !== word[i]
          ) {
            return false;
          }

          // Check for adjacent cells that shouldn't have letters
          // This prevents words from "touching" improperly
          if (direction === "across") {
            // Check cell before and after
            if (i === 0 && col > 0 && grid[row][col - 1] !== null) return false;
            if (
              i === word.length - 1 &&
              col + i + 1 < tempGridSize &&
              grid[row][col + i + 1] !== null
            )
              return false;

            // Check cells above and below (unless they're part of a crossing word)
            if (grid[currentRow][currentCol] === null) {
              // Only check if we're not crossing a word
              if (row > 0 && grid[row - 1][currentCol] !== null) return false;
              if (row + 1 < tempGridSize && grid[row + 1][currentCol] !== null)
                return false;
            }
          } else {
            // direction === "down"
            // Check cell before and after
            if (i === 0 && row > 0 && grid[row - 1][col] !== null) return false;
            if (
              i === word.length - 1 &&
              row + i + 1 < tempGridSize &&
              grid[row + i + 1][col] !== null
            )
              return false;

            // Check cells to the left and right (unless they're part of a crossing word)
            if (grid[currentRow][currentCol] === null) {
              // Only check if we're not crossing a word
              if (col > 0 && grid[currentRow][col - 1] !== null) return false;
              if (col + 1 < tempGridSize && grid[currentRow][col + 1] !== null)
                return false;
            }
          }
        }

        return true;
      };

      // Try to place remaining words by finding intersections
      for (let i = 1; i < sortedWords.length; i++) {
        const currentWord = sortedWords[i];
        let placed = false;

        // Try to find intersections with already placed words
        for (const placedWord of positioned) {
          if (placed) break;

          const placedWordStr = placedWord.word;
          const currentWordStr = currentWord.word;

          // Find all possible intersection points between the two words
          for (let j = 0; j < placedWordStr.length; j++) {
            if (placed) break;

            for (let k = 0; k < currentWordStr.length; k++) {
              if (placed) break;

              // If letters match, we have a potential intersection
              if (placedWordStr[j] === currentWordStr[k]) {
                // Calculate position for new word based on intersection
                // The direction should be opposite of the placed word
                const newDirection =
                  placedWord.direction === "across" ? "down" : "across";
                let newRow, newCol;

                if (newDirection === "across") {
                  // Place horizontally, intersecting with vertical word
                  newRow = placedWord.startRow + j; // Same row as the intersection point
                  newCol = placedWord.startCol - k; // Offset by position in the new word
                } else {
                  // Place vertically, intersecting with horizontal word
                  newRow = placedWord.startRow - k; // Offset by position in the new word
                  newCol = placedWord.startCol + j; // Same column as the intersection point
                }

                // Check if the word can be placed here
                if (
                  canPlaceWord(currentWordStr, newRow, newCol, newDirection)
                ) {
                  // Place the word in the grid
                  for (let m = 0; m < currentWordStr.length; m++) {
                    const row = newDirection === "across" ? newRow : newRow + m;
                    const col = newDirection === "across" ? newCol + m : newCol;
                    grid[row][col] = currentWordStr[m];
                  }

                  // Add to positioned words
                  positioned.push({
                    id: currentWord.id,
                    word: currentWordStr,
                    clue: currentWord.clue,
                    imageUrl: currentWord.imageUrl,
                    direction: newDirection,
                    startRow: newRow,
                    startCol: newCol,
                  });

                  placed = true;
                  break;
                }
              }
            }
          }
        }

        // If we couldn't place this word, add it to unconnectable words
        if (!placed) {
          unconnectable.push(currentWord);
        }
      }

      // Find the bounds of the connected puzzle
      let minConnectedRow = tempGridSize,
        maxConnectedRow = 0;
      let minConnectedCol = tempGridSize,
        maxConnectedCol = 0;

      positioned.forEach((word) => {
        const endRow =
          word.direction === "across"
            ? word.startRow
            : word.startRow + word.word.length - 1;
        const endCol =
          word.direction === "across"
            ? word.startCol + word.word.length - 1
            : word.startCol;

        minConnectedRow = Math.min(minConnectedRow, word.startRow);
        maxConnectedRow = Math.max(maxConnectedRow, endRow);
        minConnectedCol = Math.min(minConnectedCol, word.startCol);
        maxConnectedCol = Math.max(maxConnectedCol, endCol);
      });

      // If there are no words positioned yet, use default values
      if (positioned.length === 0) {
        minConnectedRow = centerRow;
        maxConnectedRow = centerRow;
        minConnectedCol = centerCol;
        maxConnectedCol = centerCol;
      }

      // Add padding around the connected puzzle for isolated words
      const padding = 2;
      let currentRow = maxConnectedRow + padding;
      const isolatedWords: PositionedWord[] = [];

      // Try to place unconnected words more compactly
      for (const word of unconnectable) {
        let placed = false;

        // First try to place horizontally in a row below the main puzzle
        if (currentRow < tempGridSize && currentRow >= 0) {
          // Find the leftmost position where we can place this word
          let startCol = minConnectedCol;

          // Try to place the word
          if (startCol + word.word.length <= tempGridSize) {
            // Check if this position is clear
            let positionClear = true;
            for (let i = 0; i < word.word.length; i++) {
              if (grid[currentRow][startCol + i] !== null) {
                positionClear = false;
                break;
              }
            }

            if (positionClear) {
              // Place the word horizontally
              const isolatedWord: PositionedWord = {
                id: word.id,
                word: word.word,
                clue: word.clue,
                imageUrl: word.imageUrl,
                direction: "across",
                startRow: currentRow,
                startCol: startCol,
              };

              // Add to grid
              for (let i = 0; i < word.word.length; i++) {
                grid[currentRow][startCol + i] = word.word[i];
              }

              isolatedWords.push(isolatedWord);
              placed = true;
            }
          }
        }

        // If horizontal placement failed, try vertical placement
        if (!placed) {
          // Place vertically in a column to the right of the main puzzle
          const startCol = maxConnectedCol + padding;
          let startRow = minConnectedRow;

          if (
            startCol < tempGridSize &&
            startRow + word.word.length <= tempGridSize
          ) {
            // Check if this position is clear
            let positionClear = true;
            for (let i = 0; i < word.word.length; i++) {
              if (grid[startRow + i][startCol] !== null) {
                positionClear = false;
                break;
              }
            }

            if (positionClear) {
              // Place the word vertically
              const isolatedWord: PositionedWord = {
                id: word.id,
                word: word.word,
                clue: word.clue,
                imageUrl: word.imageUrl,
                direction: "down",
                startRow: startRow,
                startCol: startCol,
              };

              // Add to grid
              for (let i = 0; i < word.word.length; i++) {
                grid[startRow + i][startCol] = word.word[i];
              }

              isolatedWords.push(isolatedWord);
              placed = true;
            }
          }
        }

        // If both approaches failed, place it in the next row
        if (!placed) {
          // Find the next empty row
          while (
            currentRow < tempGridSize &&
            grid[currentRow].some((cell) => cell !== null)
          ) {
            currentRow++;
          }

          if (currentRow < tempGridSize - word.word.length) {
            // Place word horizontally
            const isolatedWord: PositionedWord = {
              id: word.id,
              word: word.word,
              clue: word.clue,
              imageUrl: word.imageUrl,
              direction: "across",
              startRow: currentRow,
              startCol: minConnectedCol, // Align with the left side of the main puzzle
            };

            // Add to grid
            for (let i = 0; i < word.word.length; i++) {
              grid[currentRow][minConnectedCol + i] = word.word[i];
            }

            isolatedWords.push(isolatedWord);
            currentRow++; // Only move to next row if we had to use this fallback
          } else {
            console.warn(
              `Could not place isolated word: ${word.word} - grid too small`,
            );
          }
        }
      }

      // Find the final bounds of the entire puzzle
      let minRow = tempGridSize,
        maxRow = 0,
        minCol = tempGridSize,
        maxCol = 0;
      for (let row = 0; row < tempGridSize; row++) {
        for (let col = 0; col < tempGridSize; col++) {
          if (grid[row][col] !== null) {
            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
          }
        }
      }

      // Normalize positioned words to the new coordinates
      const normalizedPositioned = [...positioned, ...isolatedWords].map(
        (word) => ({
          ...word,
          startRow: word.startRow - minRow,
          startCol: word.startCol - minCol,
        }),
      );

      // Return details about connected and unconnected words
      return {
        positionedWords: normalizedPositioned,
        dimensions: {
          rows: maxRow - minRow + 1,
          cols: maxCol - minCol + 1,
        },
      };
    } catch (error) {
      console.error("Error generating crossword:", error);
      return {
        error:
          "An unexpected error occurred while generating the crossword puzzle.",
      };
    }
  }, [words]);

  // Initialize grid with empty cells based on positioned words
  const initializeGrid = useCallback((): Cell[][] => {
    if (!positionedWords || !dimensions) return [];

    const { rows, cols } = dimensions;
    const grid: Cell[][] = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({
            row: 0,
            col: 0,
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

    // Set row and col properties
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        grid[row][col].row = row;
        grid[row][col].col = col;
      }
    }

    // Process words and assign their letters to cells
    positionedWords.forEach((word) => {
      for (let i = 0; i < word.word.length; i++) {
        const row =
          word.direction === "across" ? word.startRow : word.startRow + i;
        const col =
          word.direction === "across" ? word.startCol + i : word.startCol;

        if (row < rows && col < cols) {
          grid[row][col].isEmpty = false;
          grid[row][col].correctValue = word.word[i];
          grid[row][col].wordIds.push(word.id);
        }
      }
    });

    // Assign clue numbers
    let clueNumber = 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!grid[row][col].isEmpty) {
          // Check if this cell is the start of any word
          const isStartOfWord = positionedWords.some(
            (word) => word.startRow === row && word.startCol === col,
          );

          if (isStartOfWord) {
            grid[row][col].clueNumber = clueNumber;
            // Also assign the clue number to the corresponding positioned word(s)
            positionedWords.forEach((word) => {
              if (word.startRow === row && word.startCol === col) {
                word.clueNumber = clueNumber;
              }
            });
            clueNumber++;
          }
        }
      }
    }

    // After grid initialization, set total words count
    if (positionedWords) {
      setTotalWords(positionedWords.length);
    }

    return grid;
  }, [positionedWords, dimensions]);

  // Generate the crossword when objects are loaded in game mode or on component mount for regular mode
  useEffect(() => {
    if (isGameMode && loading) return; // Wait for objects to load
    if (isGameMode && words.length === 0) return; // Wait for words

    setIsGenerating(true);
    setGenerationError(null);

    // Reset game state when new objects are loaded
    if (isGameMode && !loading) {
      setAllAnswered(false);
      setGameComplete(false);
      setTimeUp(false);
      setIsResetting(false);
      setCompletedQuestions(new Set());
      setIncorrectQuestions(new Set());
      setShowingFeedback(false);
      setCompletedWordIds(new Set());
      setSelectedCell(null);
      setSelectedWordId(null);
    }

    // Generate the crossword layout
    const result = generateCrosswordLayout();

    if (!result) {
      setIsGenerating(false);
      setGenerationError("Failed to generate crossword puzzle");
      return;
    }

    if ("error" in result) {
      setIsGenerating(false);
      setGenerationError(result.error as string);
      return;
    }

    // Successfully generated
    const { positionedWords: generated, dimensions: dims } = result;
    setPositionedWords(generated);
    setDimensions(dims);

    setIsGenerating(false);
  }, [isGameMode, loading, objects]);

  // Initialize the grid once we have positioned words
  useEffect(() => {
    if (positionedWords && positionedWords.length > 0 && dimensions.rows > 0) {
      const grid = initializeGrid();
      setCrosswordGrid(grid);

      // Count total non-empty cells
      let count = 0;
      for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
          if (!grid[row][col].isEmpty) {
            count++;
          }
        }
      }
    }
  }, [positionedWords, dimensions, initializeGrid]);

  // Find the word that contains the cell and matches the direction
  const findWordForCell = (row: number, col: number, direction: Direction) => {
    if (
      !positionedWords ||
      !crosswordGrid.length ||
      crosswordGrid[row][col].isEmpty
    )
      return null;

    return (
      positionedWords.find((word) => {
        if (word.direction !== direction) return false;

        for (let i = 0; i < word.word.length; i++) {
          const wordRow =
            word.direction === "across" ? word.startRow : word.startRow + i;
          const wordCol =
            word.direction === "across" ? word.startCol + i : word.startCol;

          if (wordRow === row && wordCol === col) {
            return true;
          }
        }

        return false;
      }) || null
    );
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (crosswordGrid[row][col].isEmpty) return;

    // Toggle direction if clicking the same cell
    if (selectedCell?.row === row && selectedCell?.col === col) {
      const newDirection = selectedDirection === "across" ? "down" : "across";
      const wordInNewDirection = findWordForCell(row, col, newDirection);

      if (wordInNewDirection) {
        setSelectedDirection(newDirection);
        setSelectedWordId(wordInNewDirection.id);
        highlightWord(wordInNewDirection);
      }
    } else {
      // Select new cell
      setSelectedCell({ row, col });

      // Find word in current direction
      const word = findWordForCell(row, col, selectedDirection);

      if (word) {
        setSelectedWordId(word.id);
        highlightWord(word);
      } else {
        // Try the other direction if the current direction doesn't have a word
        const otherDirection =
          selectedDirection === "across" ? "down" : "across";
        const wordInOtherDirection = findWordForCell(row, col, otherDirection);

        if (wordInOtherDirection) {
          setSelectedDirection(otherDirection);
          setSelectedWordId(wordInOtherDirection.id);
          highlightWord(wordInOtherDirection);
        }
      }
    }

    // Set current cell value in input for mobile devices
    setInputValue(crosswordGrid[row][col].value);

    // Focus the input synchronously (iOS requires synchronous focus within user interaction)
    // Attempt focus for all devices to handle hybrid/tablet scenarios
    if (activeInputRef.current) {
      try {
        activeInputRef.current.focus();
      } catch (error) {
        // Silently fail if focus is not allowed
        console.debug("Focus not allowed:", error);
      }
    }
  };

  // Highlight the cells for the selected word
  const highlightWord = (word: PositionedWord) => {
    const newGrid = crosswordGrid.map((row) =>
      row.map((cell) => ({ ...cell, isSelected: false, isHighlighted: false })),
    );

    for (let i = 0; i < word.word.length; i++) {
      const row =
        word.direction === "across" ? word.startRow : word.startRow + i;
      const col =
        word.direction === "across" ? word.startCol + i : word.startCol;

      if (row < newGrid.length && col < newGrid[0].length) {
        newGrid[row][col].isHighlighted = true;

        if (
          selectedCell &&
          row === selectedCell.row &&
          col === selectedCell.col
        ) {
          newGrid[row][col].isSelected = true;
        }
      }
    }

    setCrosswordGrid(newGrid);
  };

  // Handle clue click
  const handleClueClick = (word: PositionedWord) => {
    setSelectedWordId(word.id);
    setSelectedDirection(word.direction);
    setSelectedCell({ row: word.startRow, col: word.startCol });
    highlightWord(word);

    // Set the input value for the starting cell
    setInputValue(crosswordGrid[word.startRow][word.startCol].value);

    // Focus the input synchronously for mobile devices
    if (activeInputRef.current) {
      try {
        activeInputRef.current.focus();
      } catch (error) {
        console.debug("Focus not allowed:", error);
      }
    }
  };

  // Check if all cells are filled correctly
  const checkCompletion = () => {
    let allFilled = true;
    let correctWordCount = 0;
    const completedWords = new Set<number>();

    // Check if all cells have some value entered
    for (let row = 0; row < crosswordGrid.length; row++) {
      for (let col = 0; col < crosswordGrid[row].length; col++) {
        const cell = crosswordGrid[row][col];
        if (!cell.isEmpty && cell.value === "") {
          allFilled = false;
        }
      }
    }

    // Check each word to see if it's completed correctly
    if (positionedWords) {
      positionedWords.forEach((word) => {
        let isWordCorrect = true;

        // Check all cells for this word
        for (let i = 0; i < word.word.length; i++) {
          const row =
            word.direction === "across" ? word.startRow : word.startRow + i;
          const col =
            word.direction === "across" ? word.startCol + i : word.startCol;

          // If any cell doesn't match the expected letter, the word is incorrect
          if (row < crosswordGrid.length && col < crosswordGrid[0].length) {
            const cell = crosswordGrid[row][col];
            if (cell.value.toUpperCase() !== cell.correctValue) {
              isWordCorrect = false;
              break;
            }
          }
        }

        // If the word is correct, add it to our set of completed words
        if (isWordCorrect) {
          completedWords.add(word.id);
          correctWordCount++;
        }
      });
    }

    setCorrectWords(correctWordCount);

    // Update completed questions for game mode
    if (isGameMode) {
      setCompletedQuestions(new Set(Array.from(completedWords)));
    }

    // Check if all words are completed correctly
    const allWordsCompleted =
      positionedWords && correctWordCount === positionedWords.length;

    // Set allAnswered based on all words being completed correctly
    if (allWordsCompleted && !allAnswered) {
      setAllAnswered(true);
      playSound("success");
    }

    return allFilled; // Return true if all cells have some value
  };

  // Function to mark answers as correct or incorrect
  const markAnswers = (showCorrectAnswers: boolean) => {
    const newGrid = [...crosswordGrid];
    const wordStatus = new Map<number, boolean>(); // Track if each word is correct

    // First pass: Determine which words are correctly completed
    if (positionedWords) {
      positionedWords.forEach((word) => {
        let isWordCorrect = true;

        for (let i = 0; i < word.word.length; i++) {
          const row =
            word.direction === "across" ? word.startRow : word.startRow + i;
          const col =
            word.direction === "across" ? word.startCol + i : word.startCol;

          if (row < newGrid.length && col < newGrid[0].length) {
            const cell = newGrid[row][col];
            if (cell.value.toUpperCase() !== cell.correctValue) {
              isWordCorrect = false;
              break;
            }
          }
        }

        wordStatus.set(word.id, isWordCorrect);
      });
    }

    // Second pass: Update cell status based on word correctness
    for (let row = 0; row < newGrid.length; row++) {
      for (let col = 0; col < newGrid[row].length; col++) {
        const cell = newGrid[row][col];
        if (!cell.isEmpty) {
          // Clear highlighting states first
          cell.isHighlighted = false;
          cell.isSelected = false;

          // Check if the cell is part of any correct words
          let isCellInCorrectWord = false;
          for (const wordId of cell.wordIds) {
            if (wordStatus.get(wordId)) {
              isCellInCorrectWord = true;
              break;
            }
          }

          if (
            cell.value.toUpperCase() === cell.correctValue &&
            isCellInCorrectWord
          ) {
            // Mark as correct
            cell.isCorrect = true;
            cell.isIncorrect = false;
          } else {
            // Mark as incorrect
            cell.isCorrect = false;
            cell.isIncorrect = true;
          }
        }
      }
    }

    setCrosswordGrid(newGrid);
    setShowingFeedback(true);
    setSelectedCell(null);
    setSelectedWordId(null);

    // Update score based on completed words
    let correctWordCount = 0;
    wordStatus.forEach((isCorrect) => {
      if (isCorrect) correctWordCount++;
    });
    setCorrectWords(correctWordCount);
  };

  // Handle input from both keyboard and touch devices
  const handleLetterInput = (letter: string) => {
    if (
      !selectedCell ||
      showingFeedback ||
      isActivityDisabled ||
      (selectedWordId !== null && completedWordIds.has(selectedWordId))
    )
      return;

    const { row, col } = selectedCell;

    // Enter a letter
    const newGrid = crosswordGrid.map((r) => [...r]);
    newGrid[row][col].value = letter.toUpperCase();
    setCrosswordGrid(newGrid);

    // If current word is fully filled, validate it
    const word = positionedWords?.find((w) => w.id === selectedWordId);
    if (word) {
      const allFilled = word.word.split("").every((_, i) => {
        const r =
          word.direction === "across" ? word.startRow : word.startRow + i;
        const c =
          word.direction === "across" ? word.startCol + i : word.startCol;
        return newGrid[r][c].value !== "";
      });
      if (allFilled) {
        const isCorrect = word.word.split("").every((_, i) => {
          const r =
            word.direction === "across" ? word.startRow : word.startRow + i;
          const c =
            word.direction === "across" ? word.startCol + i : word.startCol;
          return (
            newGrid[r][c].value.toUpperCase() === newGrid[r][c].correctValue
          );
        });
        if (isCorrect) {
          playSound("correct");
          // Mark cells correct & disable further edits
          const updated = newGrid.map((r) =>
            r.map((cell) =>
              cell.wordIds.includes(word.id)
                ? { ...cell, isCorrect: true }
                : cell,
            ),
          );
          setCrosswordGrid(updated);
          setCompletedWordIds((prev) => new Set(prev).add(word.id));
          // Check if all words are now completed
          const isComplete = checkCompletion();
        } else {
          playSound("failure");
          // Show red for current word cells only
          const errored = newGrid.map((r) =>
            r.map((cell) =>
              cell.wordIds.includes(word.id) && !cell.isCorrect
                ? { ...cell, isIncorrect: true }
                : cell,
            ),
          );
          setCrosswordGrid(errored);

          setTimeout(() => {
            // Clear only cells that are part of the current incorrect word AND aren't part of completed words
            const cleared = errored.map((r) =>
              r.map((cell) => {
                // Only clear cells that are part of the current word
                if (cell.wordIds.includes(word.id)) {
                  // Check if this cell is part of any completed word
                  const isPartOfCompletedWord = cell.wordIds.some((wordId) =>
                    completedWordIds.has(wordId),
                  );

                  // Only clear and reset cells that aren't part of completed words
                  if (!isPartOfCompletedWord) {
                    return { ...cell, value: "", isIncorrect: false };
                  }
                }
                return cell;
              }),
            );
            setCrosswordGrid(cleared);
            setInputValue("");
          }, 1000);
        }
        return;
      }
    }

    // Move on if word not yet complete
    moveToNextCell();
  };

  // Handle backspace/delete
  const handleBackspace = () => {
    if (
      !selectedCell ||
      showingFeedback ||
      isActivityDisabled ||
      (selectedWordId !== null && completedWordIds.has(selectedWordId))
    )
      return;

    const { row, col } = selectedCell;
    const newGrid = [...crosswordGrid];

    if (newGrid[row][col].value === "") {
      // If current cell is empty, move to previous cell
      moveToPreviousCell();
    } else {
      // Clear current cell
      newGrid[row][col].value = "";
      setCrosswordGrid(newGrid);
      setInputValue("");
    }
  };

  // Modified key handler for desktop keyboards
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      !selectedCell ||
      showingFeedback ||
      isActivityDisabled ||
      (selectedWordId !== null && completedWordIds.has(selectedWordId))
    )
      return;

    if (/^[A-Za-z]$/.test(e.key)) {
      handleLetterInput(e.key);
    } else if (e.key === "Backspace" || e.key === "Delete") {
      handleBackspace();
    } else if (e.key === "ArrowRight") {
      moveInDirection(0, 1);
    } else if (e.key === "ArrowLeft") {
      moveInDirection(0, -1);
    } else if (e.key === "ArrowDown") {
      moveInDirection(1, 0);
    } else if (e.key === "ArrowUp") {
      moveInDirection(-1, 0);
    }
  };

  // Handle touch input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();

    if (newValue.length === 0 && inputValue.length > 0) {
      // Backspace was pressed
      handleBackspace();
    } else if (newValue.length > 0 && /^[A-Z]$/.test(newValue.slice(-1))) {
      // New letter was entered
      const lastChar = newValue.slice(-1);
      handleLetterInput(lastChar);
      setInputValue(lastChar);
    }
  };

  // Handle key down events for mobile keyboards
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      moveToNextCell();
    }
  };

  // Handle input focus for better touch experience
  const handleInputFocus = () => {
    // Ensure the input stays focused for continuous typing
    if (activeInputRef.current && selectedCell) {
      activeInputRef.current.focus();
    }
  };

  // Handle input blur - prevent blur unless activity is disabled
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only allow blur if activity is disabled or showing feedback
    if (selectedCell && !showingFeedback && !isActivityDisabled) {
      e.preventDefault();
      // Refocus synchronously to keep keyboard open
      if (activeInputRef.current) {
        try {
          activeInputRef.current.focus();
        } catch (error) {
          // Silently fail if focus is not allowed
          console.debug("Refocus not allowed:", error);
        }
      }
    }
  };

  // Move to next cell
  const moveToNextCell = () => {
    if (!selectedCell || !selectedWordId || !positionedWords) return;
    // don't move inside a completed word
    if (completedWordIds.has(selectedWordId)) return;

    const { row, col } = selectedCell;
    const selectedWord = positionedWords.find((w) => w.id === selectedWordId);
    if (!selectedWord) return;

    let nextRow = row,
      nextCol = col;
    if (selectedWord.direction === "across") nextCol++;
    else nextRow++;

    // skip into bounds & non-empty only if not part of a completed word
    if (
      nextRow < crosswordGrid.length &&
      nextCol < crosswordGrid[0].length &&
      !crosswordGrid[nextRow][nextCol].isEmpty
    ) {
      if (
        crosswordGrid[nextRow][nextCol].wordIds.some((id) =>
          completedWordIds.has(id),
        )
      )
        return;

      // Check if next cell is valid
      if (
        nextRow < crosswordGrid.length &&
        nextCol < crosswordGrid[0].length &&
        !crosswordGrid[nextRow][nextCol].isEmpty
      ) {
        // Check if the next cell is part of the current word
        const isPartOfWord = positionedWords.some(
          (word) =>
            word.id === selectedWordId &&
            ((word.direction === "across" &&
              nextRow === word.startRow &&
              nextCol >= word.startCol &&
              nextCol < word.startCol + word.word.length) ||
              (word.direction === "down" &&
                nextCol === word.startCol &&
                nextRow >= word.startRow &&
                nextRow < word.startRow + word.word.length)),
        );

        if (isPartOfWord) {
          setSelectedCell({ row: nextRow, col: nextCol });

          const newGrid = [...crosswordGrid];
          for (let r = 0; r < newGrid.length; r++) {
            for (let c = 0; c < newGrid[r].length; c++) {
              newGrid[r][c].isSelected = r === nextRow && c === nextCol;
            }
          }
          setCrosswordGrid(newGrid);
        }
      }
    }
  };

  // Move to previous cell
  const moveToPreviousCell = () => {
    if (!selectedCell || !selectedWordId || !positionedWords) return;
    // don't move inside a completed word
    if (completedWordIds.has(selectedWordId)) return;

    const { row, col } = selectedCell;
    const selectedWord = positionedWords.find((w) => w.id === selectedWordId);
    if (!selectedWord) return;

    let prevRow = row,
      prevCol = col;
    if (selectedWord.direction === "across") prevCol--;
    else prevRow--;

    if (
      prevRow >= 0 &&
      prevCol >= 0 &&
      !crosswordGrid[prevRow][prevCol].isEmpty
    ) {
      if (
        crosswordGrid[prevRow][prevCol].wordIds.some((id) =>
          completedWordIds.has(id),
        )
      )
        return;

      // Check if the previous cell is part of the current word
      const isPartOfWord = positionedWords.some(
        (word) =>
          word.id === selectedWordId &&
          ((word.direction === "across" &&
            prevRow === word.startRow &&
            prevCol >= word.startCol &&
            prevCol < word.startCol + word.word.length) ||
            (word.direction === "down" &&
              prevCol === word.startCol &&
              prevRow >= word.startRow &&
              prevRow < word.startRow + word.word.length)),
      );

      if (isPartOfWord) {
        setSelectedCell({ row: prevRow, col: prevCol });

        const newGrid = [...crosswordGrid];
        for (let r = 0; r < newGrid.length; r++) {
          for (let c = 0; c < newGrid[r].length; c++) {
            newGrid[r][c].isSelected = r === prevRow && c === prevCol;
          }
        }
        setCrosswordGrid(newGrid);
      }
    }
  };

  // Move in a specified direction
  const moveInDirection = (rowDelta: number, colDelta: number) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;
    const newRow = row + rowDelta,
      newCol = col + colDelta;

    // Check if the new position is valid
    if (
      newRow >= 0 &&
      newRow < crosswordGrid.length &&
      newCol >= 0 &&
      newCol < crosswordGrid[0].length &&
      !crosswordGrid[newRow][newCol].isEmpty
    ) {
      // skip into any completed-word cell
      if (
        crosswordGrid[newRow][newCol].wordIds.some((id) =>
          completedWordIds.has(id),
        )
      )
        return;

      setSelectedCell({ row: newRow, col: newCol });

      // Update direction if moving horizontally or vertically
      if (colDelta !== 0 && rowDelta === 0) {
        const acrossWord = findWordForCell(newRow, newCol, "across");
        if (acrossWord) {
          setSelectedDirection("across");
          setSelectedWordId(acrossWord.id);
          highlightWord(acrossWord);
        }
      } else if (rowDelta !== 0 && colDelta === 0) {
        const downWord = findWordForCell(newRow, newCol, "down");
        if (downWord) {
          setSelectedDirection("down");
          setSelectedWordId(downWord.id);
          highlightWord(downWord);
        }
      }
    }
  };

  // Reset the crossword
  const resetCrossword = () => {
    if (positionedWords && dimensions.rows > 0) {
      const newGrid = initializeGrid();
      setCrosswordGrid(newGrid);
      setSelectedCell(null);
      setSelectedDirection("across");
      setCompletedWordIds(new Set());
      setSelectedWordId(null);
      setAllAnswered(false);
      setShowingFeedback(false);
      setCompletedQuestions(new Set());
      setIncorrectQuestions(new Set());
    }
  };

  // Handle game time up
  const handleGameTimeUp = () => {
    if (!allAnswered && !timeUp) {
      setTimeUp(true);
      setAllAnswered(true);
      playSound("failure");
    }
  };

  // Handle game completion from timer
  const handleGameComplete = (stats: GameStats) => {
    if (!allAnswered && !timeUp) {
      setAllAnswered(true);
    }
  };

  // Handle reset after completion dialog
  const handleReset = () => {
    // Prevent any race conditions by setting resetting state first
    setIsResetting(true);
    setAllAnswered(false);
    setGameComplete(true); // Show results component

    // Clear resetting flag after a brief delay
    setTimeout(() => {
      setIsResetting(false);
    }, 50);
  };

  // Handle play again
  const handlePlayAgain = () => {
    // Set resetting flag first to prevent completion checks
    setIsResetting(true);

    // Reset game state immediately for both modes to prevent dialog re-triggering
    setAllAnswered(false);
    setGameComplete(false);
    setTimeUp(false);
    setShowingFeedback(false);
    setCompletedWordIds(new Set());
    setCompletedQuestions(new Set());
    setIncorrectQuestions(new Set());
    setSelectedCell(null);
    setSelectedWordId(null);

    if (isGameMode) {
      // Track completed objects before fetching new ones
      const newCompletedIds = objects.map((obj) => obj.id);
      const updatedCompletedIds = [
        ...new Set([...completedObjectIds, ...newCompletedIds]),
      ];
      setCompletedObjectIds(updatedCompletedIds);

      // For game mode, fetch new objects excluding completed ones
      refetch(updatedCompletedIds);
    } else {
      // For regular mode, regenerate with existing words
      const result = generateCrosswordLayout();
      if (result && !("error" in result)) {
        const { positionedWords: generated, dimensions: dims } = result;
        setPositionedWords(generated);
        setDimensions(dims);
      }
    }

    // Clear resetting flag after a brief delay to ensure state has settled
    setTimeout(() => {
      setIsResetting(false);
    }, 100);
  };

  // Group words by direction once we have them positioned with clue numbers
  const acrossWords = positionedWords
    ? positionedWords
        .filter((word) => word.direction === "across")
        .sort((a, b) => (a.clueNumber || 0) - (b.clueNumber || 0))
    : [];

  const downWords = positionedWords
    ? positionedWords
        .filter((word) => word.direction === "down")
        .sort((a, b) => (a.clueNumber || 0) - (b.clueNumber || 0))
    : [];

  // Show loading state for game mode
  if (isGameMode && loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">Loading objects...</h1>
      </div>
    );
  }

  // Show error state for game mode
  if (isGameMode && error) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4 text-red-700">
          Error loading objects: {error}
        </h1>
      </div>
    );
  }

  // Show message if no objects found in game mode
  if (isGameMode && !loading && words.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">
          No objects found for the specified criteria
        </h1>
      </div>
    );
  }

  // Render based on state
  if (isGenerating) {
    return (
      <div className="flex flex-col h-full">
        <ActivityTitle title={title} />
        <div className="flex items-center justify-center h-full">
          <h2 className="text-xl">Generating crossword puzzle...</h2>
        </div>
      </div>
    );
  }

  if (generationError) {
    return (
      <div className="flex flex-col h-full">
        <ActivityTitle title={title} />
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md p-6 bg-red-50 rounded-lg border border-red-200">
            <h2 className="text-xl text-red-600 mb-2">
              Crossword Generation Error
            </h2>
            <p className="text-red-500">{generationError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!positionedWords || !crosswordGrid.length) {
    return (
      <div className="flex flex-col h-full">
        <ActivityTitle title={title} />
        <div className="flex items-center justify-center h-full">
          <h2 className="text-xl">
            No words available for crossword generation.
          </h2>
        </div>
      </div>
    );
  }

  return (
    <GameModeWrapper
      isGameMode={isGameMode || false}
      totalQuestions={words.length}
      completedQuestions={completedQuestions}
      incorrectQuestions={incorrectQuestions}
      totalTimeLimit={gameTimeLimit}
      onTimeUp={handleGameTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={isGameMode || false}
      showProgress={isGameMode || false}
      className="h-full"
    >
      <div className="flex flex-col h-full">
        <ActivityTitle title={title} />

        <div className="flex flex-col 2xl:flex-row justify-center gap-6 md:p-4">
          {/* Crossword Grid */}
          <div className="relative flex-1">
            {/* Hidden input for mobile/touch devices - always render for hybrid devices */}
            {selectedCell && (
              <input
                ref={activeInputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="absolute left-0 top-0 w-px h-px opacity-0 z-50"
                style={{
                  fontSize: "16px", // Prevents zoom on iOS
                  pointerEvents: "none",
                  position: "absolute",
                  left: "0",
                  top: "0",
                }}
                inputMode="text"
                enterKeyHint="next"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                spellCheck={false}
                tabIndex={-1}
                readOnly={false}
                disabled={isActivityDisabled}
                aria-label="Crossword input"
                aria-hidden="true"
              />
            )}

            {/* Touch device indicator */}
            {isTouchDevice && selectedCell && (
              <div className="absolute -top-8 left-0 right-0 text-center">
                <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow">
                  Tap to type • Press Enter to move to next cell
                </span>
              </div>
            )}

            <div
              tabIndex={0}
              onKeyDown={handleKeyPress}
              className="mx-auto w-fit"
              style={{
                display: "grid",
                gridTemplateRows: `repeat(${dimensions.rows}, ${
                  width > 768 ? 48 : 25
                }px)`,
                gridTemplateColumns: `repeat(${dimensions.cols}, ${
                  width > 768 ? 48 : 25
                }px)`,
              }}
            >
              {crosswordGrid.map((row, rowIdx) =>
                row.map((cell, colIdx) => (
                  <motion.div
                    key={`${rowIdx}-${colIdx}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.2,
                      delay: (rowIdx + colIdx) * 0.02,
                    }}
                    className={cn(
                      "relative flex items-center justify-center border border-picton-blue-300/70 touch-manipulation select-none",
                      {
                        "bg-picton-blue-200/70": cell.isEmpty,
                        "bg-white":
                          !cell.isEmpty && !cell.isCorrect && !cell.isIncorrect,
                        "cursor-pointer active:scale-95 transition-transform duration-100":
                          !cell.isEmpty &&
                          !showingFeedback &&
                          !isActivityDisabled,
                        "!bg-lemon-400 ring-2 ring-lemon-500 ring-offset-1":
                          selectedCell?.row === rowIdx &&
                          selectedCell?.col === colIdx,

                        "bg-lemon-100": cell.isHighlighted,
                        // Applied when user types, before feedback
                        "text-lemon-700 bg-lemon-200":
                          cell.value &&
                          !cell.isEmpty &&
                          !cell.isCorrect &&
                          !cell.isIncorrect,
                        // Feedback styling
                        "!bg-green-100 !border-green-500 text-green-700":
                          cell.isCorrect,
                        "!bg-red-100 !border-red-500 text-red-800":
                          cell.isIncorrect,
                        "cursor-not-allowed": isActivityDisabled,
                      },
                    )}
                    onClick={() =>
                      !cell.isEmpty &&
                      !showingFeedback &&
                      !isActivityDisabled &&
                      handleCellClick(rowIdx, colIdx)
                    }
                  >
                    {!cell.isEmpty && (
                      <>
                        {cell.clueNumber !== undefined && (
                          <span className="absolute text-xs top-0.5 left-1 opacity-70 z-10">
                            {cell.clueNumber}
                          </span>
                        )}

                        {/* Cell Value Display Logic */}
                        {showingFeedback && cell.isIncorrect ? (
                          // Case 1: Showing feedback and the cell is marked incorrect
                          <div className="flex flex-col items-center justify-center w-full h-full leading-tight text-center">
                            {cell.value !== "" && ( // If the user entered a value
                              <span className="text-base line-through opacity-80">
                                {" "}
                                {/* User's incorrect input, inherits text-red-800 */}
                                {cell.value}
                              </span>
                            )}
                            {/* Always show the correct value for an incorrect cell */}
                            <span
                              className={`text-lg font-semibold ${
                                cell.value !== ""
                                  ? "text-green-600"
                                  : "text-red-700"
                              }`}
                            >
                              {/* If user input was empty, show correct value in red (indicating missing) */}
                              {/* If user input was wrong, show correct value in green (contrasting the struck-out red) */}
                              {cell.correctValue}
                            </span>
                          </div>
                        ) : (
                          // Case 2 & 3:
                          // - Showing feedback and the cell is marked correct (inherits text-green-800)
                          // - Not showing feedback (user is actively playing - inherits text-lemon-700 if filled, else default)
                          <span className="text-xl font-bold">
                            {cell.value}
                          </span>
                        )}
                      </>
                    )}
                  </motion.div>
                )),
              )}
            </div>
          </div>

          {/* Clues */}
          <div className="flex flex-col flex-1 sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Across Clues */}
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">ACROSS</h3>
              <div className="space-y-2">
                {acrossWords.map((word) => (
                  <motion.div
                    key={`across-${word.id}`}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn("p-2 rounded", {
                      "bg-picton-blue-200":
                        selectedWordId === word.id &&
                        selectedDirection === "across",
                      "hover:bg-picton-blue-200/50": !(
                        selectedWordId === word.id &&
                        selectedDirection === "across"
                      ),
                      "cursor-pointer": !showingFeedback && !isActivityDisabled,
                      "opacity-70": showingFeedback || isActivityDisabled,
                    })}
                    onClick={() =>
                      !showingFeedback &&
                      !isActivityDisabled &&
                      handleClueClick(word)
                    }
                  >
                    <span className="font-bold">{word.clueNumber}.</span>{" "}
                    {isImageMode && word.imageUrl ? (
                      <img
                        src={word.imageUrl}
                        alt={word.clue}
                        className="rounded-lg h-40 border border-gray-200"
                      />
                    ) : (
                      word.clue
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Down Clues */}
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">DOWN</h3>
              <div className="space-y-2">
                {downWords.map((word) => (
                  <motion.div
                    key={`down-${word.id}`}
                    initial={{ x: 10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn("p-2 rounded", {
                      "bg-picton-blue-200":
                        selectedWordId === word.id &&
                        selectedDirection === "down",
                      "hover:bg-picton-blue-200/50": !(
                        selectedWordId === word.id &&
                        selectedDirection === "down"
                      ),
                      "cursor-pointer": !showingFeedback && !isActivityDisabled,
                      "opacity-70": showingFeedback || isActivityDisabled,
                    })}
                    onClick={() =>
                      !showingFeedback &&
                      !isActivityDisabled &&
                      handleClueClick(word)
                    }
                  >
                    <span className="font-bold">{word.clueNumber}.</span>{" "}
                    {isImageMode && word.imageUrl ? (
                      <img
                        src={word.imageUrl}
                        alt={word.clue}
                        className="rounded-lg h-40 border border-gray-200"
                      />
                    ) : (
                      word.clue
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Show action buttons when feedback is displayed */}
        {showingFeedback && (
          <ActivityResults
            score={correctWords}
            total={totalWords}
            onRestart={resetCrossword}
          />
        )}

        {/* Results Component - shown after completion dialog is closed */}
        {gameComplete && (
          <div className="bg-picton-blue-50 p-4">
            <ActivityResults
              score={correctWords}
              total={totalWords}
              onRestart={handlePlayAgain}
            />
          </div>
        )}

        <ActivityResultsAlertDialog
          score={timeUp ? 0 : correctWords}
          total={totalWords}
          open={allAnswered && !isResetting}
          onOpenChange={(open) => {
            if (!open) {
              if (isGameMode) {
                handleReset();
              } else if (feedback === "wrong-correct-answers") {
                // Show which answers are right and wrong, and reveal correct answers
                markAnswers(true);
              } else if (feedback === "wrong-correct") {
                // Show which answers are right and wrong only
                markAnswers(false);
              } else {
                // Default behavior: reset the puzzle
                resetCrossword();
              }
              if (!isGameMode) {
                setAllAnswered(false);
              }
            }
          }}
          completionMessage={
            timeUp
              ? "⏰ Time's up! Don't worry, you can try again with new words. Keep practicing to improve your crossword skills!"
              : "Great job! You completed the crossword!"
          }
        />
      </div>
    </GameModeWrapper>
  );
};

export default CrosswordPuzzle;
