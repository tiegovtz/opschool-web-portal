"use client";

import { Check, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { DragEndEvent, useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "motion/react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import Draggable from "../../../../../../tie_open_school_primary_frontend/components/ui/dnd/draggable";
import DNDContext from "../../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import { DroppableProps } from "../../../../../../tie_open_school_primary_frontend/components/ui/dnd/droppable";
import ActivityTitle from "../../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { GameModeWrapper, GameStats } from "@/components/ui/game-mode";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../../tie_open_school_primary_frontend/components/templates/results";
import { FeedbackType } from "@/lib/types/activity-types";

type Question = {
  id: string;
  min: number;
  max: number;
  numbers: number[];
  correctOrder: number[];
};

type AscendingOrderGameProps = {
  feedback: FeedbackType;
  questions: {
    title: string;
    questions: Question[];
    isGameMode?: boolean;
    gameTimeLimit?: number;
  };
};

const Droppable = ({ id, data, children, ...props }: DroppableProps) => {
  const { isOver, setNodeRef, over, active } = useDroppable({
    id,
    data,
  });

  const isCorrect =
    over?.data?.current?.accepts === active?.data?.current?.type;

  return (
    <div
      {...props}
      ref={setNodeRef}
      className={cn(props.className, { "bg-lemon-100": isOver && isCorrect })}
      id={id}
    >
      {children}
    </div>
  );
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

const AscendingOrderGame = ({
  feedback,
  questions: questionsData,
}: AscendingOrderGameProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [incorrectQuestions, setIncorrectQuestions] = useState<Set<number>>(
    new Set(),
  );

  // Current question state - exactly like rearrange dragging
  const [questionState, setQuestionState] = useState<{
    id: string;
    availableNumbers: (number | string)[];
    answer: (number | string)[];
  }>({
    id: "",
    availableNumbers: [],
    answer: [],
  });

  const { playSound } = useSoundEffects();

  const currentQuestion = questionsData.questions[currentQuestionIndex];
  const totalQuestions = questionsData.questions.length;
  const isGameMode = questionsData.isGameMode || false;
  const gameTimeLimit = questionsData.gameTimeLimit || 300;

  // Initialize current question - exactly like rearrange dragging
  useEffect(() => {
    if (currentQuestion) {
      setQuestionState({
        id: currentQuestion.id,
        availableNumbers: shuffle([...currentQuestion.numbers]),
        answer: Array(currentQuestion.numbers.length).fill(""),
      });
    }
  }, [currentQuestionIndex, currentQuestion]);

  // Check if current question is answered and correct
  useEffect(() => {
    if (questionState.answer.every((a) => a) && currentQuestion) {
      const isCorrect =
        questionState.answer.length === currentQuestion.correctOrder.length &&
        questionState.answer.every(
          (a, i) => a !== "" && a === currentQuestion.correctOrder[i],
        );

      // Add to completed questions
      setCompletedQuestions((prev) => new Set([...prev, currentQuestionIndex]));

      if (!isCorrect) {
        setIncorrectQuestions(
          (prev) => new Set([...prev, currentQuestionIndex]),
        );
      } else {
        setScore((prev) => prev + 1);
      }

      playSound(isCorrect ? "success" : "failure");

      // Auto-advance to next question after delay
      setTimeout(() => {
        if (currentQuestionIndex < totalQuestions - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          setAllAnswered(true);
          setGameComplete(true);
        }
      }, 1500);
    }
  }, [
    questionState.answer,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
  ]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over?.data?.current?.accepts === active?.data?.current?.type) {
      const index = String(over?.id).split("%")[1];
      const number = parseInt(String(active.id).split("%")[1]);

      const newAnswer = questionState.answer.map((a, i) => {
        if (i === parseInt(index)) {
          return number;
        }

        if (a === number) {
          return "";
        }
        return a;
      });

      const newAvailableNumbers = questionState.availableNumbers.map((n) => {
        if (n === number) {
          return "";
        }
        return n;
      });

      setQuestionState({
        ...questionState,
        availableNumbers: newAvailableNumbers,
        answer: newAnswer,
      });
    }
  };

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

  const resetActivity = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setAllAnswered(false);
    setShowResults(false);
    setGameComplete(false);
    setCompletedQuestions(new Set());
    setIncorrectQuestions(new Set());
  };

  if (!currentQuestion) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            No questions available
          </h2>
          <p className="text-gray-600">
            Please check the activity configuration.
          </p>
        </div>
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
      className="h-full flex flex-col"
    >
      <ActivityTitle title={questionsData.title} />

      <div className="flex-1 h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            variants={questionVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <DNDContext onDragEnd={showResults ? () => {} : handleDragEnd}>
              <div
                className={cn(
                  "flex items-center gap-4 p-6 relative rounded-lg transition-all duration-300 bg-white border",
                  showResults && allAnswered
                    ? score === totalQuestions
                      ? "bg-green-50 border-green-200"
                      : "bg-yellow-50 border-yellow-200"
                    : "border-gray-200",
                )}
              >
                <div className="flex-1 flex flex-col gap-6">
                  {/* Available Numbers - exactly like rearrange dragging */}
                  {questionState.availableNumbers.length > 0 &&
                    questionState.availableNumbers.some((number) => number) && (
                      <div className="flex gap-2 xl:gap-6 flex-1 flex-wrap">
                        {questionState.availableNumbers.map((number, index) => {
                          if (!number)
                            return (
                              <div
                                key={index}
                                className="min-h-12 flex-1 p-3"
                              />
                            );

                          return (
                            <Draggable
                              key={index}
                              id={questionState.id + "%" + number + "%" + index}
                              data={{
                                type: questionState.id,
                              }}
                              className={cn(
                                "p-3 min-h-12 flex items-center flex-1 rounded-lg justify-center text-lg font-bold",
                                showResults
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : "bg-picton-blue-200 hover:bg-picton-blue-300 cursor-move",
                              )}
                              disabled={showResults}
                            >
                              {number}
                            </Draggable>
                          );
                        })}
                      </div>
                    )}

                  {/* Answer slots - exactly like rearrange dragging */}
                  <div className="flex gap-2 xl:gap-6 flex-1">
                    {questionState.answer.map((number, index) => {
                      if (number) {
                        const isCorrectPosition =
                          showResults &&
                          allAnswered &&
                          number === currentQuestion.correctOrder[index];

                        return (
                          <Draggable
                            key={index}
                            id={questionState.id + "%" + number + "%" + index}
                            data={{
                              type: questionState.id,
                            }}
                            className={cn(
                              "p-3 flex-1 flex items-center justify-center rounded-lg text-lg font-bold",
                              showResults && allAnswered
                                ? isCorrectPosition
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                : "bg-lemon-100 text-lemon-700 cursor-move",
                            )}
                            disabled={showResults}
                          >
                            {number}
                          </Draggable>
                        );
                      }

                      return (
                        <Droppable
                          key={index}
                          id={questionState.id + "%" + index}
                          data={{
                            accepts: questionState.id,
                          }}
                          className={cn(
                            "border-b min-h-12 border-dashed rounded-lg flex-1 px-2 py-6",
                            showResults ? "bg-gray-100" : "bg-picton-blue-100",
                          )}
                        >
                          {questionState.answer[index]}
                        </Droppable>
                      );
                    })}
                  </div>

                  {/* Show correct answer if wrong */}
                  {showResults &&
                    allAnswered &&
                    feedback === "wrong-correct-answers" &&
                    !questionState.answer.every(
                      (a, i) => a === currentQuestion.correctOrder[i],
                    ) && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">
                          Correct answer:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {currentQuestion.correctOrder.map((number, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm font-medium"
                            >
                              {number}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Success/Failure indicator */}
                {showResults && allAnswered && (
                  <div
                    className={cn(
                      "absolute -right-2 -top-2 flex items-center justify-center rounded-full p-1 w-8 h-8",
                      score === totalQuestions
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600",
                    )}
                  >
                    {score === totalQuestions ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-xs font-bold">{score}</span>
                    )}
                  </div>
                )}
              </div>
            </DNDContext>
          </motion.div>
        </AnimatePresence>

        {/* Results */}
        {showResults && !isGameMode && (
          <ActivityResults
            score={score}
            total={totalQuestions}
            onRestart={resetActivity}
          />
        )}
      </div>

      {/* Alert Dialog */}
      <ActivityResultsAlertDialog
        score={score}
        total={totalQuestions}
        open={allAnswered && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </GameModeWrapper>
  );
};

export default AscendingOrderGame;
