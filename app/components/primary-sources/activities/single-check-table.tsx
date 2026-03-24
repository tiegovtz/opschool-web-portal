import { motion } from "motion/react";
import { CheckIcon, X } from "lucide-react";
import { useState, useEffect } from "react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type MediaContent = {
  type: "image" | "video";
  url: string;
  alt: string;
};

type TableQuestion = {
  id: number;
  question: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  media?: MediaContent;
  description?: string;
};

type GridAnswer = {
  questionId: number;
  columnIndex: number;
  isChecked: boolean;
  isCorrect?: boolean;
};

type TSingleCheckTableProps = {
  questions: {
    title: string;
    fontSize?: string;
    questionHeader?: string;
    columnHeaders?: string[];
    questions: TableQuestion[];
  };
  feedback?: FeedbackType;
};

const SingleCheckTable = ({
  questions: {
    title,
    fontSize,
    questionHeader,
    columnHeaders,
    questions: originalQuestions,
  },
  feedback,
}: TSingleCheckTableProps) => {
  const [answers, setAnswers] = useState<GridAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [_, setIsComplete] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [questions, setQuestions] = useState<TableQuestion[]>([]);

  const { playSound } = useSoundEffects();

  // Function to shuffle questions
  const shuffleQuestions = () => {
    setQuestions(shuffle([...originalQuestions]));
  };

  // Initialize answers
  useEffect(() => {
    const initialAnswers: GridAnswer[] = [];
    originalQuestions.forEach((question) => {
      question.options.forEach((_, index) => {
        initialAnswers.push({
          questionId: question.id,
          columnIndex: index,
          isChecked: false,
        });
      });
    });
    setAnswers(initialAnswers);
    setQuestions(shuffle([...originalQuestions]));
  }, [originalQuestions]);

  const toggleAnswer = (questionId: number, columnIndex: number) => {
    setAnswers((prev) =>
      prev.map((answer) => {
        if (answer.questionId === questionId) {
          // If this is the column being clicked
          if (answer.columnIndex === columnIndex) {
            return { ...answer, isChecked: !answer.isChecked };
          }
          // Uncheck other columns for the same question
          return { ...answer, isChecked: false };
        }
        return answer;
      }),
    );
    playSound("click");
  };

  // Handle keyboard navigation for accessibility
  const handleKeyDown = (
    e: React.KeyboardEvent,
    questionId: number,
    columnIndex: number,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleAnswer(questionId, columnIndex);
    }
  };

  // Check if all questions have at least one answer
  useEffect(() => {
    const questionAnswered = new Set();
    answers.forEach((answer) => {
      if (answer.isChecked) {
        questionAnswered.add(answer.questionId);
      }
    });
    setIsComplete(questionAnswered.size === questions.length);

    // Automatically check answers when all questions are answered
    if (
      questionAnswered.size === questions.length &&
      questions.length > 0 &&
      !showResults &&
      !allAnswered
    ) {
      checkAnswers();
    }
  }, [answers, questions]);

  const checkAnswers = () => {
    let correctCount = 0;
    const newAnswers = answers.map((answer) => {
      const question = originalQuestions.find(
        (q) => q.id === answer.questionId,
      );
      if (!question) return answer;

      const option = question.options[answer.columnIndex];
      const isCorrect = answer.isChecked && option.isCorrect;

      if (isCorrect) correctCount++;

      return { ...answer, isCorrect };
    });

    setAnswers(newAnswers);
    setScore({ correct: correctCount, total: originalQuestions.length });
    setAllAnswered(true);
    playSound("success");
  };

  const resetActivity = () => {
    setAnswers((prev) =>
      prev.map((answer) => ({
        ...answer,
        isChecked: false,
        isCorrect: undefined,
      })),
    );
    setShowResults(false);
    setShowCorrectAnswers(false);
    setIsComplete(false);
    shuffleQuestions();
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={title} />
      <div className="flex-1 bg-picton-blue-100 p-4 rounded-lg">
        <table
          className="w-full border-collapse"
          style={{
            fontSize: fontSize ? `${fontSize}px` : "20px",
          }}
        >
          <thead>
            <tr className="text-lg">
              <th className="w-1/3 text-start pl-4 py-6 bg-picton-blue-500 text-white rounded-tl-lg border-b border-picton-blue-300">
                {questionHeader || "Question"}
              </th>
              {questions.length > 0 &&
                questions[0].options.map((_, index) => {
                  // Use column headers if available, otherwise use option text
                  const headerText =
                    columnHeaders?.[index] ||
                    (questions[0].options.length > index
                      ? questions[0].options[index].text
                      : `Column ${index + 1}`);

                  return (
                    <th
                      key={index}
                      className={cn(
                        "p-2 bg-picton-blue-500 text-white text-center w-1/6",
                        {
                          "rounded-tr-lg":
                            index === questions[0].options.length - 1,
                        },
                      )}
                    >
                      {headerText}
                    </th>
                  );
                })}
            </tr>
          </thead>
          <tbody>
            {questions.map((question, rowIndex) => (
              <tr key={question.id}>
                <td
                  className={cn("p-4 bg-picton-blue-200 text-picton-blue-700", {
                    "rounded-bl-lg": rowIndex === questions.length - 1,
                    "border-b border-picton-blue-300":
                      rowIndex < questions.length - 1,
                  })}
                >
                  <div className="flex flex-col gap-2">
                    {question.media && question.media.type === "image" && (
                      <div className="flex max-w-[210px] max-h-[210px]">
                        <img
                          src={question.media.url}
                          alt={question.media.alt}
                          className="w-full h-full max-w-[210px] max-h-[210px] object-contain"
                        />
                      </div>
                    )}
                    <div
                      className="font-medium whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: question.question }}
                    />
                  </div>
                </td>
                {question.options.map((option, colIndex) => {
                  const answer = answers.find(
                    (a) =>
                      a.questionId === question.id &&
                      a.columnIndex === colIndex,
                  );

                  return (
                    <td
                      key={colIndex}
                      className={cn("border p-0 cursor-pointer bg-white", {
                        "bg-green-100": showResults && answer?.isCorrect,
                        "bg-red-100":
                          showResults &&
                          answer?.isChecked &&
                          !answer?.isCorrect,
                      })}
                      onClick={() =>
                        !showResults && toggleAnswer(question.id, colIndex)
                      }
                    >
                      <div className="flex items-center justify-center h-12">
                        <div
                          className={cn(
                            "w-8 h-8 rounded border-2 flex items-center justify-center transition-all",
                            answer?.isChecked && !showResults
                              ? "bg-picton-blue-500 border-picton-blue-500"
                              : "bg-white border-gray-300 hover:border-picton-blue-300",
                          )}
                        >
                          {answer?.isChecked && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={cn("mx-auto w-fit text-white", {
                                "text-green-600":
                                  showResults && answer.isCorrect,
                                "text-red-600":
                                  showResults && !answer.isCorrect,
                              })}
                            >
                              {showResults && !answer.isCorrect ? (
                                <X className="w-6 h-6" />
                              ) : (
                                <CheckIcon className="w-6 h-6" />
                              )}
                            </motion.div>
                          )}
                          {showCorrectAnswers &&
                            !answer?.isChecked &&
                            option.isCorrect && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-green-600"
                              >
                                <CheckIcon className="w-6 h-6" />
                              </motion.div>
                            )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {showResults && (
          <div className="mt-4">
            <ActivityResults
              score={score.correct}
              total={score.total}
              onRestart={resetActivity}
            />
          </div>
        )}
      </div>{" "}
      <ActivityResultsAlertDialog
        score={score.correct}
        total={score.total}
        open={allAnswered}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else if (feedback === "wrong-correct") {
              setShowResults(true);
              setAllAnswered(false);
            } else if (feedback === "wrong-correct-answers") {
              setShowResults(true);
              //   setShowCorrectAnswers(true);
              setAllAnswered(false);
            }
          }
        }}
      />
    </div>
  );
};

export default SingleCheckTable;
