"use client";

import { motion, LayoutGroup } from "motion/react";
import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";

// Local imports
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

// Internal state types (mutable)
type InternalWord = {
  id: number;
  text: string;
  isCorrect: boolean;
  userSelected: boolean;
};

type InternalQuestion = {
  id: number;
  words: InternalWord[];
  userAnswered: boolean;
  isCorrect: boolean;
};

// Props types (immutable data from parent)
type TWord = {
  id: number;
  text: string;
  isCorrect: boolean;
};

type TQuestion = {
  id: number;
  words: TWord[];
};

type StrikeOutOddOneActivityProps = {
  /** Feedback mode - determines how results are shown */
  feedback?: FeedbackType;
  /** Questions data containing title and array of questions */
  questions: {
    title: string;
    fontSize?: string;
    questions: TQuestion[];
  };
};

const StrikeOutOddOneActivity = ({
  feedback,
  questions,
}: StrikeOutOddOneActivityProps) => {
  // Initialize internal state from props
  const initializeQuestions = (): InternalQuestion[] => {
    return questions.questions.map((q) => ({
      id: q.id,
      words: shuffle(
        q.words.map((w) => ({
          id: w.id,
          text: w.text,
          isCorrect: w.isCorrect,
          userSelected: false,
        })),
      ),
      userAnswered: false,
      isCorrect: false,
    }));
  };

  const [currentQuestions, setCurrentQuestions] =
    useState<InternalQuestion[]>(initializeQuestions);
  const [showResultsDialog, setShowResultsDialog] = useState<boolean>(false);
  const [allAnswered, setAllAnswered] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  // Audio references
  const { playSound } = useSoundEffects();

  // Calculate score
  const score = currentQuestions.filter((q) => q.isCorrect).length;
  const total = currentQuestions.length;

  // Check if all questions are answered
  useEffect(() => {
    const answeredQuestions = currentQuestions.filter((q) => q.userAnswered);
    if (
      answeredQuestions.length === total &&
      total > 0 &&
      !showResultsDialog &&
      !allAnswered
    ) {
      setAllAnswered(true);
      setShowResultsDialog(true);
      // Play success sound when all questions are answered
      playSound("success");
    }
  }, [currentQuestions, total, showResultsDialog, allAnswered]);

  // Handle word selection (strike out)
  const handleWordClick = (questionId: number, wordId: number) => {
    const question = currentQuestions.find((q) => q.id === questionId);
    if (!question) return;

    const word = question.words.find((w) => w.id === wordId);
    if (!word) return;

    setCurrentQuestions((prevQuestions) =>
      prevQuestions.map((q) => {
        if (q.id === questionId) {
          const updatedWords = q.words.map((w) => {
            if (w.id === wordId) {
              // Toggle the clicked word
              return { ...w, userSelected: !w.userSelected };
            } else {
              // Deselect all other words in this question
              return { ...w, userSelected: false };
            }
          });

          const selectedWords = updatedWords.filter((w) => w.userSelected);
          const correctWord = updatedWords.find((w) => w.isCorrect);

          // If no words are selected, mark as unanswered
          if (selectedWords.length === 0) {
            return {
              ...q,
              words: updatedWords,
              userAnswered: false,
              isCorrect: false,
            };
          }

          // If exactly one word is selected, mark as answered and check correctness
          if (selectedWords.length === 1) {
            const userAnsweredCorrectly =
              selectedWords[0].id === correctWord?.id;
            return {
              ...q,
              words: updatedWords,
              userAnswered: true,
              isCorrect: userAnsweredCorrectly,
            };
          }

          // This should never happen with the new logic, but keep as fallback
          return {
            ...q,
            words: updatedWords,
            userAnswered: true,
            isCorrect: false,
          };
        }
        return q;
      }),
    );

    playSound("click");
  };

  // Handle restart/play again
  const handlePlayAgain = () => {
    setCurrentQuestions(shuffle(initializeQuestions()));
    setShowResultsDialog(false);
    setAllAnswered(false);
    setShowFeedback(false);
  };

  // Handle results dialog close
  const handleResultsClose = () => {
    setShowResultsDialog(false);
    // Show feedback after closing dialog
    setShowFeedback(true);
  };

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={questions.title} />

      <div
        className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-picton-blue-50 to-white"
        style={{
          fontSize: questions.fontSize ? `${questions.fontSize}px` : "18px",
        }}
      >
        <LayoutGroup>
          <div className="max-w-6xl mx-auto space-y-3">
            {currentQuestions.map((question, questionIndex) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: questionIndex * 0.1 }}
                className="flex items-center gap-6"
              >
                {/* Question Number */}
                <h3 className="font-semibold text-neutral-800">
                  {questionIndex + 1}.
                </h3>
                {/* <div className="flex items-center gap-3"></div> */}

                {/* Words Grid */}
                <div
                  className={cn(
                    "grid gap-4 flex-1",
                    `grid-cols-${question.words.length}`,
                  )}
                >
                  {question.words.map((word) => (
                    <motion.div
                      key={word.id}
                      layoutId={`word-${question.id}-${word.id}`}
                      whileHover={
                        !question.userAnswered
                          ? { scale: 1.05, transition: { duration: 0.2 } }
                          : {}
                      }
                      whileTap={!question.userAnswered ? { scale: 0.95 } : {}}
                      className={cn(
                        "relative cursor-pointer grow p-4 rounded-lg text-center font-medium transition-all duration-300 shadow-md hover:shadow-lg bg-picton-blue-100 hover:bg-picton-blue-200",
                        {
                          // Selected by user (struck out) - neutral color until feedback is shown
                          "bg-neutral-100 border-neutral-300 text-neutral-700":
                            word.userSelected && !showFeedback,

                          // After dialog closed - wrong-correct feedback (show colors for all questions)
                          "bg-green-100 border-green-400 text-green-700":
                            showFeedback &&
                            feedback === "wrong-correct" &&
                            question.isCorrect,

                          "bg-red-100 border-red-300 text-red-700":
                            showFeedback &&
                            feedback === "wrong-correct" &&
                            !question.isCorrect,

                          // After dialog closed - wrong-correct-answers feedback (detailed colors)
                          "bg-green-100 border-green-400":
                            showFeedback &&
                            feedback === "wrong-correct-answers" &&
                            word.isCorrect,

                          "bg-red-200 border-red-400":
                            showFeedback &&
                            feedback === "wrong-correct-answers" &&
                            word.userSelected &&
                            !word.isCorrect,

                          // Remove pointer-events-none when feedback is not shown (allow toggling)
                          "pointer-events-none": showFeedback,
                        },
                      )}
                      onClick={() => handleWordClick(question.id, word.id)}
                    >
                      {/* Strike-through effect */}
                      <div className="relative">
                        <span
                          className={cn({
                            "line-through": word.userSelected,
                          })}
                        >
                          {word.text}
                        </span>

                        {/* Strike-through line animation */}
                        {word.userSelected && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 origin-left"
                          />
                        )}
                      </div>

                      {/* Correct indicator - only show after dialog closed and feedback is wrong-correct-answers */}
                      {showFeedback &&
                        feedback === "wrong-correct-answers" &&
                        word.isCorrect && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                          >
                            <Check className="w-3 h-3" />
                          </motion.div>
                        )}

                      {/* Wrong selection indicator - only show after dialog closed and feedback is wrong-correct-answers */}
                      {showFeedback &&
                        feedback === "wrong-correct-answers" &&
                        word.userSelected &&
                        !word.isCorrect && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <X className="w-3 h-3" />
                          </motion.div>
                        )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </LayoutGroup>

        {/* Play Again Button */}
        {showFeedback && (
          <ActivityResults
            score={score}
            total={total}
            className="bg-picton-blue-50 shadow-none"
            onRestart={handlePlayAgain}
          />
        )}
      </div>

      {/* Results Dialog */}
      <ActivityResultsAlertDialog
        score={score}
        total={total}
        open={showResultsDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleResultsClose();
          }
        }}
      />
    </div>
  );
};

export default StrikeOutOddOneActivity;
