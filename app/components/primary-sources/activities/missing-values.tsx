import { useState } from "react";
import * as motion from "motion/react-client";

// Local imports
import { shuffle } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CustomInput from "@/components/ui/inputs/custom-input";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { Input } from "@/components/ui/input";

interface SequenceQuestion {
  title: string;
  questions: {
    id: string;
    sequence: (string | null)[];
    blankIndices: number[];
    correctAnswers: string[];
  }[];
}

interface MissingValuesActivityProps {
  feedback?: FeedbackType;
  questions: SequenceQuestion;
}

const MissingValuesActivity = ({
  feedback,
  questions: { title, questions: questionsProp },
}: MissingValuesActivityProps) => {
  const [questions, setQuestions] =
    useState<SequenceQuestion["questions"]>(questionsProp);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validations, setValidations] = useState<Record<string, boolean>>({});
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // states for activity results
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);

  // Handle input changes
  const handleInputChange = (
    questionId: string,
    blankIndex: number,
    value: string
  ) => {
    const answerKey = `${questionId}-${blankIndex}`;
    // Allow any input - letters, numbers, symbols
    setAnswers({
      ...answers,
      [answerKey]: value,
    });
  };

  // Check answers
  const checkAnswers = () => {
    const newValidations: Record<string, boolean> = {};
    let correctCount = 0;

    questions.forEach((question) => {
      question.blankIndices.forEach((blankIndex, index) => {
        const answerKey = `${question.id}-${blankIndex}`;
        const userAnswer = answers[answerKey] || "";
        const expectedAnswer = question.correctAnswers[index];
        // Compare strings directly, case-sensitive
        const isCorrect = userAnswer.trim() === expectedAnswer;

        newValidations[answerKey] = isCorrect;
        if (isCorrect) {
          correctCount++;
        }
      });
    });

    if (feedback !== "none") {
      setShowFeedback(true);
    }

    setValidations(newValidations);
    setScore(correctCount);

    // Show results dialog
    setShowResultsDialog(true);
  };

  // Reset the activity
  const resetActivity = () => {
    setQuestions(shuffle(questionsProp));
    setAnswers({});
    setValidations({});
    setIsCompleted(false);
    setShowFeedback(false);
    setScore(0);
  };

  // Handle closing the results dialog
  const handleResultsDialogClose = (open: boolean) => {
    setShowResultsDialog(open);
    if (!open) {
      if (feedback === "none") {
        // If feedback is "none", reset the activity immediately
        resetActivity();
      } else {
        // Otherwise, mark as completed to show the feedback
        setIsCompleted(true);
      }
    }
  };

  // Get the input class based on feedback type and validation state
  const getInputClass = (answerKey: string) => {
    if (!showFeedback || feedback === "none") {
      return "border-gray-300 focus:border-blue-500 focus:outline-none";
    }

    return validations[answerKey]
      ? "text-green-600 border-green-500 bg-green-50"
      : "text-red-600 border-red-500 bg-red-50";
  };

  // Count total number of blank fields for scoring
  const getTotalBlanks = () => {
    return questions.reduce(
      (total, question) => total + question.blankIndices.length,
      0
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={title} />

      <>
        <div className="space-y-4">
          {questions.map((question, i) => (
            <div
              key={question.id}
              className="flex items-center bg-picton-blue-50 px-2 py-4 md:p-4 rounded-lg"
            >
              <div className="font-bold text-lg mr-1">{i + 1}.</div>
              <div className="flex flex-wrap gap-2 flex-1">
                {question.sequence.map((number, index) => {
                  const isBlank = question.blankIndices.includes(index);
                  if (isBlank) {
                    const blankIndexPosition =
                      question.blankIndices.indexOf(index);
                    const correctAnswer =
                      question.correctAnswers[blankIndexPosition];
                    const answerKey = `${question.id}-${index}`;

                    return (
                      <motion.div
                        key={`q${question.id}-blank-${index}`}
                        initial={{ scale: 1 }}
                        animate={{
                          scale:
                            showFeedback && feedback !== "none"
                              ? validations[answerKey]
                                ? [1, 1.1, 1]
                                : [1, 0.9, 1]
                              : 1,
                          x:
                            showFeedback &&
                            !validations[answerKey] &&
                            feedback !== "none"
                              ? [0, -5, 5, -5, 5, 0]
                              : 0,
                        }}
                        transition={{ duration: 0.5 }}
                        className="relative"
                      >
                        <Input
                          value={answers[answerKey] || ""}
                          onChange={(e) =>
                            handleInputChange(
                              question.id,
                              index,
                              e.target.value
                            )
                          }
                          className={`w-[90px] h-12 border-2 text-center bg-transparent !text-2xl font-semibold rounded ${getInputClass(
                            answerKey
                          )}`}
                          disabled={showFeedback}
                        />
                      </motion.div>
                    );
                  }
                  return (
                    <div
                      key={`q${question.id}-${index}`}
                      className="bg-picton-blue-100 w-20 h-12 flex items-center justify-center text-lg font-semibold rounded"
                    >
                      {number !== null ? number : "_"}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!showFeedback ? (
          <Button
            variant="brand-lemon"
            onClick={checkAnswers}
            className="w-fit mx-auto mt-4"
          >
            Check Answers
          </Button>
        ) : (
          isCompleted && (
            <ActivityResults
              score={score}
              total={getTotalBlanks()}
              onRestart={resetActivity}
            />
          )
        )}
      </>

      <ActivityResultsAlertDialog
        score={score}
        total={getTotalBlanks()}
        open={showResultsDialog}
        onOpenChange={handleResultsDialogClose}
      />
    </div>
  );
};

export default MissingValuesActivity;
