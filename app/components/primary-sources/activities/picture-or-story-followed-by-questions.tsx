"use client";

import { Check, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import LeftNotesWithImages from "../../../../../tie_open_school_primary_frontend/components/templates/left-notes-with-images";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type TPictureOrStoryFollowedByQuestionsQuestion = {
  notes: string;
  title: string;
  image?: string;
  options: string[];
  questions: {
    question: string;
    answer: string;
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

const PictureOrStoryFollowedByQuestionsActivity = ({
  feedback,
  questions,
}: {
  feedback?: FeedbackType;
  questions: TPictureOrStoryFollowedByQuestionsQuestion;
}) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([
    ...questions.questions,
  ]);
  const [attemptedQuestions, setAttemptedQuestions] = useState<
    Record<number, string>
  >({});
  const [answerFeedback, setAnswerFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { playSound } = useSoundEffects();

  // Function to shuffle both questions and options
  const shuffleQuestionsAndOptions = () => {
    const shuffledQs = shuffle([...questions.questions]);
    setShuffledQuestions(shuffledQs);
    setShuffledOptions(shuffle([...questions.options]));

    // Reset attempted questions with empty strings for all new indices
    setAttemptedQuestions(
      Object.fromEntries(shuffledQs.map((_, i) => [i, ""]))
    );
  };

  // Initialize shuffled questions and options on component mount
  useEffect(() => {
    shuffleQuestionsAndOptions();
  }, [questions.questions, questions.options]);

  useEffect(() => {
    if (
      Object.values(attemptedQuestions).every((answer) => answer !== "") &&
      Object.keys(attemptedQuestions).length === shuffledQuestions.length
    ) {
      const newScore = Object.values(attemptedQuestions).reduce(
        (acc, answer, index) => {
          return answer === shuffledQuestions[index].answer ? acc + 1 : acc;
        },
        0
      );

      setScore(newScore);
      setAllAnswered(true);
      playSound("success");
    }
  }, [attemptedQuestions, shuffledQuestions]);

  const handleAnswerSelection = (questionIndex: number, answer: string) => {
    // Check if answer is correct
    const isCorrect = answer === shuffledQuestions[questionIndex].answer;

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
      if (questionIndex < shuffledQuestions.length - 1) {
        setActiveQuestion(questionIndex + 1);
        // Re-shuffle options for next question
        setShuffledOptions(shuffle([...questions.options]));
      }
    }, 1000);
  };

  const resetActivity = () => {
    setScore(0);
    setActiveQuestion(0);
    setAllAnswered(false);
    setAnswerFeedback(null);
    setShowResults(false);
    // Shuffle both questions and options when resetting
    shuffleQuestionsAndOptions();
  };

  const ResultsSummary = () => {
    return (
      <div className="w-full space-y-3">
        {feedback === "wrong-correct-answers"
          ? shuffledQuestions.map((question, idx) => {
              const userAnswer = attemptedQuestions[idx] || "";
              const isCorrect = userAnswer === question.answer;

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
                        Correct Answer: <strong>{question.answer}</strong>
                      </span>
                      {!isCorrect && userAnswer && (
                        <span className="text-red-600">
                          Your Answer: <strong>{userAnswer}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          : shuffledQuestions.map((question, idx) => {
              const userAnswer = attemptedQuestions[idx] || "";
              const isCorrect = userAnswer === question.answer;

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
        <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-auto">
          <ResultsSummary />
          <div className="w-full mt-4">
            <ActivityResults
              score={score}
              total={shuffledQuestions.length}
              onRestart={resetActivity}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 h-full">
          <div className="grid grid-cols-2 gap-4 h-full">
            <LeftNotesWithImages
              notes={`${questions.notes}`}
              image={questions.image}
            />
            <div className="bg-white flex flex-col gap-4 justify-between w-full h-full rounded-xl p-6">
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
                  className="flex flex-col gap-4 justify-between h-full"
                >
                  <div className="p-4 text-lg leading-loose">
                    <span>{`${activeQuestion + 1}. ${
                      shuffledQuestions[activeQuestion]?.question || ""
                    }`}</span>
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {shuffledOptions.map((option, i) => (
                          <Button
                            key={i}
                            variant={
                              attemptedQuestions[activeQuestion] === option
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              handleAnswerSelection(activeQuestion, option)
                            }
                            className={cn(
                              "w-full py-4 text-left px-4 justify-start",
                              {
                                "bg-green-500":
                                  answerFeedback === "correct" &&
                                  attemptedQuestions[activeQuestion] === option,
                                "bg-red-500":
                                  answerFeedback === "incorrect" &&
                                  attemptedQuestions[activeQuestion] === option,
                              }
                            )}
                            disabled={!!attemptedQuestions[activeQuestion]}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      <div className="mt-4 text-center">
                        {answerFeedback && (
                          <p
                            className={cn("text-lg font-bold mt-2", {
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
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex justify-center gap-4">
              {shuffledQuestions.map((question, index) => {
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-picton-blue-200",
                      {
                        "bg-lemon-200": attemptedQuestions[index] !== "",
                      }
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

export default PictureOrStoryFollowedByQuestionsActivity;
