"use client";

import { Check, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState, useCallback } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { Button } from "../../../../../../tie_open_school_primary_frontend/components/ui/button";
import { CircularTimer } from "../../../../../../tie_open_school_primary_frontend/components/ui/circular-timer";
import ActivityTitle from "../../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../../tie_open_school_primary_frontend/components/templates/results";

type MultipleChoiceGameProps = {
  questions: {
    title: string;
    questions: {
      id: string;
      question: string;
      questionImage?: string;
      options: string[];
      correctAnswer: string;
      time?: number;
    }[];
  };
  feedback?: FeedbackType;
  timePerQuestion?: number; // seconds per question
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

const MultipleChoiceGame = ({
  questions,
  feedback,
  timePerQuestion = 40,
}: MultipleChoiceGameProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [userAnswers, setUserAnswers] = useState<
    Array<{
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      timeSpent: number;
    }>
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);

  const { playSound } = useSoundEffects();

  const currentQuestion = questions.questions[currentQuestionIndex];
  const totalQuestions = questions.questions.length;

  // Get current question's time limit or use default
  const getCurrentQuestionTime = () => {
    return currentQuestion?.time || timePerQuestion;
  };

  // Timer countdown effect
  useEffect(() => {
    if (!isTimerActive || showFeedback || gameComplete) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, showFeedback, gameComplete]);

  // Initialize timer when component mounts or question changes
  useEffect(() => {
    const questionTime = getCurrentQuestionTime();
    setTimeLeft(questionTime);
  }, [currentQuestionIndex]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    setIsTimerActive(false);
    setShowFeedback(true);
    setAnswerFeedback("incorrect");
    playSound("failure");

    const timeSpent = Date.now() - questionStartTime;
    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswer: "",
        isCorrect: false,
        timeSpent,
      },
    ]);

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  }, [currentQuestion, questionStartTime]);

  // Handle answer selection
  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || showFeedback) return;

    setSelectedAnswer(answer);
    setIsTimerActive(false);
    setShowFeedback(true);

    const isCorrect = answer === currentQuestion.correctAnswer;
    const timeSpent = Date.now() - questionStartTime;

    setAnswerFeedback(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      setScore((prev) => prev + 1);
      playSound("correct");
    } else {
      playSound("failure");
    }

    setUserAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        isCorrect,
        timeSpent,
      },
    ]);

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  // Move to next question or complete game
  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setAnswerFeedback(null);
      // Time will be set by useEffect when currentQuestionIndex changes
      setIsTimerActive(true);
      setQuestionStartTime(Date.now());
    } else {
      setGameComplete(true);
      playSound("success");
    }
  };

  // Reset game
  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswerFeedback(null);
    setScore(0);
    setGameComplete(false);
    const initialTime = questions.questions[0]?.time || timePerQuestion;
    setTimeLeft(initialTime);
    setIsTimerActive(true);
    setQuestionStartTime(Date.now());
    setUserAnswers([]);
    setShowResults(false);
  };

  const ResultsSummary = () => {
    return (
      <div className="w-full space-y-3">
        {userAnswers.map((answer, idx) => {
          const question = questions.questions.find(
            (q) => q.id === answer.questionId,
          );
          if (!question) return null;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-4 rounded-lg border-2 flex items-start gap-3",
                answer.isCorrect
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  answer.isCorrect
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700",
                )}
              >
                {answer.isCorrect ? <Check size={18} /> : <X size={18} />}
              </div>

              <div className="flex-1">
                <p className="font-semibold mb-2">Question {idx + 1}</p>
                <p className="mb-2">{question.question}</p>

                <div className="text-sm space-y-1">
                  {feedback === "wrong-correct" && answer.selectedAnswer && (
                    <div>
                      <strong>Your Answer:</strong> {answer.selectedAnswer}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Time: {(answer.timeSpent / 1000).toFixed(1)}s</span>
                  </div>

                  {feedback === "wrong-correct-answers" && (
                    <>
                      <div>
                        <strong>Correct Answer:</strong>{" "}
                        {question.correctAnswer}
                      </div>
                      {!answer.isCorrect && answer.selectedAnswer && (
                        <div className="text-red-600">
                          <strong>Your Answer:</strong> {answer.selectedAnswer}
                        </div>
                      )}
                      {!answer.selectedAnswer && (
                        <div className="text-red-600">
                          <strong>Time expired - No answer given</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title || "Speed Quiz Challenge"} />

      {showResults ? (
        <div className="flex-1 flex flex-col items-center justify-between p-6 overflow-hidden">
          <ResultsSummary />
          <div className="w-full mt-6">
            <ActivityResults
              score={score}
              total={totalQuestions}
              onRestart={resetGame}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 h-full">
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
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
                className="flex flex-col gap-6 justify-between h-full"
              >
                {/* Question */}
                <div className="h-full">
                  <div className="md:p-4 text-lg leading-loose w-full">
                    <div className="flex flex-col md:flex-row gap-4">
                      <p
                        className={cn("text-picton-blue-700", {
                          "w-3/4":
                            currentQuestion.questionImage &&
                            currentQuestion.question,
                        })}
                      >
                        {`${currentQuestionIndex + 1}. ${
                          currentQuestion.question
                        }`}
                      </p>
                      {currentQuestion.questionImage && (
                        // {/* an image */}
                        <div
                          className={cn("max-h-96 rounded-lg", {
                            "w-full": !currentQuestion.question,
                            "w-1/2": currentQuestion.question,
                          })}
                        >
                          {/* Image content */}
                          <img
                            src={currentQuestion.questionImage}
                            alt="Question Image"
                            className="w-full h-full object-contain rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    {/* Answer Options - styled like true-false activity */}
                    <div className="mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion.options.map((option, index) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrect =
                            option === currentQuestion.correctAnswer;
                          const userIsCorrect = isSelected && isCorrect;
                          const showCorrectAnswer = showFeedback && isCorrect;
                          const showIncorrectAnswer =
                            showFeedback && isSelected && !isCorrect;

                          return (
                            <Button
                              key={index}
                              // variant={isSelected ? "default" : "outline"}
                              onClick={() => handleAnswerSelect(option)}
                              className={cn(
                                "p-4 h-auto text-left justify-start font-medium min-h-16 md:min-h-24 text-lg text-wrap transition-all shadow-md hover:shadow-lg border-none duration-300 border-picton-blue-300 text-picton-blue-700 bg-picton-blue-100 hover:bg-picton-blue-200",
                                {
                                  "bg-green-100 text-green-700":
                                    (showCorrectAnswer &&
                                      feedback === "wrong-correct-answers") ||
                                    userIsCorrect,
                                  "bg-red-50 text-red-700 hover:bg-red-500":
                                    showIncorrectAnswer,
                                  "border-picton-blue-300 text-picton-blue-700 bg-picton-blue-100 hover:bg-picton-blue-200":
                                    !isSelected && !showFeedback,
                                  "cursor-not-allowed pointer-events-none":
                                    !!showFeedback,
                                },
                              )}
                            >
                              {option}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Feedback Message */}
                      <div className="mt-6 text-center">
                        {answerFeedback && (
                          <p
                            className={cn("text-lg font-bold", {
                              "text-green-600": answerFeedback === "correct",
                              "text-red-600": answerFeedback === "incorrect",
                            })}
                          >
                            {timeLeft === 0
                              ? "⏰ Time's up!"
                              : answerFeedback === "correct"
                                ? "🎉 Correct!"
                                : "❌ Incorrect!"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Circular Timer */}
          <CircularTimer
            timeLeft={timeLeft}
            totalTimeLimit={getCurrentQuestionTime()}
            isTimerActive={isTimerActive}
            playTimerSounds={false}
            soundTriggerType="single-question"
            onTimeUp={handleTimeUp}
          />

          {/* Progress Bar - styled like comprehension-junior */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap justify-center gap-4">
              {questions.questions.map((_, index) => {
                const isAnswered = index < userAnswers.length;
                const isCorrect = isAnswered && userAnswers[index]?.isCorrect;
                const isCurrent = index === currentQuestionIndex;

                return (
                  <div
                    key={index}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      {
                        "bg-lemon-200": isAnswered,
                        "bg-picton-blue-200": !isAnswered,
                        "border-2 border-picton-blue-500":
                          isCurrent && !isAnswered,
                      },
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
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={totalQuestions}
        open={gameComplete}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetGame();
            } else {
              setShowResults(true);
            }
            setGameComplete(false);
          }
        }}
      />
    </div>
  );
};

export default MultipleChoiceGame;
