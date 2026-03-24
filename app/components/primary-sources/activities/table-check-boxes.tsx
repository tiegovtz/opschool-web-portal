import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import React, { useState, useEffect } from "react";

// local imports
import { cn } from "@/lib/utils";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

// Define types for our data structure
type Question = {
  id: string;
  text: string;
  image?: string;
};

type GridItem = {
  rowId: string;
  columnId: string;
  answer: boolean | null;
  correct: boolean;
};

type CellState = {
  rowIndex: number;
  cellIndex: number;
  isChecked: boolean;
  correctAnswer: boolean;
  isCorrect?: boolean;
};

type TTableCheckBoxesProps = {
  questions: {
    title: string;
    image?: string;
    rowQuestions: Question[];
    columnQuestions: Question[];
    correctAnswers: Record<string, Record<string, boolean>>;
  };
  feedback?: FeedbackType;
};

const TableCheckBoxesActivity = ({
  questions: { title, rowQuestions, image, columnQuestions, correctAnswers },
  feedback,
}: TTableCheckBoxesProps) => {
  const [cellStates, setCellStates] = useState<CellState[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [rowResults, setRowResults] = useState<boolean[]>([]);

  const { playSound } = useSoundEffects();

  // Initialize cell states on component mount
  useEffect(() => {
    const cells: CellState[] = [];
    rowQuestions.forEach((row, rowIndex) => {
      columnQuestions.forEach((col, cellIndex) => {
        cells.push({
          rowIndex,
          cellIndex,
          isChecked: false,
          correctAnswer: correctAnswers[row.id]?.[col.id] || false,
        });
      });
    });
    setCellStates(cells);
  }, [rowQuestions, columnQuestions, correctAnswers]);

  // Check if all cells have been answered
  useEffect(() => {
    const allAnswered =
      cellStates.length > 0 &&
      cellStates.every((cell) => cell.isChecked !== null);
    setAllAnswered(allAnswered);
  }, [cellStates]);

  // Handle cell click - toggle check state
  const handleCellClick = (rowIndex: number, cellIndex: number) => {
    setCellStates((prev) =>
      prev.map((cell) =>
        cell.rowIndex === rowIndex && cell.cellIndex === cellIndex
          ? { ...cell, isChecked: !cell.isChecked }
          : cell,
      ),
    );
    playSound("click");
  };

  // Get cell state by position
  const getCellState = (rowIndex: number, cellIndex: number) => {
    return cellStates.find(
      (cell) => cell.rowIndex === rowIndex && cell.cellIndex === cellIndex,
    );
  };

  // Check if a row is completely correct
  const isRowCorrect = (rowIndex: number) => {
    const rowCells = cellStates.filter((cell) => cell.rowIndex === rowIndex);
    return rowCells.every((cell) => cell.isChecked === cell.correctAnswer);
  };

  // Check answers and calculate score based on rows
  const checkAnswers = () => {
    const updatedCells = cellStates.map((cell) => {
      const isCorrect = cell.isChecked === cell.correctAnswer;
      return { ...cell, isCorrect };
    });
    setCellStates(updatedCells);

    // Calculate row-based results
    const results = rowQuestions.map((_, rowIndex) => isRowCorrect(rowIndex));
    setRowResults(results);

    // Score is the count of correct rows
    const correctRows = results.filter((result) => result).length;
    setScore(correctRows);

    playSound("success");
    setResultsDialogOpen(true);
  };

  // Reset the activity
  const resetActivity = () => {
    setCellStates((prev) =>
      prev.map((cell) => ({ ...cell, isChecked: false, isCorrect: undefined })),
    );
    setShowResults(false);
    setScore(0);
    setResultsDialogOpen(false);
    setAllAnswered(false);
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={title} />

      <div className="flex flex-col gap-4 h-full">
        {image && (
          <div className="max-w-sm mx-auto">
            <img
              src={image}
              alt="Activity Image"
              className="w-full h-auto rounded-lg"
            />
          </div>
        )}

        {/* Table */}
        <div className="bg-picton-blue-100 rounded-lg overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 bg-picton-blue-500 text-white font-semibold text-center rounded-tl-lg"></th>
                {columnQuestions.map((column, index) => (
                  <th
                    key={column.id}
                    className={cn(
                      "p-3 text-xl bg-picton-blue-500 text-white font-semibold text-center",
                      {
                        "rounded-tr-lg": index === columnQuestions.length - 1,
                      },
                    )}
                  >
                    {column.text}
                  </th>
                ))}
                {showResults && <th className="p-3 w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {rowQuestions.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td
                    className={cn(
                      "bg-picton-blue-200 p-3 text-xl text-picton-blue-700",
                      {
                        "border-b border-picton-blue-300":
                          rowIndex !== rowQuestions.length - 1,
                        "rounded-bl-lg": rowIndex === rowQuestions.length - 1,
                      },
                    )}
                  >
                    {row.image && (
                      <img
                        src={row.image}
                        alt={row.text}
                        className="h-14 md:h-20"
                      />
                    )}
                    <p
                      className="whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: row.text }}
                    />
                  </td>
                  {columnQuestions.map((column, cellIndex) => {
                    const cellState = getCellState(rowIndex, cellIndex);
                    if (!cellState) return null;

                    return (
                      <td
                        key={`${row.id}-${column.id}`}
                        className={cn(
                          "p-3 bg-picton-blue-50 cursor-pointer min-w-[120px] transition-colors border-picton-blue-300",
                          {
                            // "hover:bg-picton-blue-100 cursor-pointer":
                            //   !showResults,
                            "rounded-br-lg":
                              rowIndex === rowQuestions.length - 1 &&
                              cellIndex === columnQuestions.length - 1 &&
                              !showResults,
                            border: !(rowIndex === rowQuestions.length - 1),
                            "border-x": rowIndex === rowQuestions.length - 1,
                            "bg-red-100":
                              showResults && rowResults[rowIndex] === false,
                            "bg-green-100":
                              showResults && rowResults[rowIndex] === true,
                          },
                        )}
                        onClick={() =>
                          !showResults && handleCellClick(rowIndex, cellIndex)
                        }
                      >
                        <div className="flex items-center justify-center h-12">
                          <div
                            className={cn(
                              "w-8 h-8 rounded border-2 flex items-center justify-center transition-all",
                              cellState.isChecked
                                ? "bg-picton-blue-500 border-picton-blue-500"
                                : "bg-white border-gray-300 hover:border-picton-blue-300",
                            )}
                          >
                            {cellState.isChecked && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                                className="text-white"
                              >
                                ✓
                              </motion.div>
                            )}
                          </div>
                        </div>
                        {/*<div className="flex items-center justify-center h-12">
                          {cellState.isChecked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Check className="w-6 h-6 text-picton-blue-600" />
                            </motion.div>
                          )}
                        </div>*/}
                      </td>
                    );
                  })}

                  {/* Result indicator column */}
                  {showResults && (
                    <td
                      className={cn("p-3 text-center w-16", {
                        "rounded-br-lg": rowIndex === rowQuestions.length - 1,
                      })}
                    >
                      {rowResults[rowIndex] ? (
                        <motion.div
                          initial={{ opacity: 0, x: -20, rotateX: -90 }}
                          animate={{ opacity: 1, x: 0, rotateX: 0 }}
                          transition={{
                            delay: 0.3 + rowIndex * 0.1,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="flex justify-center"
                        >
                          <Check size={32} className="text-green-600" />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, x: -20, rotateX: -90 }}
                          animate={{ opacity: 1, x: 0, rotateX: 0 }}
                          transition={{
                            delay: 0.3 + rowIndex * 0.1,
                            duration: 0.5,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="flex justify-center"
                        >
                          <X size={32} className="text-red-600" />
                        </motion.div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results */}
        {showResults && (
          <ActivityResults
            score={score}
            total={rowQuestions.length}
            onRestart={resetActivity}
          />
        )}

        {/* Check Answers Button */}
        {!showResults && (
          <div className="mt-auto flex justify-end">
            <Button
              onClick={checkAnswers}
              disabled={!allAnswered}
              style={{
                opacity: allAnswered ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            >
              Check Answers
            </Button>
          </div>
        )}
      </div>

      {/* Results Dialog */}
      <ActivityResultsAlertDialog
        score={score}
        total={rowQuestions.length}
        open={resultsDialogOpen}
        onOpenChange={(open) => {
          setResultsDialogOpen(open);
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else {
              setShowResults(true);
            }
          }
        }}
      />
    </div>
  );
};

export default TableCheckBoxesActivity;
