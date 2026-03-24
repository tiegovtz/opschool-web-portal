import { useState, useEffect } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/inputs/input";
import { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TableCheckBoxFillingProps = {
  questions: {
    title: string;
    fontSize?: string;
    tableTitles: string[];
    questions: {
      title: {
        text: string;
        image?: string;
      };
      question: string[];
      answer: string;
    }[];
  };
  feedback?: FeedbackType;
};

type InputCell = {
  rowIndex: number;
  cellIndex: number;
  value: string;
  correctAnswer: string;
  isCorrect?: boolean;
};

const answerChecker = new AnswerChecker();

const TableCheckBoxFilling = ({
  questions,
  feedback,
}: TableCheckBoxFillingProps) => {
  const { title, tableTitles, questions: questionRows } = questions;
  const [shuffledQuestions, setShuffledQuestions] = useState(questionRows);
  const [inputCells, setInputCells] = useState<InputCell[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);

  const { playSound } = useSoundEffects();

  // Initialize input cells on component mount
  useEffect(() => {
    const cells: InputCell[] = [];
    shuffledQuestions.forEach((row, rowIndex) => {
      row.question.forEach((cell, cellIndex) => {
        if (cell.startsWith("_")) {
          cells.push({
            rowIndex,
            cellIndex,
            value: "",
            correctAnswer: cell.substring(1), // Remove the underscore
          });
        }
      });
    });
    setInputCells(cells);
  }, [shuffledQuestions]);

  // Check if all inputs are filled
  useEffect(() => {
    const allFilled = inputCells.every((cell) => cell.value.trim() !== "");
    setAllAnswered(allFilled);
  }, [inputCells]);

  // Handle input change
  const handleInputChange = (
    rowIndex: number,
    cellIndex: number,
    value: string,
  ) => {
    setInputCells((prev) =>
      prev.map((cell) =>
        cell.rowIndex === rowIndex && cell.cellIndex === cellIndex
          ? { ...cell, value }
          : cell,
      ),
    );
  };

  // Get input cell by position
  const getInputCell = (rowIndex: number, cellIndex: number) => {
    return inputCells.find(
      (cell) => cell.rowIndex === rowIndex && cell.cellIndex === cellIndex,
    );
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    let correctCount = 0;
    const updatedCells = inputCells.map((cell) => {
      const isCorrect = answerChecker.checkAnswer(cell.value, {
        acceptedAnswers: cell.correctAnswer.split("|"),
      }).isCorrect;
      if (isCorrect) correctCount++;
      return { ...cell, isCorrect };
    });

    setInputCells(updatedCells);
    setScore(correctCount);
    playSound("success");
    setResultsDialogOpen(true);
  };

  // Reset the activity
  const resetActivity = () => {
    setShuffledQuestions(questionRows);
    setInputCells((prev) =>
      prev.map((cell) => ({ ...cell, value: "", isCorrect: undefined })),
    );
    setShowResults(false);
    setScore(0);
    setResultsDialogOpen(false);
    setAllAnswered(false);
  };

  // Render cell content
  const renderCellContent = (
    cellContent: string,
    rowIndex: number,
    cellIndex: number,
  ) => {
    if (cellContent.startsWith("_")) {
      const inputCell = getInputCell(rowIndex, cellIndex);
      if (!inputCell) return null;

      return (
        <div className="w-full">
          <Input
            type="text"
            value={inputCell.value}
            onChange={(e) =>
              handleInputChange(rowIndex, cellIndex, e.target.value)
            }
            className={cn(
              "border-none bg-transparent focus-visible:ring-0",
              showResults && {
                "bg-green-200 text-green-600": inputCell.isCorrect,
                "bg-red-100 text-red-600": !inputCell.isCorrect,
              },
            )}
            disabled={showResults}
          />
          <div
            className={cn(
              "border-b border-dashed mt-1",
              showResults
                ? {
                    "border-green-600": inputCell.isCorrect,
                    "border-red-600": !inputCell.isCorrect,
                  }
                : "border-picton-blue-700",
            )}
          />
          {showResults && (
            <p
              className={cn("text-sm mt-1 text-center", {
                "text-green-600": inputCell.isCorrect,
                "text-red-600": !inputCell.isCorrect,
              })}
            >
              {inputCell.isCorrect
                ? "Correct!"
                : feedback === "wrong-correct-answers"
                  ? `Correct: ${inputCell.correctAnswer}`
                  : "Incorrect!"}
            </p>
          )}
        </div>
      );
    }

    return <span className="whitespace-pre-line">{cellContent}</span>;
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={title} />

      <div className="flex flex-col gap-4 h-full">
        {/* Table */}
        <div className="bg-picton-blue-100 rounded-lg p-4 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {tableTitles.map((title, index) => (
                  <th
                    key={index}
                    className={cn(
                      "p-3 bg-picton-blue-200 text-xl text-picton-blue-700 font-semibold text-center",
                      {
                        "rounded-tr-lg": index === tableTitles.length - 1,
                      },
                    )}
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shuffledQuestions.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn({
                    "border-b border-picton-blue-300":
                      rowIndex !== shuffledQuestions.length - 1,
                  })}
                  style={{
                    fontSize: questions.fontSize
                      ? `${questions.fontSize}px`
                      : "20px",
                  }}
                >
                  <td
                    className={cn(
                      "bg-picton-blue-200 p-3 text-picton-blue-700 font-medium text-center",
                      {
                        "rounded-bl-lg":
                          rowIndex === shuffledQuestions.length - 1,
                        "p-10": !row.title.image,
                        "min-w-[200px]": row.title.image,
                      },
                    )}
                  >
                    <div className="flex flex-col gap-2">
                      {row.title.image && (
                        <div className="flex max-w-[210px] max-h-[210px]">
                          <img
                            src={row.title.image}
                            alt={row.title.text || ""}
                            className="w-full h-full max-w-[210px] max-h-[210px] object-contain"
                          />
                        </div>
                      )}
                      <div className="text-lg font-medium">
                        {row.title.text}
                      </div>
                    </div>
                  </td>
                  {row.question.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "p-3 bg-picton-blue-50 min-w-[120px] text-start border-picton-blue-300",
                        {
                          border: !(rowIndex === shuffledQuestions.length - 1),
                          "border-x": rowIndex === shuffledQuestions.length - 1,
                          "rounded-br-lg":
                            rowIndex === shuffledQuestions.length - 1 &&
                            cellIndex === row.question.length - 1,
                        },
                      )}
                    >
                      {renderCellContent(cell, rowIndex, cellIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results */}
        {showResults && (
          <div className="mt-4">
            <ActivityResults
              score={score}
              total={inputCells.length}
              onRestart={resetActivity}
            />
          </div>
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
        total={inputCells.length}
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

export default TableCheckBoxFilling;
