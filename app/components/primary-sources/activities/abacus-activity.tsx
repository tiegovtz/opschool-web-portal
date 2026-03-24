import { X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef } from "react";
import { DragEndEvent, useDraggable } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

import { cn } from "@/lib/utils";
import { Input } from "../../../../../tie_open_school_primary_frontend/components/ui/input";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import DNDContext from "../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

interface AbacusQuestion {
  id: number;
  number: string;
}

interface AbacusActivityProps {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: AbacusQuestion[];
  };
}

interface BeadProps {
  id: string;
  position: { x: number; y: number };
  placeValue: string;
}

interface AnswerRecord {
  questionIndex: number;
  question: string;
  userAnswer: string;
  isCorrect: boolean;
}

const AbacusActivity = ({
  feedback,
  questions: questionsData,
}: AbacusActivityProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [beads, setBeads] = useState<BeadProps[]>([]);
  const [wholeNumberAnswer, setWholeNumberAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [animatingQuestions, setAnimatingQuestions] = useState(false);

  const { playSound } = useSoundEffects();
  const barsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const currentQuestion = questionsData.questions[currentQuestionIndex];
  const totalQuestions = questionsData.questions.length;

  useEffect(() => {
    if (currentQuestion) {
      setupBeadsForQuestion();
    }
  }, [currentQuestion]);

  const setupBeadsForQuestion = () => {
    const newBeads: BeadProps[] = [];
    const digits = currentQuestion.number.split("").reverse();
    const placeValueNames = getExtendedPlaceValueNames(digits.length);

    digits.forEach((digit, placeIndex) => {
      const placeValue = placeValueNames[placeIndex];

      const beadCount = parseInt(digit);
      const barHeight = 256;
      const beadHeight = 22;
      const spacing = 6;

      for (let i = 0; i < beadCount; i++) {
        const posY = barHeight - (i + 1) * (beadHeight + spacing) - 2;

        newBeads.push({
          id: `bead-${placeValue}-${i}`,
          position: { x: 0, y: posY },
          placeValue,
        });
      }
    });

    setBeads(newBeads);

    const initialAnswers: Record<string, string> = {};
    digits.forEach((_, placeIndex) => {
      const placeValue = placeValueNames[placeIndex];
      initialAnswers[placeValue] = "";
    });

    setUserAnswers(initialAnswers);
    setWholeNumberAnswer("");
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id.toString();

    setBeads((prev) => {
      return prev.map((bead) => {
        if (bead.id === id) {
          const placeValueBar = barsRef.current[bead.placeValue];

          if (placeValueBar) {
            const barRect = placeValueBar.getBoundingClientRect();
            const barHeight = barRect.height - 10;

            let newY = bead.position.y + delta.y;
            newY = Math.max(0, Math.min(newY, barHeight - 20));

            return {
              ...bead,
              position: { ...bead.position, y: newY },
            };
          }

          return bead;
        }
        return bead;
      });
    });
  };

  const handlePlaceValueInput = (placeValue: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setUserAnswers((prev) => ({
        ...prev,
        [placeValue]: value,
      }));
    }
  };

  const handleWholeNumberInput = (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setWholeNumberAnswer(value);
    }
  };

  const getPlaceValues = () => {
    const digits = currentQuestion.number.split("").reverse();
    const placeValueNames = getExtendedPlaceValueNames(digits.length);
    return placeValueNames.slice(0, digits.length).reverse();
  };

  const validateDigitsMatchWholeNumber = (): boolean => {
    const placeValues = getPlaceValues();
    let constructedNumber = "";

    for (const placeValue of placeValues) {
      const digit = userAnswers[placeValue] || "";
      if (digit === "") {
        return false;
      }
      constructedNumber += digit;
    }

    return constructedNumber === wholeNumberAnswer;
  };

  const checkAnswers = () => {
    const allInputsFilled =
      Object.values(userAnswers).every((value) => value !== "") &&
      wholeNumberAnswer !== "";

    if (!allInputsFilled) {
      setValidationError("Please fill in all text fields.");
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    if (!validateDigitsMatchWholeNumber()) {
      setValidationError(
        "The individual place value digits don't match the whole number."
      );
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    const isCorrect = wholeNumberAnswer === currentQuestion.number;

    setAnswerRecords((prev) => [
      ...prev,
      {
        questionIndex: currentQuestionIndex,
        question: currentQuestion.number,
        userAnswer: wholeNumberAnswer,
        isCorrect,
      },
    ]);

    if (isCorrect) {
      setScore((prevScore) => prevScore + 1);
      playSound("correct");
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
    setUserAnswers({});
    setWholeNumberAnswer("");
    setBeads([]);
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

  const getBeadsForPlaceValue = (placeValue: string) => {
    return beads.filter((bead) => bead.placeValue === placeValue);
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
                        Correct Answer: <strong>{question.number}</strong>
                      </span>
                      {!isCorrect && record && (
                        <span className="text-red-600">
                          Your Answer:{" "}
                          <strong>{record.userAnswer || "No answer"}</strong>
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
            <DNDContext
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
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
                  className="flex items-end justify-center w-full overflow-x-auto pb-4 gap-1"
                >
                  {getPlaceValues().map((placeValue, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center rounded-lg w-24 flex-shrink-0"
                    >
                      <div className="h-16 mb-2 flex items-center justify-center">
                        <h3 className="text-sm font-bold text-picton-blue-700 text-center px-1 leading-tight">
                          {placeValue}
                        </h3>
                      </div>

                      <div
                        ref={(el) => {
                          barsRef.current[placeValue] = el;
                        }}
                        className="relative w-20 h-64 mb-4 border-2 bg-lemon-100 rounded-lg overflow-hidden border-lemon-800/50"
                      >
                        <div className="absolute w-2 h-full bg-lemon-900 left-1/2 top-0 transform -translate-x-1/2 rounded-full"></div>

                        {getBeadsForPlaceValue(placeValue).map((bead) => (
                          <AbacusBead
                            key={bead.id}
                            bead={bead}
                            disabled={showFeedback || animatingQuestions}
                          />
                        ))}
                      </div>

                      <div className="w-[90%] mx-auto mt-4">
                        <Input
                          type="text"
                          value={userAnswers[placeValue] || ""}
                          onChange={(e) =>
                            handlePlaceValueInput(placeValue, e.target.value)
                          }
                          disabled={showFeedback || animatingQuestions}
                          className="w-full text-center !text-xl"
                          maxLength={1}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-2xl">=</span>
                    <Input
                      type="text"
                      value={wholeNumberAnswer}
                      onChange={(e) => handleWholeNumberInput(e.target.value)}
                      disabled={showFeedback || animatingQuestions}
                      className={cn("min-w-32 mx-auto text-center !text-xl", {
                        "border-green-500 bg-green-100 text-green-700":
                          wholeNumberAnswer === currentQuestion.number &&
                          showFeedback,
                        "border-red-500 bg-red-100 text-red-700":
                          wholeNumberAnswer !== currentQuestion.number &&
                          showFeedback,
                      })}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </DNDContext>
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

const AbacusBead = ({
  bead,
  disabled,
}: {
  bead: BeadProps;
  disabled: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: bead.id,
    disabled,
  });

  const getBeadColorClass = () => {
    const placeValuePattern = bead.placeValue.toLowerCase();

    if (placeValuePattern.includes("one")) return "bg-yellow-400";
    if (placeValuePattern.includes("ten")) return "bg-sky-400";
    if (placeValuePattern.includes("hundred")) return "bg-red-400";
    if (placeValuePattern.includes("thousand")) return "bg-green-400";
    if (placeValuePattern.includes("million")) return "bg-purple-400";
    if (placeValuePattern.includes("billion")) return "bg-orange-400";
    if (placeValuePattern.includes("trillion")) return "bg-pink-400";

    return "bg-gray-400";
  };

  const style = {
    width: "40px",
    height: "25px",
    borderRadius: "20px",
    boxShadow:
      "0 2px 4px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.5)",
    border: "1px solid rgba(0,0,0,0.3)",
    position: "absolute" as const,
    left: "50%",
    top: `${bead.position.y}px`,
    transform: transform
      ? `translateX(-50%) translateY(${transform.y}px)`
      : "translateX(-50%)",
    zIndex: 10,
    cursor: disabled ? "default" : "grab",
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(disabled ? {} : listeners)}
      className={`${getBeadColorClass()} ${
        disabled ? "" : "hover:brightness-110"
      }`}
    />
  );
};

export default AbacusActivity;
