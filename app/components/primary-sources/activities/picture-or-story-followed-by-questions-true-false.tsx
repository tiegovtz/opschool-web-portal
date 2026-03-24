"use client";

import { Check, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import LeftNotesWithImages from "../../../../../tie_open_school_primary_frontend/components/templates/left-notes-with-images";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type TPictureOrStoryFollowedByQuestionsTrueFalseQuestion = {
  notes: string;
  title: string;
  image?: string;
  questions: {
    question: string;
    answer: "T" | "F";
  }[];
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

const PictureOrStoryFollowedByQuestionsTrueFalseActivity = ({
  feedback,
  questions,
}: {
  feedback?: FeedbackType;
  questions: TPictureOrStoryFollowedByQuestionsTrueFalseQuestion;
}) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [shuffledIndexes, setShuffledIndexes] = useState<number[]>([]);
  const [attemptedQuestions, setAttemptedQuestions] = useState<
    Record<number, "T" | "F" | "">
  >({});
  const [answerFeedback, setAnswerFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [showResults, setShowResults] = useState(false);

  const { playSound } = useSoundEffects();

  // Function to shuffle questions
  const shuffleQuestions = () => {
    const indexes = Array.from(
      { length: questions.questions.length },
      (_, i) => i,
    );
    const shuffled = shuffle([...indexes]);
    setShuffledIndexes(shuffled);
    setActiveQuestion(0);

    // Reset attempted questions based on the new order
    setAttemptedQuestions(Object.fromEntries(shuffled.map((_, i) => [i, ""])));
  };

  // Initialize shuffled questions on component mount
  useEffect(() => {
    shuffleQuestions();
  }, []);

  // Helper function to get current question based on shuffled index
  const getCurrentQuestion = (index: number) => {
    if (shuffledIndexes.length === 0) return questions.questions[0];
    return questions.questions[shuffledIndexes[index]];
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (shuffledIndexes.length === 0) return;

    if (!attemptedQuestions[activeQuestion]) {
      if (e.key === "t" || e.key === "T") {
        handleAnswerSelection(activeQuestion, "T");
      } else if (e.key === "f" || e.key === "F") {
        handleAnswerSelection(activeQuestion, "F");
      }
    }
  };

  useEffect(() => {
    if (
      shuffledIndexes.length > 0 &&
      Object.keys(attemptedQuestions).length === shuffledIndexes.length &&
      Object.values(attemptedQuestions).every((answer) => answer !== "")
    ) {
      const newScore = Object.entries(attemptedQuestions).reduce(
        (acc, [index, answer]) => {
          const questionIndex = shuffledIndexes[parseInt(index)];
          return answer === questions.questions[questionIndex].answer
            ? acc + 1
            : acc;
        },
        0,
      );

      setScore(newScore);
      setAllAnswered(true);
      playSound("success");
    }
  }, [attemptedQuestions, shuffledIndexes, questions.questions]);

  const handleAnswerSelection = (questionIndex: number, answer: "T" | "F") => {
    if (shuffledIndexes.length === 0) return;

    // Get the original question index
    const originalIndex = shuffledIndexes[questionIndex];

    // Check if answer is correct
    const isCorrect = answer === questions.questions[originalIndex].answer;

    setAnswerFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      playSound("correct");
    } else {
      playSound("failure");
    }

    // Update attempted questions
    setAttemptedQuestions((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));

    // Move to next question after a short delay
    setTimeout(() => {
      setAnswerFeedback(null);
      if (questionIndex < shuffledIndexes.length - 1) {
        setActiveQuestion(questionIndex + 1);
      }
    }, 1000);
  };

  const resetActivity = () => {
    setScore(0);
    setAllAnswered(false);
    setAnswerFeedback(null);
    setShowResults(false);
    shuffleQuestions();
  };

  const ResultsSummary = () => {
    return (
      <div className="w-full space-y-3">
        {shuffledIndexes.map((originalIndex, idx) => {
          const question = questions.questions[originalIndex];
          const userAnswer = attemptedQuestions[idx] || "";
          const isCorrect = userAnswer === question.answer;

          return (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-md border flex items-center gap-3",
                isCorrect
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isCorrect
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700",
                )}
              >
                {isCorrect ? <Check size={18} /> : <X size={18} />}
              </div>

              <div className="flex-1">
                <p className="font-medium">Question {idx + 1}</p>
                <div className="flex flex-col gap-1 mt-1 text-sm">
                  <p>{question.question}</p>
                  {feedback === "wrong-correct-answers" && (
                    <>
                      <span>
                        Correct Answer:{" "}
                        <strong>
                          {question.answer === "T" ? "Kweli" : "Si Kweli"}
                        </strong>
                      </span>
                    </>
                  )}
                  {userAnswer && (
                    <span
                      className={
                        userAnswer === question.answer
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      <strong>
                        {userAnswer === "T" ? "Kweli" : "Si Kweli"}
                      </strong>
                    </span>
                  )}
                </div>
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
              total={questions.questions.length}
              onRestart={resetActivity}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-col md:flex-row justify-between gap-4 md:h-[calc(100dvh-200px)]">
            <LeftNotesWithImages notes={questions.notes} />
            <div className="bg-white flex flex-col gap-4 justify-between w-full h-full rounded-xl p-4 md:p-6">
              <AnimatePresence mode="wait">
                {shuffledIndexes.length > 0 && (
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
                    className="flex flex-col gap-4 justify-between max-h-[300px] overflow-auto"
                  >
                    <div className="md:p-4 text-lg leading-loose">
                      <p>{`${activeQuestion + 1}. ${
                        getCurrentQuestion(activeQuestion).question
                      }`}</p>
                      <div className="mt-4">
                        <div className="flex items-center justify-center gap-8">
                          <Button
                            variant={
                              attemptedQuestions[activeQuestion] === "T"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleAnswerSelection(activeQuestion, "T")
                            }
                            className={cn("w-20 md:w-24 h-14 md:h-16 text-xl", {
                              "bg-green-500":
                                answerFeedback === "correct" &&
                                attemptedQuestions[activeQuestion] === "T",
                              "bg-red-500":
                                answerFeedback === "incorrect" &&
                                attemptedQuestions[activeQuestion] === "T",
                            })}
                            disabled={!!attemptedQuestions[activeQuestion]}
                          >
                            Kweli
                          </Button>
                          <Button
                            variant={
                              attemptedQuestions[activeQuestion] === "F"
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleAnswerSelection(activeQuestion, "F")
                            }
                            className={cn("w-20 md:w-24 h-14 md:h-16 text-xl", {
                              "bg-green-500":
                                answerFeedback === "correct" &&
                                attemptedQuestions[activeQuestion] === "F",
                              "bg-red-500":
                                answerFeedback === "incorrect" &&
                                attemptedQuestions[activeQuestion] === "F",
                            })}
                            disabled={!!attemptedQuestions[activeQuestion]}
                          >
                            Si Kweli
                          </Button>
                        </div>
                        <div className="mt-4 text-center">
                          <input
                            type="text"
                            className="sr-only"
                            autoFocus
                            onKeyDown={handleKeyPress}
                            disabled={!!attemptedQuestions[activeQuestion]}
                          />
                          {answerFeedback && (
                            <p
                              className={cn("text-lg font-bold", {
                                "text-green-600": answerFeedback === "correct",
                                "text-red-600": answerFeedback === "incorrect",
                              })}
                            >
                              {answerFeedback === "correct"
                                ? "Correct!"
                                : "Incorrect!"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {questions.image && (
                <div className="flex items-center justify-center w-full h-[300px] rounded-lg overflow-hidden">
                  <img
                    src={questions.image}
                    alt="Activity Image"
                    className="object-contain w-full h-full"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap justify-center gap-4">
              {shuffledIndexes.map((originalIndex, index) => {
                const question = questions.questions[originalIndex];
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-picton-blue-200",
                      {
                        "bg-lemon-200": attemptedQuestions[index] !== "",
                        "border-2 border-picton-blue-500":
                          index === activeQuestion &&
                          !attemptedQuestions[index],
                      },
                    )}
                    onClick={() => !answerFeedback && setActiveQuestion(index)}
                    style={{ cursor: !answerFeedback ? "pointer" : "default" }}
                  >
                    {attemptedQuestions[index] !== "" &&
                      (attemptedQuestions[index] === question.answer ? (
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
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
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

export default PictureOrStoryFollowedByQuestionsTrueFalseActivity;
