"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { useExamContext } from "@/shared/context/exam-context";

// Define types for our data structure
type Question = {
  id: string;
  text: string;
  image?: string;
};

type CellState = {
  rowId: string;
  columnId: string;
  isChecked: boolean;
  correctAnswer: boolean;
};

export type ExamTableCheckBoxesProps = {
  questions: {
    title: string;
    image?: string;
    rowQuestions: Question[];
    columnQuestions: Question[];
    correctAnswers: Record<string, Record<string, boolean>>;
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const ExamTableCheckBoxes = ({
  questions: { rowQuestions, columnQuestions, correctAnswers },
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamTableCheckBoxesProps) => {
  const [cellStates, setCellStates] = useState<CellState[]>([]);

  const { collectAnswers, updateActivityScore } = useExamContext();

  const totalQuestions = rowQuestions.length;

  // Initialize cell states on component mount
  useEffect(() => {
    const cells: CellState[] = [];
    rowQuestions.forEach((row) => {
      columnQuestions.forEach((col) => {
        cells.push({
          rowId: row.id,
          columnId: col.id,
          isChecked: false,
          correctAnswer: correctAnswers[row.id]?.[col.id] || false,
        });
      });
    });
    setCellStates(cells);
  }, [rowQuestions, columnQuestions, correctAnswers]);

  // Calculate score for this activity - based on complete rows being correct
  const calculateScore = () => {
    let score = 0;
    rowQuestions.forEach((row) => {
      const rowCells = cellStates.filter((cell) => cell.rowId === row.id);
      const isRowCorrect = rowCells.every(
        (cell) => cell.isChecked === cell.correctAnswer,
      );
      if (isRowCorrect) {
        score++;
      }
    });

    return { score };
  };

  // Prepare detailed answers for results
  const prepareDetailedAnswers = () => {
    return rowQuestions.map((row, index) => {
      const rowCells = cellStates.filter((cell) => cell.rowId === row.id);
      const isRowCorrect = rowCells.every(
        (cell) => cell.isChecked === cell.correctAnswer,
      );

      // Create user answer representation
      const userAnswerCells = rowCells
        .filter((cell) => cell.isChecked)
        .map((cell) => {
          const column = columnQuestions.find(
            (col) => col.id === cell.columnId,
          );
          return column?.text || "";
        });

      // Create correct answer representation
      const correctAnswerCells = rowCells
        .filter((cell) => cell.correctAnswer)
        .map((cell) => {
          const column = columnQuestions.find(
            (col) => col.id === cell.columnId,
          );
          return column?.text || "";
        });

      return {
        questionId: row.id,
        question: row.text,
        image: row.image || "",
        userAnswer: userAnswerCells.join(", ") || "No answers selected",
        correctAnswer: correctAnswerCells.join(", ") || "No correct answers",
        isCorrect: isRowCorrect,
      };
    });
  };

  // Update exam context whenever answers change
  useEffect(() => {
    if (!collectAnswers || cellStates.length === 0) return;

    const { score } = calculateScore();
    const detailedAnswers = prepareDetailedAnswers();

    updateActivityScore(activityIndex, {
      activityId,
      activityIndex,
      score,
      totalQuestions,
      answers: detailedAnswers,
      // @ts-ignore
      columnQuestions,
    });
  }, [collectAnswers, cellStates]);

  // Update parent component state for visual feedback
  useEffect(() => {
    // Count how many rows have at least one answer
    const rowsWithAnswers = new Set(
      cellStates.filter((cell) => cell.isChecked).map((cell) => cell.rowId),
    );

    onStateUpdate?.(totalQuestions, rowsWithAnswers.size);
  }, [cellStates, totalQuestions]);

  // Handle cell click - toggle check state
  const handleCellClick = (rowId: string, columnId: string) => {
    setCellStates((prev) =>
      prev.map((cell) =>
        cell.rowId === rowId && cell.columnId === columnId
          ? { ...cell, isChecked: !cell.isChecked }
          : cell,
      ),
    );
  };

  // Get cell state by IDs
  const getCellState = (rowId: string, columnId: string) => {
    return cellStates.find(
      (cell) => cell.rowId === rowId && cell.columnId === columnId,
    );
  };

  // Check if a row has any answers
  const hasRowAnswers = (rowId: string) => {
    return cellStates.some((cell) => cell.rowId === rowId && cell.isChecked);
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-b-xl shadow-sm">
      {/* Content container - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Image if provided */}
          {/*{image && (
            <div className="max-w-sm mx-auto">
              <img
                src={image}
                alt="Activity Image"
                className="w-full h-auto rounded-lg shadow-sm"
              />
            </div>
          )}*/}

          {/* Table */}
          <div className="bg-gray-50 rounded-lg overflow-x-auto border">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 bg-picton-blue-500 text-white font-semibold text-center rounded-tl-lg"></th>
                  {columnQuestions.map((column, index) => (
                    <th
                      key={column.id}
                      className={cn(
                        "p-4 bg-picton-blue-500 text-white font-semibold text-center text-lg",
                        {
                          "rounded-tr-lg": index === columnQuestions.length - 1,
                        },
                      )}
                    >
                      {column.text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowQuestions.map((row, rowIndex) => {
                  const hasAnswers = hasRowAnswers(row.id);

                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: rowIndex * 0.1 }}
                      className={cn(
                        "border-b border-gray-200 last:border-b-0",
                        {
                          "bg-picton-blue-50": hasAnswers,
                        },
                      )}
                    >
                      <td
                        className={cn(
                          "bg-picton-blue-100 p-4 text-picton-blue-800 font-medium border-r border-gray-200 flex flex-col items-center gap-2",
                          {
                            "rounded-bl-lg":
                              rowIndex === rowQuestions.length - 1,
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
                        const cellState = getCellState(row.id, column.id);
                        if (!cellState) return null;

                        return (
                          <td
                            key={`${row.id}-${column.id}`}
                            className={cn(
                              "p-4 bg-white min-w-[120px] transition-colors cursor-pointer hover:bg-gray-50",
                              {
                                "rounded-br-lg":
                                  rowIndex === rowQuestions.length - 1 &&
                                  cellIndex === columnQuestions.length - 1,
                                "border-r border-gray-200":
                                  cellIndex !== columnQuestions.length - 1,
                              },
                            )}
                            onClick={() => handleCellClick(row.id, column.id)}
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
                          </td>
                        );
                      })}
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamTableCheckBoxes;
