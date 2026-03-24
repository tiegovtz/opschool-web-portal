"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import { Input } from "../../../../../tie_open_school_primary_frontend/components/ui/inputs/input";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityType, FeedbackType } from "@/lib/types/activity-types";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TMagicSquareProps = {
  questions: {
    title: string;
    notes: string;
    algorithm: ActivityType;
    questions: {
      id: number;
      grid: string[][]; // NxN grid with numbers or "_" for empty cells (supports 3x3 and 4x4)
      targetSum: number;
      gridSize: number; // Size of the grid (3 or 4)
    }[];
  };
  feedback: FeedbackType;
};

/**
 * Magic Square Component
 * Renders interactive 3x3 grids for magic square completion exercises
 */
const MagicSquare = ({
  questions: { questions, title },
}: TMagicSquareProps) => {
  const [userAnswers, setUserAnswers] = useState<Record<number, string[][]>>(
    {},
  );
  const [showResults, setShowResults] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<number, boolean>>({});
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [isComplete, setIsComplete] = useState(false);

  const { playSound } = useSoundEffects();

  // Initialize user answers with the provided grid structure
  useEffect(() => {
    const initialAnswers: Record<number, string[][]> = {};
    questions.forEach((question) => {
      initialAnswers[question.id] = question.grid.map((row) =>
        row.map((cell) => (cell === "_" ? "" : cell)),
      );
    });
    setUserAnswers(initialAnswers);
  }, [questions]);

  /**
   * Validates if a completed NxN grid is a valid magic square
   * Checks that all rows, columns, and diagonals sum to the target value
   *
   * For a valid magic square:
   * - All N rows must sum to targetSum
   * - All N columns must sum to targetSum
   * - Main diagonal (top-left to bottom-right) must sum to targetSum
   * - Anti-diagonal (top-right to bottom-left) must sum to targetSum
   *
   * @param grid - 2D array of strings representing the filled grid
   * @param targetSum - The target sum that all rows/columns/diagonals should equal
   * @returns true if the grid is a valid magic square, false otherwise
   */
  const isMagicSquare = (grid: string[][], targetSum: number): boolean => {
    // Check if grid is empty or not square
    if (!grid || grid.length === 0 || grid.length !== grid[0]?.length) {
      return false;
    }

    const n = grid.length;

    // Validate all rows
    for (let row = 0; row < n; row++) {
      let rowSum = 0;
      for (let col = 0; col < n; col++) {
        const num = parseInt(grid[row][col], 10);
        if (isNaN(num)) {
          return false;
        }
        rowSum += num;
      }
      if (rowSum !== targetSum) {
        return false;
      }
    }

    // Validate all columns
    for (let col = 0; col < n; col++) {
      let colSum = 0;
      for (let row = 0; row < n; row++) {
        const num = parseInt(grid[row][col], 10);
        colSum += num;
      }
      if (colSum !== targetSum) {
        return false;
      }
    }

    // Validate main diagonal (top-left to bottom-right)
    let mainDiagonalSum = 0;
    for (let i = 0; i < n; i++) {
      const num = parseInt(grid[i][i], 10);
      mainDiagonalSum += num;
    }
    if (mainDiagonalSum !== targetSum) {
      return false;
    }

    // Validate anti-diagonal (top-right to bottom-left)
    let antiDiagonalSum = 0;
    for (let i = 0; i < n; i++) {
      const num = parseInt(grid[i][n - 1 - i], 10);
      antiDiagonalSum += num;
    }
    if (antiDiagonalSum !== targetSum) {
      return false;
    }

    return true;
  };

  /**
   * Handles user input changes in the magic square grid cells
   */
  const handleInputChange = (
    questionId: number,
    row: number,
    col: number,
    value: string,
  ) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId].map((r, rIndex) =>
        rIndex === row ? r.map((c, cIndex) => (cIndex === col ? value : c)) : r,
      ),
    }));
  };

  /**
   * Validates all magic squares and provides feedback to the user
   */
  const handleSubmit = () => {
    const newFeedbacks: Record<number, boolean> = {};
    const newCompletedQuestions = new Set<number>();
    const newIncorrectQuestions = new Set<number>();

    questions.forEach((question) => {
      const userGrid = userAnswers[question.id];
      const isCorrect = isMagicSquare(userGrid, question.targetSum);

      newFeedbacks[question.id] = isCorrect;

      if (isCorrect) {
        newCompletedQuestions.add(question.id);
        // playSound("success");
      } else {
        newIncorrectQuestions.add(question.id);
        // playSound("failure");
      }
    });

    setFeedbacks(newFeedbacks);
    setCompletedQuestions(newCompletedQuestions);
    setIncorrectQuestions(newIncorrectQuestions);
    setShowResults(true);
    setIsComplete(true);
  };

  /**
   * Resets the activity to its initial state
   */
  const handleRestart = () => {
    const initialAnswers: Record<number, string[][]> = {};
    questions.forEach((question) => {
      initialAnswers[question.id] = question.grid.map((row) =>
        row.map((cell) => (cell === "_" ? "" : cell)),
      );
    });
    setUserAnswers(initialAnswers);
    setShowResults(false);
    setFeedbacks({});
    setCompletedQuestions(new Set());
    setIncorrectQuestions(new Set());
    setIsComplete(false);
  };

  const getScore = () => {
    return {
      correct: completedQuestions.size,
      total: questions.length,
    };
  };

  /**
   * Checks if all required cells (marked with "_" in original grid) are filled by the user
   */
  const areAllCellsFilled = () => {
    return questions.every((question) => {
      const originalGrid = question.grid;
      const userGrid = userAnswers[question.id];

      if (!userGrid) return false;

      return originalGrid.every((row, rowIndex) =>
        row.every((cell, colIndex) => {
          if (cell === "_") {
            return userGrid[rowIndex][colIndex] !== "";
          }
          return true;
        }),
      );
    });
  };

  return (
    <div>
      <ActivityTitle title={title} />

      <div className="grid grid-cols-3 gap-4">
        {questions.map((question) => {
          const originalGrid = question.grid;
          const userGrid = userAnswers[question.id] || originalGrid;
          const isQuestionCorrect = feedbacks[question.id];
          // const isQuestionIncorrect = incorrectQuestions.has(question.id);
          const gridSize = question.gridSize || question.grid.length;
          const isQuestionFullyAnswered = userGrid.every((row) =>
            row.every((cell) => cell !== ""),
          );

          return (
            <div
              key={question.id}
              className={cn(
                "p-4 border rounded-lg transition-colors",
                showResults
                  ? isQuestionCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-200 bg-white",
              )}
            >
              <div className="flex items-center justify-between ">
                <div
                  className={cn("w-6 h-6 rounded-full", {
                    "bg-gray-200": !isQuestionFullyAnswered,
                    "bg-picton-blue-500": isQuestionFullyAnswered,
                  })}
                />
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">
                    {question.targetSum}
                  </span>
                  {showResults && (
                    <div className="flex items-center">
                      {isQuestionCorrect ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <div
                  className={cn(
                    "grid gap-1 w-fit border-2 border-neutral-400 p-1 sm:p-2 bg-white rounded-lg",
                    gridSize === 3 ? "grid-cols-3" : "grid-cols-4",
                  )}
                >
                  {userGrid.map((row, rowIndex) =>
                    row.map((cell, colIndex) => {
                      const isOriginalCell =
                        originalGrid[rowIndex][colIndex] !== "_";
                      const cellKey = `${question.id}-${rowIndex}-${colIndex}`;

                      return (
                        <div key={cellKey} className="relative">
                          <Input
                            type="number"
                            value={cell}
                            removeArrows
                            onChange={(e) =>
                              handleInputChange(
                                question.id,
                                rowIndex,
                                colIndex,
                                e.target.value,
                              )
                            }
                            disabled={isOriginalCell || showResults}
                            className={cn(
                              "text-center border-2 rounded-lg font-semibold !text-2xl !opacity-100",
                              gridSize === 3
                                ? "w-12 h-12 sm:w-16 sm:h-16"
                                : "w-10 h-10 sm:w-12 sm:h-12 !px-0",
                              isOriginalCell
                                ? "bg-picton-blue-100 border-none text-picton-blue-700"
                                : showResults
                                  ? isQuestionCorrect
                                    ? "border-green-500 bg-green-50 text-green-800"
                                    : "border-red-500 bg-red-50 text-red-800"
                                  : "border-neutral-400 bg-white focus:border-picton-blue-300 focus:ring-1 focus:ring-picton-blue-300",
                            )}
                          />
                        </div>
                      );
                    }),
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showResults && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!areAllCellsFilled()}
            variant="brand-lemon"
          >
            Check Answers
          </Button>
        </div>
      )}

      {showResults && (
        <ActivityResults
          score={getScore().correct}
          total={getScore().total}
          onRestart={handleRestart}
          className="mt-6"
        />
      )}

      {showResults && (
        <ActivityResultsAlertDialog
          score={getScore().correct}
          total={getScore().total}
          open={isComplete}
          onOpenChange={(open) => {
            if (!open) {
              setIsComplete(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default MagicSquare;
