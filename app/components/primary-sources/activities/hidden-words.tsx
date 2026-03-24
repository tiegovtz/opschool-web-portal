"use client";

import { Check } from "lucide-react";
import React, { useState, useEffect } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { useObjects } from "@/hooks/useObjects";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type HiddenWordsActivityProps = {
  questions: {
    title: string;
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number; // Total time for all questions in seconds
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

// Color palette for found words - ensuring good contrast and distinctiveness
const WORD_COLORS = [
  { bg: "bg-stone-200", text: "text-stone-800", hover: "hover:bg-stone-300" },
  { bg: "bg-blue-200", text: "text-blue-800", hover: "hover:bg-blue-300" },
  { bg: "bg-green-200", text: "text-green-800", hover: "hover:bg-green-300" },
  {
    bg: "bg-purple-200",
    text: "text-purple-800",
    hover: "hover:bg-purple-300",
  },
  {
    bg: "bg-orange-200",
    text: "text-orange-800",
    hover: "hover:bg-orange-300",
  },
  { bg: "bg-pink-200", text: "text-pink-800", hover: "hover:bg-pink-300" },
  { bg: "bg-teal-200", text: "text-teal-800", hover: "hover:bg-teal-300" },
  {
    bg: "bg-indigo-200",
    text: "text-indigo-800",
    hover: "hover:bg-indigo-300",
  },
  { bg: "bg-cyan-200", text: "text-cyan-800", hover: "hover:bg-cyan-300" },
  {
    bg: "bg-emerald-200",
    text: "text-emerald-800",
    hover: "hover:bg-emerald-300",
  },
  { bg: "bg-lime-200", text: "text-lime-800", hover: "hover:bg-lime-300" },
  { bg: "bg-amber-200", text: "text-amber-800", hover: "hover:bg-amber-300" },
];

const HiddenWordsActivity = ({
  questions: {
    title,
    isGameMode,
    type,
    gameTimeLimit,
    words: providedWords,
    forChildren,
  },
}: HiddenWordsActivityProps) => {
  // State to track completed objects for replay functionality
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  // Fetch objects for game mode
  const { objects, loading, error, refetch } = useObjects({
    type: isGameMode ? type || null : null,
    words: 1,
    limit: 9,
  });

  // Use fetched objects if in game mode, otherwise use provided words
  const gameWords = isGameMode
    ? objects.map((obj) => obj.name.toLowerCase())
    : providedWords;

  const [grid, setGrid] = useState<string[][]>([]);
  const [selectedCells, setSelectedCells] = useState<Cell[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [allAnswered, setAllAnswered] = useState<boolean>(false);
  const [wordPlacements, setWordPlacements] = useState<WordPlacement[]>([]);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [timeUp, setTimeUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [incorrectWords, setIncorrectWords] = useState<Set<number>>(new Set());
  const [wordColors, setWordColors] = useState<
    Map<string, (typeof WORD_COLORS)[0]>
  >(new Map());

  const { playSound } = useSoundEffects();

  // Check if activity is disabled (completed or timed out)
  const isActivityDisabled = allAnswered || timeUp || gameComplete;

  // Get next available color for a word
  const getNextAvailableColor = (): (typeof WORD_COLORS)[0] => {
    const usedColors = Array.from(wordColors.values());
    const availableColors = WORD_COLORS.filter(
      (color) =>
        !usedColors.some(
          (usedColor) =>
            usedColor.bg === color.bg && usedColor.text === color.text,
        ),
    );

    // If all colors are used, cycle back to the beginning
    if (availableColors.length === 0) {
      return WORD_COLORS[wordColors.size % WORD_COLORS.length];
    }

    // Return a random available color
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  };

  // Generate random letter
  const randomLetter = (): string =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26));

  // Create empty grid
  const createEmptyGrid = (): string[][] => {
    return Array(forChildren ? FOR_CHILDREN_GRID_SIZE.rows : GRID_SIZE.rows)
      .fill(null)
      .map(() =>
        Array(forChildren ? FOR_CHILDREN_GRID_SIZE.cols : GRID_SIZE.cols).fill(
          null,
        ),
      );
  };

  // Check if word can be placed at position
  const canPlaceWord = (
    grid: string[][],
    word: string,
    row: number,
    col: number,
    isHorizontal: boolean,
  ): boolean => {
    if (isHorizontal) {
      if (
        col + word.length >
        (forChildren ? FOR_CHILDREN_GRID_SIZE.cols : GRID_SIZE.cols)
      )
        return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[row][col + i] !== null && grid[row][col + i] !== word[i]) {
          return false;
        }
      }
    } else {
      if (
        row + word.length >
        (forChildren ? FOR_CHILDREN_GRID_SIZE.rows : GRID_SIZE.rows)
      )
        return false;
      for (let i = 0; i < word.length; i++) {
        if (grid[row + i][col] !== null && grid[row + i][col] !== word[i]) {
          return false;
        }
      }
    }
    return true;
  };

  // Place word in grid and return the cells it occupies
  const placeWord = (grid: string[][], word: string): WordPlacement | null => {
    const isHorizontal = Math.random() > 0.5;
    const positions: Cell[] = [];

    // Generate all possible positions
    for (
      let row = 0;
      row < (forChildren ? FOR_CHILDREN_GRID_SIZE.rows : GRID_SIZE.rows);
      row++
    ) {
      for (
        let col = 0;
        col < (forChildren ? FOR_CHILDREN_GRID_SIZE.cols : GRID_SIZE.cols);
        col++
      ) {
        if (canPlaceWord(grid, word, row, col, isHorizontal)) {
          positions.push({ row, col });
        }
      }
    }

    if (positions.length === 0) return null;

    // Choose random position from available positions
    const { row, col } =
      positions[Math.floor(Math.random() * positions.length)];

    const cells: Cell[] = [];

    // Place the word
    if (isHorizontal) {
      for (let i = 0; i < word.length; i++) {
        grid[row][col + i] = word[i];
        cells.push({ row, col: col + i });
      }
    } else {
      for (let i = 0; i < word.length; i++) {
        grid[row + i][col] = word[i];
        cells.push({ row: row + i, col });
      }
    }

    return { word, cells };
  };

  // Fill remaining empty cells with random letters
  const fillEmptyCells = (grid: string[][]): string[][] => {
    for (
      let row = 0;
      row < (forChildren ? FOR_CHILDREN_GRID_SIZE.rows : GRID_SIZE.rows);
      row++
    ) {
      for (
        let col = 0;
        col < (forChildren ? FOR_CHILDREN_GRID_SIZE.cols : GRID_SIZE.cols);
        col++
      ) {
        if (grid[row][col] === null) {
          grid[row][col] = randomLetter();
        }
      }
    }
    return grid;
  };

  // Initialize or shuffle grid
  const initializeGrid = (): void => {
    if (gameWords.length === 0) return;

    let attempts = 0;
    let success = false;

    while (attempts < 100 && !success) {
      let newGrid = createEmptyGrid();
      success = true;
      const newWordPlacements: WordPlacement[] = [];

      // Sort words by length (longest first) to make placement easier
      const sortedWords = [...gameWords].sort((a, b) => b.length - a.length);

      for (const word of sortedWords) {
        const placement = placeWord(newGrid, word);
        if (!placement) {
          success = false;
          break;
        }
        newWordPlacements.push(placement);
      }

      if (success) {
        newGrid = fillEmptyCells(newGrid);
        setGrid(newGrid);
        setWordPlacements(newWordPlacements);
        setFoundWords([]);
        setWordColors(new Map());
        return;
      }

      attempts++;
    }

    alert("Failed to place all words after 100 attempts");
  };

  // Update grid when objects are loaded in game mode
  useEffect(() => {
    if (isGameMode && !loading && gameWords.length > 0) {
      // Reset game state when new objects are loaded
      setFoundWords([]);
      setAllAnswered(false);
      setGameComplete(false);
      setTimeUp(false);
      setIsResetting(false);
      setCompletedWords(new Set());
      setIncorrectWords(new Set());
      setSelectedCells([]);
      setWordColors(new Map());

      initializeGrid();
    } else if (!isGameMode && gameWords.length > 0) {
      initializeGrid();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameMode, loading, objects, gameWords.length]);

  useEffect(() => {
    if (
      foundWords.length === gameWords.length &&
      gameWords.length > 0 &&
      !allAnswered
    ) {
      setAllAnswered(true);

      // Update completed words for game mode
      if (isGameMode) {
        const completedSet = new Set<number>();
        gameWords.forEach((_, index) => completedSet.add(index));
        setCompletedWords(completedSet);
      }
    }
  }, [foundWords]);

  // Check if the selected cells form any word from the list
  const checkForWord = (cells: Cell[]): string | null => {
    if (cells.length < 2) return null;

    // For each word placement
    for (const { word, cells: wordCells } of wordPlacements) {
      // Skip if already found
      if (foundWords.includes(word)) continue;

      // Check if selected cells match this word (regardless of order)
      if (cells.length === wordCells.length) {
        // Check if every selected cell is in this word's cells
        const allCellsMatch = cells.every((selectedCell) =>
          wordCells.some(
            (wordCell) =>
              wordCell.row === selectedCell.row &&
              wordCell.col === selectedCell.col,
          ),
        );

        if (allCellsMatch) {
          return word;
        }
      }
    }

    return null;
  };

  const handleCellClick = (row: number, col: number): void => {
    const cellIndex = selectedCells.findIndex(
      (cell) => cell.row === row && cell.col === col,
    );

    if (cellIndex === -1) {
      // Cell is not selected, add it
      const newSelectedCells = [...selectedCells, { row, col }];
      setSelectedCells(newSelectedCells);

      // Check if the cells form a valid word
      const foundWord = checkForWord(newSelectedCells);

      if (foundWord) {
        // Assign a color to the newly found word
        const newWordColors = new Map(wordColors);
        if (!newWordColors.has(foundWord)) {
          newWordColors.set(foundWord, getNextAvailableColor());
          setWordColors(newWordColors);
        }

        setFoundWords([...foundWords, foundWord]);
        setSelectedCells([]);
        playSound("correct");
      }
    } else {
      // Cell is already selected, deselect it and all subsequent cells
      setSelectedCells(selectedCells.slice(0, cellIndex));
    }
  };

  // Helper function to check if a cell is part of any found word
  const isCellPartOfFoundWord = (row: number, col: number): boolean => {
    return wordPlacements.some(
      ({ word, cells }) =>
        foundWords.includes(word) &&
        cells.some((cell) => cell.row === row && cell.col === col),
    );
  };

  // Helper function to get the color for a specific cell
  const getCellColor = (
    row: number,
    col: number,
  ): (typeof WORD_COLORS)[0] | null => {
    for (const { word, cells } of wordPlacements) {
      if (
        foundWords.includes(word) &&
        cells.some((cell) => cell.row === row && cell.col === col)
      ) {
        return wordColors.get(word) || null;
      }
    }
    return null;
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
    setFoundWords([]);
    setSelectedCells([]);
    setCompletedWords(new Set());
    setIncorrectWords(new Set());
    setWordColors(new Map());

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
      // For regular mode, reinitialize with existing words
      initializeGrid();
    }

    // Clear resetting flag after a brief delay to ensure state has settled
    setTimeout(() => {
      setIsResetting(false);
    }, 100);
  };

  // Show loading state for game mode
  if (isGameMode && loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <h1 className="text-2xl font-bold mb-4">Loading objects...</h1>
      </div>
    );
  }

  // Show error state for game mode
  if (isGameMode && error) {
    return (
      <div className="flex items-center justify-center flex-1">
        <h1 className="text-2xl font-bold mb-4 text-red-700">
          Error loading objects: {error}
        </h1>
      </div>
    );
  }

  // Show message if no objects found in game mode
  if (isGameMode && !loading && gameWords.length === 0) {
    return (
      <div className="flex items-center justify-center flex-1">
        <h1 className="text-2xl font-bold mb-4">
          No objects found for the specified criteria
        </h1>
      </div>
    );
  }

  return (
    <GameModeWrapper
      isGameMode={isGameMode || false}
      totalQuestions={gameWords.length}
      completedQuestions={completedWords}
      incorrectQuestions={incorrectWords}
      totalTimeLimit={gameTimeLimit}
      onTimeUp={handleGameTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={isGameMode || false}
      showProgress={isGameMode || false}
      className="flex-1"
    >
      <div className="h-full flex flex-col">
        <ActivityTitle title={title} />

        <div className="flex-1 flex flex-col md:flex-row gap-4">
          <div className="p-2 md:p-4 bg-picton-blue-50 rounded md:w-[20%]">
            <h3 className="font-bold mb-2">Hidden Words:</h3>
            <ul
              className={cn("flex flex-row md:flex-col flex-wrap", {
                "text-2xl": forChildren,
                "text-xl": !forChildren,
              })}
            >
              {gameWords.map((word) => {
                const isFoundWord = foundWords.includes(word);
                const wordColor = wordColors.get(word);

                return (
                  <li key={word} className="flex items-center md:mb-1">
                    {isFoundWord ? (
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    ) : null}
                    <span
                      className={cn(
                        "rounded px-2 md:py-1 transition-all duration-200",
                        {
                          "line-through": isFoundWord,
                        },
                        // Apply word color if found
                        isFoundWord && wordColor
                          ? [wordColor.bg, wordColor.text]
                          : "bg-transparent",
                      )}
                    >
                      {word}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-picton-blue-50 p-1 md:p-4 w-full">
            <div className="grid gap-[2px] h-full overflow-auto">
              {grid.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-[2px]">
                  {row.map((cell, colIndex) => {
                    const isSelected = selectedCells.some(
                      (sel) => sel.row === rowIndex && sel.col === colIndex,
                    );
                    const isFound = isCellPartOfFoundWord(rowIndex, colIndex);
                    const cellColor = getCellColor(rowIndex, colIndex);

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        className={cn(
                          "w-10 lg:w-full h-10 lg:h-full flex lg:block items-center lg:items-start justify-center lg:justify-normal text-center rounded text-2xl md:text-3xl p-1 border-2 border-transparent transition-all duration-200",
                          {
                            // Priority: Selected state (highest priority)
                            "bg-picton-blue-300 hover:bg-picton-blue-300 border-picton-blue-500":
                              isSelected,
                            // Default state (lowest priority)
                            "bg-picton-blue-100 hover:bg-picton-blue-200/70":
                              !isSelected && !isFound,
                            // Disabled state
                            "cursor-not-allowed opacity-75": isActivityDisabled,
                            "lg:text-6xl": forChildren,
                          },
                          // Apply dynamic color for found words when not selected
                          isFound && !isSelected && cellColor
                            ? [cellColor.bg, cellColor.text, cellColor.hover]
                            : "",
                        )}
                        onClick={() => {
                          handleCellClick(rowIndex, colIndex);
                        }}
                        disabled={isActivityDisabled}
                      >
                        {cell}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Component - shown after completion dialog is closed */}
        {gameComplete && (
          <div className="bg-picton-blue-50 p-4">
            <ActivityResults
              score={foundWords.length}
              total={gameWords.length}
              onRestart={handlePlayAgain}
            />
          </div>
        )}

        <ActivityResultsAlertDialog
          score={timeUp ? 0 : gameWords.length}
          total={gameWords.length}
          open={allAnswered && !isResetting}
          onOpenChange={(open) => {
            if (!open) {
              handleReset();
            }
          }}
          // isCompletionOnly={!timeUp}
          completionMessage={
            timeUp
              ? "⏰ Time's up! Don't worry, you can try again with new words. Keep practicing to improve your speed!"
              : `Fantastic work! You found all ${gameWords.length} hidden words! Your word-hunting skills are exceptional!`
          }
        />
      </div>
    </GameModeWrapper>
  );
};

export default HiddenWordsActivity;
