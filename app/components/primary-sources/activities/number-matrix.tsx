import { useState } from "react";
import * as motion from "motion/react-client";

// Local imports
import { cn } from "@/lib/utils";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import CustomInput from "../../../../../tie_open_school_primary_frontend/components/ui/inputs/custom-input";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

interface NumberMatrixQuestion {
  title: string;
  questions: {
    id: number;
    sequence: (number | string)[]; // Can be numbers or patterns like "1/1"
    patternIndices: number[]; // Indices where patterns occur
    correctAnswers: number[]; // Correct answers for the patterns
  }[];
}

interface NumberMatrixActivityProps {
  feedback?: FeedbackType;
  questions: NumberMatrixQuestion;
}

const NumberMatrixActivity = ({
  feedback,
  questions: { title, questions: questionsProp },
}: NumberMatrixActivityProps) => {
  const [questions, setQuestions] =
    useState<NumberMatrixQuestion["questions"]>(questionsProp);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [validations, setValidations] = useState<Record<string, boolean>>({});
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // states for activity results
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);

  const { playSound } = useSoundEffects();

  // Handle input changes
  const handleInputChange = (
    questionId: number,
    patternIndex: number,
    value: string,
  ) => {
    const answerKey = `${questionId}-${patternIndex}`;
    // Only allow numbers and empty strings
    if (value === "" || /^\d+$/.test(value)) {
      setAnswers({
        ...answers,
        [answerKey]: value,
      });
    }
  };

  // Check answers
  const checkAnswers = () => {
    const newValidations: Record<string, boolean> = {};
    let correctCount = 0;

    questions.forEach((question) => {
      question.patternIndices.forEach((patternIndex, index) => {
        const answerKey = `${question.id}-${patternIndex}`;
        const userAnswer = parseInt(answers[answerKey] || "", 10);
        const expectedAnswer = question.correctAnswers[index];
        const isCorrect = !isNaN(userAnswer) && userAnswer === expectedAnswer;

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
    playSound("success");
  };

  // Reset the activity
  const resetActivity = () => {
    setQuestions(questionsProp);
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

  // Count total number of pattern fields for scoring
  const getTotalPatterns = () => {
    return questions.reduce(
      (total, question) => total + question.patternIndices.length,
      0,
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={title} />

      <>
        <div className="rounded-lg overflow-x-auto md:overflow-auto bg-picton-blue-50">
          {questions.map((question) => (
            <div key={question.id} className={` p-1`}>
              <div className="flex items-center gap-2">
                {question.sequence.map((item, index) => {
                  const isPattern = question.patternIndices.includes(index);
                  if (isPattern) {
                    const patternIndexPosition =
                      question.patternIndices.indexOf(index);
                    const correctAnswer =
                      question.correctAnswers[patternIndexPosition];
                    const answerKey = `${question.id}-${index}`;

                    return (
                      <motion.div
                        key={`q${question.id}-pattern-${index}`}
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
                        className="relative w-full flex flex-col items-center justify-center"
                      >
                        {/* <div className="text-center mb-1">{item}</div> */}
                        <CustomInput
                          value={answers[answerKey] || ""}
                          onChange={(e) =>
                            handleInputChange(question.id, index, e)
                          }
                          noBorder
                          className={cn(
                            "min-w-12 md:min-w-20 md:min-h-14 flex items-center justify-center border-2 text-center text-lg font-semibold rounded",
                            {
                              "bg-lemon-200 border-none text-lemon-700":
                                answers[answerKey],
                              "border-picton-blue-300":
                                !showFeedback || feedback === "none",
                              "border-green-500 bg-green-50 text-green-700":
                                validations[answerKey],
                              "border-red-500 bg-red-50 text-red-700":
                                !validations[answerKey] && showFeedback,
                            },
                          )}
                          inputClassName="w-full h-full text-lg border-none !text-xl"
                          isCorrect={
                            showFeedback ? validations[answerKey] : undefined
                          }
                          disabled={showFeedback}
                          correctAnswer={
                            feedback === "wrong-correct-answers"
                              ? correctAnswer
                              : undefined
                          }
                        />
                      </motion.div>
                    );
                  }
                  return (
                    <div
                      key={`q${question.id}-${index}`}
                      className="bg-picton-blue-100 w-full min-w-12 md:min-w-20 min-h-14 flex items-center justify-center text-xl font-semibold rounded"
                    >
                      {item}
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
            className="w-fit ml-auto mt-4"
          >
            Check Answers
          </Button>
        ) : (
          isCompleted && (
            <ActivityResults
              score={score}
              total={getTotalPatterns()}
              onRestart={resetActivity}
            />
          )
        )}
      </>

      <ActivityResultsAlertDialog
        score={score}
        total={getTotalPatterns()}
        open={showResultsDialog}
        onOpenChange={handleResultsDialogClose}
      />
    </div>
  );
};

export default NumberMatrixActivity;
