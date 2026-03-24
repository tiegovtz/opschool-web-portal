"use client";

import { Check, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { Button } from "@/components/ui/button";

type TMultipleChoiceWithNotesQuestion = {
  question: string;
  image?: string;
  options: {
    id: "A" | "B" | "C" | "D";
    text: string;
    correct: boolean;
  }[];
};

type TMultipleChoiceWithNotesActivity = {
  title: string;
  notes: string;
  image?: string;
  questions: TMultipleChoiceWithNotesQuestion[];
};

const questionVariants = {
  enter: {
    x: 50,
    opacity: 0,
  },
  center: {
    x: 0,
    opacity: 1,
  },
  exit: {
    x: -50,
    opacity: 0,
  },
};

const MultipleChoiceWithNotes = ({
  feedback,
  questions,
}: {
  feedback?: FeedbackType;
  questions: TMultipleChoiceWithNotesActivity;
}) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [attemptedQuestions, setAttemptedQuestions] = useState<
    Record<number, { answer: string; isCorrect: boolean; text: string }>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<
    TMultipleChoiceWithNotesQuestion[]
  >([]);
  // For "all at once" mode - store current answers for each question
  const [allAnswers, setAllAnswers] = useState<Record<number, string>>({});
  // Track if answers have been checked in "all at once" mode
  const [answersChecked, setAnswersChecked] = useState(false);

  // Check if we have notes to display
  const hasNotes = !!questions.notes && questions.notes?.trim() !== "";

  // Create a reference to the input element
  const inputRef = useRef<HTMLInputElement>(null);

  const { playSound } = useSoundEffects();

  // Initialize shuffled questions when component mounts or questions change
  useEffect(() => {
    setShuffledQuestions(shuffle(questions.questions));
  }, [questions]);

  // Focus the input when activeQuestion changes or questions are shuffled
  useEffect(() => {
    if (inputRef.current && !showResults) {
      // Short timeout to allow animations to start
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeQuestion, shuffledQuestions, showResults]);

  const handleInputChange = (value: string) => {
    const upperValue = value.toUpperCase();
    if (["A", "B", "C", "D", "E", ""].includes(upperValue)) {
      setCurrentAnswer(upperValue);

      // If a valid option is entered (not empty), immediately check the answer
      if (upperValue !== "") {
        checkAnswer(upperValue);
      }
    }
  };

  const checkAnswer = (answer: string) => {
    const correctAnswer = shuffledQuestions[activeQuestion].options.find(
      (option) => option.correct
    )?.id;

    const isCorrect = answer.toLowerCase() === correctAnswer?.toLowerCase();

    setAttemptedQuestions((prev) => ({
      ...prev,
      [activeQuestion]: {
        answer,
        isCorrect,
        text:
          shuffledQuestions[activeQuestion].options.find(
            (opt) => opt.id === answer.toUpperCase()
          )?.text || "",
      },
    }));

    playSound(isCorrect ? "correct" : "failure");

    // Move to next question after a short delay
    if (activeQuestion < shuffledQuestions.length - 1) {
      setTimeout(() => {
        setActiveQuestion(activeQuestion + 1);
        setCurrentAnswer("");
      }, 500);
    } else {
      const totalCorrect = Object.values({
        ...attemptedQuestions,
        [activeQuestion]: { answer, isCorrect },
      }).reduce((acc, curr) => (curr.isCorrect ? acc + 1 : acc), 0);
      setScore(totalCorrect);
      setAllAnswered(true);
    }
  };

  const resetActivity = () => {
    setScore(0);
    setAllAnswered(false);
    setActiveQuestion(0);
    setCurrentAnswer("");
    setAttemptedQuestions({});
    setShowResults(false);
    setAllAnswers({});
    setAnswersChecked(false);
    // Reshuffle questions when activity is reset
    setShuffledQuestions(shuffle(questions.questions));
  };

  // Handle input change for "all at once" mode (no immediate checking)
  const handleAllAtOnceInputChange = (questionIndex: number, value: string) => {
    const upperValue = value.toUpperCase();
    if (["A", "B", "C", "D", "E", ""].includes(upperValue)) {
      setAllAnswers((prev) => ({
        ...prev,
        [questionIndex]: upperValue,
      }));
    }
  };

  // Check all answers at once when user clicks the button
  const checkAllAnswers = () => {
    const newAttemptedQuestions: Record<
      number,
      { answer: string; isCorrect: boolean; text: string }
    > = {};

    shuffledQuestions.forEach((question, index) => {
      const answer = allAnswers[index] || "";
      const correctAnswer = question.options.find(
        (option) => option.correct
      )?.id;

      const isCorrect = answer.toLowerCase() === correctAnswer?.toLowerCase();

      newAttemptedQuestions[index] = {
        answer,
        isCorrect,
        text:
          question.options.find((opt) => opt.id === answer.toUpperCase())
            ?.text || "",
      };
    });

    setAttemptedQuestions(newAttemptedQuestions);
    setAnswersChecked(true);

    const totalCorrect = Object.values(newAttemptedQuestions).reduce(
      (acc, curr) => (curr.isCorrect ? acc + 1 : acc),
      0
    );
    setScore(totalCorrect);

    // Play sound based on overall performance
    if (totalCorrect === shuffledQuestions.length) {
      playSound("correct");
    } else if (totalCorrect > shuffledQuestions.length / 2) {
      playSound("correct");
    } else {
      playSound("failure");
    }

    setAllAnswered(true);
  };

  // Check if all questions have been answered (for enabling the check button)
  const allQuestionsAnswered =
    Object.keys(allAnswers).length === shuffledQuestions.length &&
    Object.values(allAnswers).every((answer) => answer !== "");

  const ResultsSummary = () => {
    return (
      <div className="w-full space-y-3">
        {feedback === "wrong-correct-answers"
          ? shuffledQuestions.map((question, idx) => {
              const record = attemptedQuestions[idx];
              const isCorrect = record?.isCorrect || false;
              const correctOption = question.options.find(
                (option) => option.correct
              );

              return (
                <div
                  key={idx}
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
                    <div className="flex flex-col gap-1 mt-1 text-sm">
                      <p>{question.question}</p>
                      <span>
                        Correct Answer:{" "}
                        <strong>
                          {correctOption?.id}. {correctOption?.text}
                        </strong>
                      </span>
                      {!isCorrect && record && (
                        <span className="text-red-600">
                          Your Answer:{" "}
                          <strong>
                            {record.answer}. {record.text}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          : shuffledQuestions.map((question, idx) => {
              const record = attemptedQuestions[idx];
              const isCorrect = record?.isCorrect || false;

              return (
                <div
                  key={idx}
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
                    <p className="text-sm mt-1">{question.question}</p>
                    {record && (
                      <span
                        className={cn(
                          "text-sm",
                          isCorrect ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {record.answer}. {record.text}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      {showResults ? (
        <div className="flex-1 flex flex-col items-center justify-between md:p-4 overflow-auto">
          <ResultsSummary />
          <div className="w-full mt-4">
            <ActivityResults
              score={score}
              total={shuffledQuestions.length}
              onRestart={resetActivity}
            />
          </div>
        </div>
      ) : hasNotes ? (
        // WITH NOTES: Show one question at a time with notes panel
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-col md:flex-row justify-between gap-4 md:h-[calc(100dvh-200px)]">
            <LeftNotesWithImages
              notes={questions.notes}
              image={questions.image}
            />
            <div className="bg-white flex flex-col gap-4 justify-between w-full h-full rounded-xl p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeQuestion}
                  variants={questionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.3,
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                  className={cn("flex flex-col gap-4 overflow-auto h-full", {
                    "md:max-h-[300px]": questions.image,
                  })}
                >
                  <p className="text-lg text-picton-blue-700">
                    {activeQuestion + 1}.{" "}
                    {shuffledQuestions[activeQuestion]?.question}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col gap-2">
                      {shuffledQuestions[activeQuestion]?.options.map(
                        (option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-start gap-2 text-picton-blue-700 font-thin text-lg"
                            style={{
                              fontFamily: "var(--font-shaky-hand-some-comic)",
                            }}
                          >
                            <p>{option.id})</p>
                            <p>{option.text}</p>
                          </div>
                        )
                      )}
                    </div>
                    <Input
                      ref={inputRef}
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className={cn(
                        "w-12 h-12 bg-picton-blue-200 rounded text-center text-2xl",
                        {
                          "bg-lemon-200 text-lemon-700": currentAnswer,
                        }
                      )}
                      maxLength={1}
                      autoFocus
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center justify-between h-full">
            <div className="flex flex-wrap justify-center gap-4">
              {shuffledQuestions.map((_, index) => {
                const attempted = attemptedQuestions[index];
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      {
                        "bg-lemon-200": attempted,
                        "bg-picton-blue-200": !attempted,
                        "border-2 border-picton-blue-500":
                          index === activeQuestion && !attempted,
                      }
                    )}
                  >
                    {attempted &&
                      (attempted.isCorrect ? (
                        <Check className="text-green-500" size={24} />
                      ) : (
                        <X className="text-red-500" size={24} />
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // NO NOTES: Show all questions at once in a vertical list
        <div className="flex flex-col gap-4 h-full overflow-auto">
          <div className="bg-white rounded-xl p-4 md:p-6">
            <div className="flex flex-col gap-4">
              {shuffledQuestions.map((question, questionIndex) => {
                const attempted = attemptedQuestions[questionIndex];
                const hasAnswer = !!allAnswers[questionIndex];
                return (
                  <div
                    key={questionIndex}
                    className={cn("p-4 rounded-lg border-2 transition-colors", {
                      "border-green-300 bg-green-50":
                        answersChecked && attempted?.isCorrect,
                      "border-red-300 bg-red-50":
                        answersChecked && attempted && !attempted.isCorrect,
                      "border-picton-blue-200 bg-picton-blue-50":
                        !answersChecked,
                    })}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-lg text-picton-blue-700 mb-3">
                          {questionIndex + 1}. {question.question}
                        </p>
                        <div className="flex flex-col gap-1">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-start gap-2 text-picton-blue-700 font-thin text-base"
                              style={{
                                fontFamily: "var(--font-shaky-hand-some-comic)",
                              }}
                            >
                              <p>{option.id})</p>
                              <p>{option.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <Input
                          type="text"
                          value={allAnswers[questionIndex] || ""}
                          onChange={(e) =>
                            handleAllAtOnceInputChange(
                              questionIndex,
                              e.target.value
                            )
                          }
                          disabled={answersChecked}
                          className={cn(
                            "w-12 h-12 rounded text-center text-2xl",
                            {
                              "bg-green-200 text-green-700":
                                answersChecked && attempted?.isCorrect,
                              "bg-red-200 text-red-700":
                                answersChecked &&
                                attempted &&
                                !attempted.isCorrect,
                              "bg-picton-blue-200":
                                !answersChecked && !hasAnswer,
                              "bg-lemon-200 text-lemon-700":
                                !answersChecked && hasAnswer,
                            }
                          )}
                          maxLength={1}
                        />
                        {answersChecked && attempted && (
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              {
                                "bg-green-100": attempted.isCorrect,
                                "bg-red-100": !attempted.isCorrect,
                              }
                            )}
                          >
                            {attempted.isCorrect ? (
                              <Check className="text-green-500" size={18} />
                            ) : (
                              <X className="text-red-500" size={18} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Check Answers button */}
          {!answersChecked && (
            <Button
              className="ml-auto w-fit"
              onClick={checkAllAnswers}
              disabled={!allQuestionsAnswered}
            >
              Check Answers
            </Button>
          )}
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={shuffledQuestions.length}
        open={allAnswered}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else {
              setShowResults(true);
            }
            setAllAnswered(false);
          }
        }}
      />
    </div>
  );
};

export default MultipleChoiceWithNotes;
