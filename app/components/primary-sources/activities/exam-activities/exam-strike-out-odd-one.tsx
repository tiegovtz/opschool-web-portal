"use client";

import React, { useEffect, useState } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { useExamContext } from "@/shared/context/exam-context";

// Define types for our data structure
type Word = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  words: Word[];
};

type UserSelection = {
  questionId: string;
  selectedWordId: string | null;
};

export type ExamStrikeOutOddOneProps = {
  questions: {
    title: string;
    questions: Question[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const ExamStrikeOutOddOne = ({
  questions,
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamStrikeOutOddOneProps) => {
  const [userSelections, setUserSelections] = useState<UserSelection[]>([]);

  const { collectAnswers, updateActivityScore } = useExamContext();

  const totalQuestions = questions.questions.length;

  // Initialize user selections
  useEffect(() => {
    const initialSelections = questions.questions.map((question) => ({
      questionId: question.id,
      selectedWordId: null,
    }));
    setUserSelections(initialSelections);
  }, [questions.questions]);

  // Calculate score for this activity
  const calculateScore = () => {
    let score = 0;
    questions.questions.forEach((question) => {
      const userSelection = userSelections.find(
        (selection) => selection.questionId === question.id,
      );

      if (userSelection?.selectedWordId) {
        const selectedWord = question.words.find(
          (word) => word.id === userSelection.selectedWordId,
        );
        if (selectedWord?.isCorrect) {
          score++;
        }
      }
    });

    return { score };
  };

  // Update exam context whenever answers change
  useEffect(() => {
    if (!collectAnswers || userSelections.length === 0) return;

    const { score } = calculateScore();

    updateActivityScore(activityIndex, {
      activityId,
      activityIndex,
      score,
      totalQuestions,
    });
  }, [
    collectAnswers,
    userSelections,
    activityIndex,
    activityId,
    totalQuestions,
  ]);

  // Update parent component state for visual feedback
  useEffect(() => {
    const answeredCount = userSelections.filter(
      (selection) => selection.selectedWordId !== null,
    ).length;

    onStateUpdate?.(totalQuestions, answeredCount);
  }, [userSelections, totalQuestions]);

  // Handle word selection (strike out)
  const handleWordClick = (questionId: string, wordId: string) => {
    setUserSelections((prevSelections) =>
      prevSelections.map((selection) => {
        if (selection.questionId === questionId) {
          // Toggle selection: if clicking the same word, deselect it; otherwise select the new word
          return {
            ...selection,
            selectedWordId: selection.selectedWordId === wordId ? null : wordId,
          };
        }
        return selection;
      }),
    );
  };

  // Get user selection for a question
  const getUserSelection = (questionId: string) => {
    return userSelections.find(
      (selection) => selection.questionId === questionId,
    );
  };

  // Check if a word is selected
  const isWordSelected = (questionId: string, wordId: string) => {
    const selection = getUserSelection(questionId);
    return selection?.selectedWordId === wordId;
  };

  // Check if a question has been answered
  const isQuestionAnswered = (questionId: string) => {
    const selection = getUserSelection(questionId);
    return selection?.selectedWordId !== null;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-b-xl shadow-sm">
      {/* Content container - scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {questions.questions.map((question, questionIndex) => {
            const hasAnswer = isQuestionAnswered(question.id);

            return (
              <div
                key={question.id}
                className={cn(
                  "flex items-center gap-6 border rounded-lg p-6 transition-colors",
                  hasAnswer
                    ? "bg-picton-blue-50 border-picton-blue-200"
                    : "bg-gray-50 border-gray-200",
                )}
              >
                {/* Question Header */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                    hasAnswer
                      ? "bg-picton-blue-500 text-white"
                      : "bg-gray-300 text-gray-600",
                  )}
                >
                  {questionIndex + 1}
                </div>

                {/* Words Grid */}
                <div
                  className={cn(
                    "grid gap-4 flex-1",
                    question.words.length <= 4
                      ? `grid-cols-${question.words.length}`
                      : "grid-cols-4",
                  )}
                >
                  {question.words.map((word) => {
                    const isSelected = isWordSelected(question.id, word.id);

                    return (
                      <div
                        key={word.id}
                        className={cn(
                          "relative cursor-pointer p-4 rounded-lg text-center font-medium transition-all duration-300 shadow-sm hover:shadow-md min-h-[60px] flex items-center justify-center border",
                          isSelected
                            ? "bg-gray-200 border-gray-400 text-gray-700"
                            : "bg-white border-gray-300 hover:bg-picton-blue-50 hover:border-picton-blue-300",
                        )}
                        onClick={() => handleWordClick(question.id, word.id)}
                      >
                        {/* Word Text with Strike-through effect */}
                        <div className="relative">
                          <span
                            className={cn("text-lg", {
                              "line-through": isSelected,
                            })}
                          >
                            {word.text}
                          </span>

                          {/* Animated Strike-through line */}
                          {isSelected && (
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 transform -translate-y-1/2" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamStrikeOutOddOne;
