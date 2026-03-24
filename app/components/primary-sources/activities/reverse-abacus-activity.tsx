import { X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

interface ReverseAbacusQuestion {
  id: number;
  number: string;
}

interface ReverseAbacusActivityProps {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: ReverseAbacusQuestion[];
  };
}

interface AnswerRecord {
  questionIndex: number;
  question: string;
  isCorrect: boolean;
}

const ReverseAbacusActivity = ({
  feedback,
  questions: questionsData,
}: ReverseAbacusActivityProps) => {
  const [beadCounts, setBeadCounts] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [animatingQuestions, setAnimatingQuestions] = useState(false);

  const { playSound } = useSoundEffects();

  const currentQuestion = questionsData.questions[currentQuestionIndex];
  const totalQuestions = questionsData.questions.length;

  useEffect(() => {
    if (currentQuestion) {
      setupBeadsForQuestion();
    }
  }, [currentQuestion]);

  const setupBeadsForQuestion = () => {
    const digits = currentQuestion.number.split("").reverse();
    const placeValueNames = getExtendedPlaceValueNames(digits.length);

    const initialBeadCounts: Record<string, number> = {};
    placeValueNames.forEach((placeValue) => {
      initialBeadCounts[placeValue] = 0;
    });

    setBeadCounts(initialBeadCounts);
  };

  const getExtendedPlaceValueNames = (numDigits: number): string[] => {
    const baseNames = [
      "Ones",
      "Tens",
      "Hundreds",
      "Thousands",
      "Ten Thousands",
      "Hundred Thousands",
      "Millions",
      "Ten Millions",
      "Hundred Millions",
      "Billions",
      "Ten Billions",
      "Hundred Billions",
      "Trillions",
      "Ten Trillions",
      "Hundred Trillions",
    ];

    if (numDigits > baseNames.length) {
      const result = [...baseNames];
      for (let i = baseNames.length; i < numDigits; i++) {
        const powerOfTen = i;
        if (powerOfTen % 3 === 0) {
          const suffixIndex = Math.floor(powerOfTen / 3);
          const suffixes = [
            "",
            "Thousand",
            "Million",
            "Billion",
            "Trillion",
            "Quadrillion",
            "Quintillion",
          ];
          const suffix =
            suffixIndex < suffixes.length
              ? suffixes[suffixIndex]
              : `10^${powerOfTen}`;
          result.push(suffix);
        } else if (powerOfTen % 3 === 1) {
          result.push(`Ten ${result[i - 1]}`);
        } else {
          result.push(`Hundred ${result[i - 2]}`);
        }
      }
      return result;
    }

    return baseNames.slice(0, numDigits);
  };

  const handleAddBead = (placeValue: string) => {
    const count = beadCounts[placeValue] || 0;

    if (count >= 9) {
      setValidationError("Maximum of 9 beads per column reached");
      setTimeout(() => setValidationError(null), 2000);
      return;
    }

    setBeadCounts((prev) => ({
      ...prev,
      [placeValue]: count + 1,
    }));

    playSound("click");
  };

  const handleRemoveBead = (placeValue: string) => {
    setBeadCounts((prev) => ({
      ...prev,
      [placeValue]: Math.max(0, (prev[placeValue] || 0) - 1),
    }));
  };

  const getPlaceValues = () => {
    const digits = currentQuestion.number.split("").reverse();
    const placeValueNames = getExtendedPlaceValueNames(digits.length);
    return placeValueNames.slice(0, digits.length).reverse();
  };

  const checkAnswers = () => {
    const digits = currentQuestion.number.split("").reverse();
    let isCorrect = true;

    digits.forEach((digit, index) => {
      const placeValueNames = getExtendedPlaceValueNames(digits.length);
      const placeValue = placeValueNames[index];

      const expectedBeads = parseInt(digit);
      const actualBeads = beadCounts[placeValue] || 0;

      if (expectedBeads !== actualBeads) {
        isCorrect = false;
      }
    });

    setAnswerRecords((prev) => [
      ...prev,
      {
        questionIndex: currentQuestionIndex,
        question: currentQuestion.number,
        isCorrect,
      },
    ]);

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
      playSound("success");
    } else {
      playSound("failure");
    }

    if (feedback !== "none") {
      setShowFeedback(true);
    }

    if (currentQuestionIndex === totalQuestions - 1) {
      if (feedback === "none") {
        setTimeout(() => {
          resetActivity();
        }, 500);
      } else {
        setShowResultsDialog(true);
      }
    } else {
      setAnimatingQuestions(true);

      setTimeout(
        () => {
          setCurrentQuestionIndex((prev) => prev + 1);
          setShowFeedback(false);

          setTimeout(() => {
            setAnimatingQuestions(false);
          }, 50);
        },
        feedback === "none" ? 0 : 2000
      );
    }
  };

  const resetActivity = () => {
    setCurrentQuestionIndex(0);
    setBeadCounts({});
    setShowFeedback(false);
    setScore(0);
    setAnswerRecords([]);
    setShowResults(false);
    setupBeadsForQuestion();
  };

  const handleResultsDialogClose = (open: boolean) => {
    setShowResultsDialog(open);
    if (!open) {
      if (feedback === "none") {
        resetActivity();
      } else {
        setShowResults(true);
      }
    }
  };

  const ResultsSummary = () => {
    return (
      <div className="w-full space-y-3">
        {feedback === "wrong-correct-answers"
          ? questionsData.questions.map((question, idx) => {
              const record = answerRecords.find((r) => r.questionIndex === idx);
              const isCorrect = record?.isCorrect || false;

              return (
                <div
                  key={question.id}
                  className={cn(
                    "p-3 rounded-md border flex items-center gap-3",
                    isCorrect
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isCorrect
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {isCorrect ? <Check size={18} /> : <X size={18} />}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">Question {idx + 1}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <span>
                        Number to represent: <strong>{question.number}</strong>
                      </span>
                      {!isCorrect && (
                        <span className="text-red-600">
                          You placed the beads incorrectly.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          : questionsData.questions.map((question, idx) => {
              const record = answerRecords.find((r) => r.questionIndex === idx);
              const isCorrect = record?.isCorrect || false;

              return (
                <div
                  key={question.id}
                  className={cn(
                    "p-3 rounded-md border flex items-center gap-3",
                    isCorrect
                      ? "border-green-300 bg-green-50"
                      : "border-red-300 bg-red-50"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isCorrect
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {isCorrect ? <Check size={18} /> : <X size={18} />}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium">Question {idx + 1}</p>
                    <p className="text-sm mt-1">
                      {isCorrect
                        ? "You got this correct!"
                        : "You got this wrong."}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative">
      <ActivityTitle title={questionsData.title} />

      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-0 left-0 right-0 mx-auto w-fit bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md shadow-md flex items-center gap-2 z-50"
          >
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{validationError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {showResults ? (
        <div className="flex-1 flex flex-col items-center justify-between">
          <ResultsSummary />
          <div className="w-full">
            <ActivityResults
              score={score}
              total={totalQuestions}
              onRestart={resetActivity}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.4,
                }}
                className="flex flex-col items-center w-full"
              >
                <div className="flex items-end justify-center w-full overflow-x-auto pb-4 gap-1">
                  {getPlaceValues().map((placeValue, i) => (
                    <div
                      key={placeValue}
                      className="flex flex-col items-center rounded-lg w-24 flex-shrink-0"
                    >
                      <h3 className="text-sm font-bold text-picton-blue-700 my-4 text-center px-1 leading-tight">
                        {placeValue}
                      </h3>

                      <div
                        id={placeValue}
                        className={cn(
                          "relative w-20 h-[300px] mb-4 border-2 bg-lemon-100 rounded-lg overflow-hidden border-lemon-800/50"
                        )}
                      >
                        <div className="absolute w-2 h-full bg-lemon-900 left-1/2 top-0 transform -translate-x-1/2 rounded-full"></div>

                        {Array.from({
                          length: beadCounts[placeValue] || 0,
                        }).map((_, index) => (
                          <AbacusStackedBead
                            key={`${placeValue}-bead-${index}`}
                            placeValue={placeValue}
                            index={index}
                            totalBeads={beadCounts[placeValue] || 0}
                            disabled={showFeedback || animatingQuestions}
                            onClick={() =>
                              !showFeedback &&
                              !animatingQuestions &&
                              handleRemoveBead(placeValue)
                            }
                          />
                        ))}
                      </div>

                      <div className="mt-2 relative">
                        <AbacusSourceBead
                          placeValue={placeValue}
                          disabled={
                            (beadCounts[placeValue] || 0) >= 9 ||
                            showFeedback ||
                            animatingQuestions
                          }
                          onClick={() => handleAddBead(placeValue)}
                        />

                        {showFeedback && (
                          <div
                            className={cn(
                              "absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-semibold px-2 py-1 rounded",
                              beadCounts[placeValue] ===
                                parseInt(
                                  currentQuestion.number.split("").reverse()[
                                    getPlaceValues().length - 1 - i
                                  ]
                                )
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {beadCounts[placeValue] ===
                            parseInt(
                              currentQuestion.number.split("").reverse()[
                                getPlaceValues().length - 1 - i
                              ]
                            )
                              ? "Correct"
                              : "Wrong"}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-3xl font-bold text-picton-blue-700 px-10 py-2 rounded-lg bg-picton-blue-50 border-2 border-picton-blue-200">
                  {currentQuestion.number}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex items-center justify-between"
          >
            <div className="flex justify-center gap-4">
              {questionsData.questions.map((_, index) => {
                const record = answerRecords.find(
                  (r) => r.questionIndex === index
                );
                const isAnswered = record !== undefined;
                const isCorrect = record?.isCorrect || false;

                return (
                  <div
                    key={index}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-picton-blue-200",
                      {
                        "bg-lemon-200": isAnswered,
                        "border-2 border-picton-blue-500":
                          index === currentQuestionIndex && !isAnswered,
                      }
                    )}
                  >
                    {isAnswered &&
                      (isCorrect ? (
                        <Check className="text-green-500" size={24} />
                      ) : (
                        <X className="text-red-500" size={24} />
                      ))}
                  </div>
                );
              })}
            </div>
            <Button
              variant="brand-lemon"
              onClick={checkAnswers}
              disabled={animatingQuestions}
              className="w-fit"
            >
              Check Answer
            </Button>
          </motion.div>
        </>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={totalQuestions}
        open={showResultsDialog}
        onOpenChange={handleResultsDialogClose}
      />
    </div>
  );
};

const AbacusStackedBead = ({
  placeValue,
  index,
  totalBeads,
  disabled,
  onClick,
}: {
  placeValue: string;
  index: number;
  totalBeads: number;
  disabled: boolean;
  onClick: () => void;
}) => {
  const beadHeight = 25;
  const spacing = 6;
  const offset = 2;

  const barHeight = 300;
  const yPosition = barHeight - (index + 1) * (beadHeight + spacing) - offset;

  const colorClass = getBeadColor(placeValue);

  return (
    <div
      style={{
        width: "50px",
        height: `${beadHeight}px`,
        borderRadius: "20px",
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.5)",
        border: "1px solid rgba(0,0,0,0.3)",
        position: "absolute",
        left: "50%",
        top: `${yPosition}px`,
        transform: "translateX(-50%)",
        cursor: disabled ? "default" : "pointer",
        zIndex: totalBeads - index,
      }}
      onClick={disabled ? undefined : onClick}
      className={`${colorClass} ${
        disabled ? "" : "hover:brightness-110 active:brightness-90"
      }`}
    />
  );
};

const AbacusSourceBead = ({
  placeValue,
  disabled,
  onClick,
}: {
  placeValue: string;
  disabled: boolean;
  onClick: () => void;
}) => {
  const colorClass = getBeadColor(placeValue);

  return (
    <div
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        boxShadow:
          "0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.5)",
        border: "1px solid rgba(0,0,0,0.3)",
        position: "relative",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={disabled ? undefined : onClick}
      className={`${colorClass} ${
        disabled ? "" : "hover:brightness-110 active:brightness-90"
      }`}
    />
  );
};

const getBeadColor = (placeValue: string): string => {
  const placeValuePattern = placeValue.toLowerCase();

  if (placeValuePattern.includes("one")) return "bg-yellow-400";
  if (placeValuePattern.includes("ten")) return "bg-sky-400";
  if (placeValuePattern.includes("hundred")) return "bg-red-400";
  if (placeValuePattern.includes("thousand")) return "bg-green-400";
  if (placeValuePattern.includes("million")) return "bg-purple-400";
  if (placeValuePattern.includes("billion")) return "bg-orange-400";
  if (placeValuePattern.includes("trillion")) return "bg-pink-400";

  return "bg-gray-400";
};

export default ReverseAbacusActivity;
