"use client";

import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import React, { useEffect, useState, useCallback, useRef } from "react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import { useObjects } from "@/hooks/useObjects";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import { missingDefinitionsGameTranspiler } from "@/shared/transpilerMapper/games-transpiler/missing-definitions";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type MissingDefinitionsProps = {
  questions: {
    title: string;
    type?: string;
    fontSize?: number;
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
  feedback?: FeedbackType;
};

type UserAnswer = {
  word: string;
  selectedDefinition: string;
  correctDefinition: string;
  isCorrect: boolean;
  timeStamp: number;
};

type Question = {
  word: string;
  definition: string;
  options: string[];
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

const MissingDefinitions = ({
  questions: {
    title,
    fontSize,
    type,
    isGameMode = false,
    gameTimeLimit = 300, // 5 minutes default
  },
  feedback,
}: MissingDefinitionsProps) => {
  // Fetch objects for the activity
  const { objects, loading, error, refetch } = useObjects({
    type: type || null,
    limit: 60,
    autoFetch: true,
  });

  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [showResults, setShowResults] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [completedObjectIds, setCompletedObjectIds] = useState<number[]>([]);

  const wordRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { playSound } = useSoundEffects();

  // Generate questions from objects using the transpiler
  const generateQuestions = useCallback(() => {
    if (!objects || objects.length < 10) return;

    const result = missingDefinitionsGameTranspiler({
      objects,
      titleDescription: title,
    });

    if (result) {
      setGameQuestions(result.questions);
    }
  }, [objects, title]);

  // Generate questions when objects are loaded
  useEffect(() => {
    if (!loading && objects.length > 0) {
      generateQuestions();
    }
  }, [loading, objects, generateQuestions]);

  const currentQuestion = gameQuestions[currentQuestionIndex];
  const totalQuestions = gameQuestions.length;

  // Initialize shuffled options for current question
  useEffect(() => {
    if (currentQuestion) {
      setShuffledOptions(shuffle([...currentQuestion.options]));
      optionRefs.current = new Array(currentQuestion.options.length).fill(null);
    }
  }, [currentQuestionIndex, currentQuestion]);

  const handleTimeUp = useCallback(() => {
    if (!gameComplete) {
      setGameComplete(true);
      setShowResults(true);
    }
  }, [gameComplete]);

  const handleGameComplete = useCallback((stats: GameStats) => {
    setGameComplete(true);
    setShowResults(true);
  }, []);

  const handleAnswerSelect = (selectedDefinition: string) => {
    if (showFeedback || !currentQuestion) return;

    setSelectedAnswer(selectedDefinition);
    const isCorrect = selectedDefinition === currentQuestion.definition;

    // Add to completed questions
    setCompletedQuestions((prev) => new Set([...prev, currentQuestionIndex]));

    if (!isCorrect) {
      setIncorrectQuestions((prev) => new Set([...prev, currentQuestionIndex]));
    }

    const newAnswer: UserAnswer = {
      word: currentQuestion.word,
      selectedDefinition,
      correctDefinition: currentQuestion.definition,
      isCorrect,
      timeStamp: Date.now(),
    };

    setUserAnswers((prev) => [...prev, newAnswer]);
    setAnswerFeedback(isCorrect ? "correct" : "incorrect");
    setShowFeedback(true);

    // Play sound effect
    if (isCorrect) {
      playSound("correct");
    } else {
      playSound("failure");
    }

    // Auto-advance to next question or complete game
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
        setAnswerFeedback(null);
      } else {
        setGameComplete(true);
        setShowResults(true);
      }
    }, 1500);
  };

  const resetActivity = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setGameComplete(false);
    setCompletedQuestions(new Set());
    setIncorrectQuestions(new Set());
    setShowResults(false);
    setAnswerFeedback(null);

    if (isGameMode) {
      // Track completed objects and refetch new ones
      const currentObjectIds = objects.map((obj) => obj.id);
      setCompletedObjectIds((prev) => [...prev, ...currentObjectIds]);
      refetch([...completedObjectIds, ...currentObjectIds]);
    } else {
      // Regenerate questions from existing objects
      generateQuestions();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-500">
          Error loading questions: {error}
        </div>
      </div>
    );
  }

  if (gameQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">No questions available</div>
      </div>
    );
  }

  return (
    <GameModeWrapper
      isGameMode={isGameMode}
      totalQuestions={totalQuestions}
      completedQuestions={completedQuestions}
      incorrectQuestions={incorrectQuestions}
      totalTimeLimit={gameTimeLimit}
      onTimeUp={handleTimeUp}
      onGameComplete={handleGameComplete}
      showTimer={isGameMode}
      showProgress={isGameMode}
    >
      <div className="h-full flex flex-col">
        <ActivityTitle title={title} />

        {!showResults && !gameComplete && (
          <>
            <div
              className="flex-1 bg-white rounded-xl p-4 shadow-sm relative"
              style={{ fontSize: fontSize ? `${fontSize}px` : "20px" }}
            >
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
                  className="h-full"
                >
                  <div className="grid grid-cols-2 gap-8 h-full">
                    {/* Word Section */}
                    <div className="flex items-center justify-center">
                      <motion.div
                        ref={wordRef}
                        className="text-center p-8 bg-picton-blue-50 rounded-xl border-2 border-picton-blue-200"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h2 className="font-bold text-picton-blue-700">
                          {currentQuestion?.word}
                        </h2>
                      </motion.div>
                    </div>

                    {/* Options Section */}
                    <div className="space-y-4 flex flex-col justify-center">
                      <div className="space-y-3">
                        {shuffledOptions.map((option, index) => {
                          const isSelected = selectedAnswer === option;
                          const isCorrect =
                            option === currentQuestion?.definition;
                          const showCorrectAnswer = showFeedback && isCorrect;
                          const showIncorrectAnswer =
                            showFeedback && isSelected && !isCorrect;

                          return (
                            <motion.div
                              key={`${option}-${index}`}
                              ref={(el) => {
                                if (optionRefs.current) {
                                  optionRefs.current[index] = el;
                                }
                              }}
                              onClick={() =>
                                !showFeedback && handleAnswerSelect(option)
                              }
                              className={cn(
                                "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
                                {
                                  "border-green-500 bg-green-500 text-white":
                                    showCorrectAnswer,
                                  "border-red-500 bg-red-500 text-white":
                                    showIncorrectAnswer,
                                  "border-picton-blue-500 bg-picton-blue-500 text-white":
                                    isSelected && !showFeedback,
                                  "border-picton-blue-300 text-picton-blue-700 hover:bg-picton-blue-50":
                                    !isSelected && !showFeedback,
                                  "cursor-not-allowed": showFeedback,
                                },
                              )}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option}</span>
                                {showFeedback && isCorrect && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    <Check className="text-white" size={20} />
                                  </motion.div>
                                )}
                                {showFeedback && isSelected && !isCorrect && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                  >
                                    <X className="text-white" size={20} />
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Feedback Message */}
                      <AnimatePresence>
                        {showFeedback && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mt-6 text-center"
                          >
                            <p
                              className={cn("text-lg font-bold", {
                                "text-green-600": answerFeedback === "correct",
                                "text-red-600": answerFeedback === "incorrect",
                              })}
                            >
                              {answerFeedback === "correct"
                                ? "🎉 Correct!"
                                : "❌ Incorrect!"}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex justify-center gap-4">
                {gameQuestions.map((question, index) => {
                  const userAnswer = userAnswers.find(
                    (a) => a.word === question.word,
                  );
                  const isAnswered = !!userAnswer;
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
                        (userAnswer.isCorrect ? (
                          <Check className="text-green-500" size={24} />
                        ) : (
                          <X className="text-red-500" size={24} />
                        ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Results */}
        {showResults && (
          <div className="w-full space-y-6">
            {/* Results Summary */}
            <div className="w-full space-y-3">
              {gameQuestions.map((question, idx) => {
                const userAnswer = userAnswers.find(
                  (a) => a.word === question.word,
                );

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border-2 flex items-center gap-3",
                      userAnswer?.isCorrect
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                        userAnswer?.isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {userAnswer?.isCorrect ? (
                        <Check size={18} />
                      ) : (
                        <X size={18} />
                      )}
                    </div>

                    <div className="flex-1">
                      <p
                        className={cn("font-semibold", {
                          "mb-2": feedback === "wrong-correct-answers",
                        })}
                      >
                        {question.word}
                      </p>

                      {feedback === "wrong-correct-answers" && (
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Correct Definition:</strong>{" "}
                            {question.definition}
                          </div>
                          {userAnswer && !userAnswer.isCorrect && (
                            <div className="text-red-600">
                              <strong>Your Answer:</strong>{" "}
                              {userAnswer.selectedDefinition}
                            </div>
                          )}
                          {!userAnswer && (
                            <div className="text-red-600">
                              <strong>No answer given</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Score and Restart */}
            <ActivityResults
              score={userAnswers.filter((answer) => answer.isCorrect).length}
              total={totalQuestions}
              onRestart={resetActivity}
            />
          </div>
        )}

        {/* Results Alert Dialog */}
        <ActivityResultsAlertDialog
          open={showResults}
          onOpenChange={(open) => {
            if (!open) {
              setShowResults(false);
            }
          }}
          score={userAnswers.filter((answer) => answer.isCorrect).length}
          total={totalQuestions}
        />
      </div>
    </GameModeWrapper>
  );
};

export default MissingDefinitions;
