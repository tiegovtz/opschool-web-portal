import { X, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect, useRef, createRef } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { QUESTIONS_COUNT } from "@/shared/transpilerMapper/place-values-matrix";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PlaceValuesQuestion {
  id: number;
  number: string;
}

interface PlaceValuesMatrixProps {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: PlaceValuesQuestion[];
  };
  generateNewQuestions?: () => {
    title: string;
    questions: PlaceValuesQuestion[];
  };
}

interface AnswerRecord {
  questionIndex: number;
  question: string;
  userAnswers: Record<string, string>;
  isCorrect: boolean;
}

const PlaceValuesMatrix = ({
  feedback,
  questions: initialQuestionsData,
}: PlaceValuesMatrixProps) => {
  const [userAnswers, setUserAnswers] = useState<
    Record<number, Record<string, string>>
  >({});
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [questionsData, setQuestionsData] = useState(initialQuestionsData);

  // Create refs for input elements
  const inputRefs = useRef<Record<string, React.RefObject<HTMLInputElement>>>(
    {}
  );

  const { playSound } = useSoundEffects();

  const totalQuestions = questionsData.questions.length;

  useEffect(() => {
    const initialAnswers: Record<number, Record<string, string>> = {};

    // Initialize refs for all input fields
    questionsData.questions.forEach((question, qIndex) => {
      const digits = question.number.split("");
      const placeValueNames = getExtendedPlaceValueNames(digits.length);

      const questionAnswers: Record<string, string> = {};
      placeValueNames.forEach((place) => {
        questionAnswers[place] = "";
        // Create a unique key for each input
        const inputKey = `${qIndex}-${place}`;
        inputRefs.current[inputKey] = createRef();
      });

      initialAnswers[qIndex] = questionAnswers;
    });

    setUserAnswers(initialAnswers);
  }, [questionsData]);

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
      return result.reverse();
    }

    return baseNames.slice(0, numDigits).reverse();
  };

  // Function to find the next input field to focus
  const findNextInput = (questionIndex: number, placeValue: string) => {
    const currentPlaceValues = getPlaceValues(
      questionsData.questions[questionIndex].number
    );

    const currentIndex = currentPlaceValues.indexOf(placeValue);

    // If we're not at the last place value for this question
    if (currentIndex < currentPlaceValues.length - 1) {
      return {
        questionIndex,
        placeValue: currentPlaceValues[currentIndex + 1],
      };
    }

    // If this is the last question, we're done
    if (questionIndex >= questionsData.questions.length - 1) {
      return null;
    }

    // Move to the first place value of the next question
    const nextQuestionPlaceValues = getPlaceValues(
      questionsData.questions[questionIndex + 1].number
    );
    return {
      questionIndex: questionIndex + 1,
      placeValue: nextQuestionPlaceValues[0],
    };
  };

  const handlePlaceValueInput = (
    questionIndex: number,
    placeValue: string,
    value: string
  ) => {
    if (value === "" || /^\d+$/.test(value)) {
      setUserAnswers((prev) => ({
        ...prev,
        [questionIndex]: {
          ...prev[questionIndex],
          [placeValue]: value,
        },
      }));

      // If a digit was entered, move focus to the next input
      if (value !== "" && !showFeedback) {
        const nextInput = findNextInput(questionIndex, placeValue);
        if (nextInput) {
          const nextInputKey = `${nextInput.questionIndex}-${nextInput.placeValue}`;
          setTimeout(() => {
            inputRefs.current[nextInputKey]?.current?.focus();
          }, 10);
        }
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    questionIndex: number,
    placeValue: string
  ) => {
    // Handle navigation with arrow keys
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextInput = findNextInput(questionIndex, placeValue);
      if (nextInput) {
        const nextInputKey = `${nextInput.questionIndex}-${nextInput.placeValue}`;
        inputRefs.current[nextInputKey]?.current?.focus();
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      // Similar logic to find the previous input could be added here
    }
  };

  const getPlaceValues = (number: string) => {
    const digits = number.split("");
    return getExtendedPlaceValueNames(digits.length);
  };

  const getMaxPlaceValues = () => {
    let maxLength = 0;
    questionsData.questions.forEach((question) => {
      const length = question.number.length;
      if (length > maxLength) maxLength = length;
    });

    return getExtendedPlaceValueNames(maxLength);
  };

  const checkAnswers = () => {
    let allInputsFilled = true;
    for (const answers of Object.values(userAnswers)) {
      if (Object.values(answers).some((value) => value === "")) {
        allInputsFilled = false;
        break;
      }
    }

    if (!allInputsFilled) {
      setValidationError("Please fill in all answers before checking.");
      setTimeout(() => setValidationError(null), 4000);
      return;
    }

    let correctCount = 0;
    const newAnswerRecords: AnswerRecord[] = [];

    questionsData.questions.forEach((question, questionIndex) => {
      const currentQuestionDigits = question.number.split("").reverse();
      const placeValueNames = getExtendedPlaceValueNames(
        currentQuestionDigits.length
      ).reverse();

      let isCorrect = true;

      for (let i = 0; i < currentQuestionDigits.length; i++) {
        const expectedDigit = currentQuestionDigits[i];
        const placeValue = placeValueNames[i];
        const userDigit = userAnswers[questionIndex]?.[placeValue] || "";

        if (expectedDigit !== userDigit) {
          isCorrect = false;
          break;
        }
      }

      if (isCorrect) {
        correctCount++;
      }

      newAnswerRecords.push({
        questionIndex,
        question: question.number,
        userAnswers: { ...userAnswers[questionIndex] },
        isCorrect,
      });
    });

    setAnswerRecords(newAnswerRecords);
    setScore(correctCount);

    if (correctCount > 0) {
      playSound("success");
    } else {
      playSound("failure");
    }

    if (feedback !== "none") {
      setShowFeedback(true);
    }

    setShowResultsDialog(true);
  };

  const resetActivity = () => {
    // Generate new questions
    // Generate new random numbers with the same number of digits as the first question
    const digitCount = questionsData.questions[0].number.length;
    const newRandomNumbers = Array.from({ length: QUESTIONS_COUNT }, () => {
      const min = Math.pow(10, digitCount - 1);
      const max = Math.pow(10, digitCount) - 1;
      return Math.floor(min + Math.random() * (max - min + 1)).toString();
    });

    // Create new questions data structure
    const newQuestionsData = {
      ...questionsData,
      questions: newRandomNumbers.map((number, index) => ({
        id: index,
        number,
      })),
    };

    // Update the questions state
    setQuestionsData(newQuestionsData);

    const initialAnswers: Record<number, Record<string, string>> = {};
    newQuestionsData.questions.forEach((question, index) => {
      const digits = question.number.split("");
      const placeValueNames = getExtendedPlaceValueNames(digits.length);
      const questionAnswers: Record<string, string> = {};
      placeValueNames.forEach((place) => {
        questionAnswers[place] = "";
      });
      initialAnswers[index] = questionAnswers;
    });

    setUserAnswers(initialAnswers);
    setShowFeedback(false);
    setScore(0);
    setAnswerRecords([]);
    setShowResults(false);

    // Re-create refs for all input fields for new questions
    inputRefs.current = {};
    newQuestionsData.questions.forEach((question, qIndex) => {
      const digits = question.number.split("");
      const placeValueNames = getExtendedPlaceValueNames(digits.length);

      placeValueNames.forEach((place) => {
        // Create a unique key for each input
        const inputKey = `${qIndex}-${place}`;
        inputRefs.current[inputKey] = createRef();
      });
    });

    // Focus the first input after reset
    if (newQuestionsData.questions.length > 0) {
      const firstQuestion = newQuestionsData.questions[0];
      const firstPlaceValue = getPlaceValues(firstQuestion.number)[0];
      const firstInputKey = `0-${firstPlaceValue}`;
      setTimeout(() => {
        inputRefs.current[firstInputKey]?.current?.focus();
      }, 10);
    }
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

  const getCellClassName = (questionIndex: number, placeValue: string) => {
    if (!showFeedback) return "";

    const question = questionsData.questions[questionIndex];
    const digit = userAnswers[questionIndex]?.[placeValue];
    const expectedDigit = getExpectedDigitForPlaceValue(question, placeValue);

    if (digit === expectedDigit) {
      return "bg-green-100 text-green-700 border-green-300";
    }
    return "bg-red-100 text-red-700 border-red-300";
  };

  const getRowClassName = (questionIndex: number) => {
    if (!showFeedback) return "";

    const record = answerRecords.find((r) => r.questionIndex === questionIndex);
    if (!record) return "";

    return record.isCorrect ? "bg-green-50/70" : "bg-red-50/70";
  };

  const getExpectedDigitForPlaceValue = (
    question: PlaceValuesQuestion,
    placeValue: string
  ): string => {
    const digits = question.number.split("");
    const placeValueNames = getExtendedPlaceValueNames(digits.length);
    const index = placeValueNames.indexOf(placeValue);

    if (index !== -1) {
      return digits[index];
    }
    return "";
  };

  // Set focus on the first input when the component mounts
  useEffect(() => {
    if (questionsData.questions.length > 0 && !showFeedback && !showResults) {
      const firstQuestion = questionsData.questions[0];
      const firstPlaceValue = getPlaceValues(firstQuestion.number)[0];
      const firstInputKey = `0-${firstPlaceValue}`;
      setTimeout(() => {
        inputRefs.current[firstInputKey]?.current?.focus();
      }, 100);
    }
  }, [showFeedback, showResults]);

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

      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full pb-4"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-picton-blue-50">
                <TableHead className="text-center font-bold text-picton-blue-800 whitespace-nowrap">
                  Number
                </TableHead>
                {getMaxPlaceValues().map((placeValue, i) => (
                  <TableHead
                    key={i}
                    className="text-center font-bold text-picton-blue-800 whitespace-nowrap"
                  >
                    {placeValue}
                  </TableHead>
                ))}
                {showFeedback && (
                  <TableHead className="text-center font-bold text-picton-blue-800 whitespace-nowrap">
                    Result
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody className="bg-picton-blue-50">
              {questionsData.questions.map((question, questionIndex) => {
                const placeValues = getPlaceValues(question.number);
                const maxPlaceValues = getMaxPlaceValues();
                const paddingCells = maxPlaceValues.length - placeValues.length;
                const record = answerRecords.find(
                  (r) => r.questionIndex === questionIndex
                );
                const isCorrect = record?.isCorrect || false;

                return (
                  <TableRow
                    key={question.id}
                    className={cn(
                      "border-none",
                      getRowClassName(questionIndex)
                    )}
                  >
                    <TableCell className="font-bold text-center text-lg text-picton-blue-700 border-r">
                      {question.number}
                    </TableCell>

                    {Array.from({ length: paddingCells }).map((_, i) => (
                      <TableCell
                        key={`padding-${i}`}
                        className="border-r"
                      ></TableCell>
                    ))}

                    {placeValues.map((placeValue, i) => {
                      const inputKey = `${questionIndex}-${placeValue}`;
                      return (
                        <TableCell
                          key={i}
                          className={cn(
                            "text-center border-r",
                            getCellClassName(questionIndex, placeValue)
                          )}
                        >
                          <Input
                            ref={inputRefs.current[inputKey]}
                            type="text"
                            value={
                              userAnswers[questionIndex]?.[placeValue] || ""
                            }
                            onChange={(e) =>
                              handlePlaceValueInput(
                                questionIndex,
                                placeValue,
                                e.target.value
                              )
                            }
                            onKeyDown={(e) =>
                              handleKeyDown(e, questionIndex, placeValue)
                            }
                            disabled={showFeedback}
                            className="w-20 mx-auto text-center !text-xl"
                            maxLength={1}
                          />
                          {showFeedback &&
                            feedback === "wrong-correct-answers" &&
                            userAnswers[questionIndex]?.[placeValue] !==
                              getExpectedDigitForPlaceValue(
                                question,
                                placeValue
                              ) && (
                              <div className="text-xs mt-1 text-red-700">
                                Correct:{" "}
                                {getExpectedDigitForPlaceValue(
                                  question,
                                  placeValue
                                )}
                              </div>
                            )}
                        </TableCell>
                      );
                    })}

                    {showFeedback && (
                      <TableCell className="border-r text-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                            isCorrect
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {isCorrect ? <Check size={18} /> : <X size={18} />}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </motion.div>
      </div>

      {showResults ? (
        <div className="flex-1 flex flex-col items-center justify-between">
          <div className="w-full">
            <ActivityResults
              score={score}
              total={totalQuestions}
              onRestart={resetActivity}
            />
          </div>
        </div>
      ) : !showFeedback ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="flex justify-center mb-4"
        >
          <Button onClick={checkAnswers} variant="brand-lemon">
            Check Answers
          </Button>
        </motion.div>
      ) : null}

      <ActivityResultsAlertDialog
        score={score}
        total={totalQuestions}
        open={showResultsDialog}
        onOpenChange={handleResultsDialogClose}
      />
    </div>
  );
};

export default PlaceValuesMatrix;
