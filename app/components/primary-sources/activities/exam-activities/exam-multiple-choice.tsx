"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

// Local imports
import { cn, toRoman } from "@/lib/utils";
import { Button } from "../../../../../../tie_open_school_primary_frontend/components/ui/button";
import { useExamContext } from "@/shared/context/exam-context";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { QuestionAnswer } from "@/shared/context/exam-context";

export type ExamMultipleChoiceProps = {
  questions: {
    title: string;
    questions: {
      id: string;
      question: string;
      questionImage?: string;
      options: string[];
      correctAnswer: string;
    }[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const ExamMultipleChoice = ({
  questions,
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamMultipleChoiceProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});

  const { playSound } = useSoundEffects();
  const { collectAnswers, updateActivityScore } = useExamContext();

  const totalQuestions = questions.questions.length;

  // Calculate score for this activity
  const calculateScore = () => {
    let score = 0;
    const answers: QuestionAnswer[] = [];

    questions.questions.forEach((question) => {
      const userAnswer = selectedAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswer;

      if (isCorrect) {
        score++;
      }

      // Store detailed answer information
      answers.push({
        questionId: question.id,
        userAnswer: userAnswer || "",
        correctAnswer: question.correctAnswer,
        isCorrect,
        question: question.question,
        options: question.options,
      });
    });

    return { score, answers };
  };

  // Update exam context whenever answers change
  useEffect(() => {
    if (!collectAnswers) return;

    const { score, answers } = calculateScore();
    updateActivityScore(activityIndex, {
      activityId,
      activityIndex,
      score,
      totalQuestions,
      answers,
    });
  }, [collectAnswers]);

  useEffect(() => {
    const answeredCount = Object.keys(selectedAnswers).length;
    onStateUpdate?.(totalQuestions, answeredCount);
  }, [selectedAnswers]);

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
    playSound("click");
  };

  return (
    <div className="h-full flex flex-col bg-white shadow-sm rounded-b-xl">
      {/* Questions container - scrollable */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4">
        <div className="space-y-8">
          {questions.questions.map((question, questionIndex) => {
            const selectedAnswer = selectedAnswers[question.id];

            return (
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: questionIndex * 0.1 }}
                className="border rounded-lg p-2 md:p-6 bg-gray-50"
              >
                <div className="flex justify-between items-end gap-6">
                  <div className="flex-1">
                    <p className="mb-4">
                      <span
                        className={cn(
                          "w-8 h-8 rounded-full inline-flex mr-2 items-center justify-center text-sm font-bold flex-shrink-0",
                          selectedAnswer
                            ? "bg-picton-blue-500 text-white"
                            : "bg-gray-200 text-gray-600"
                        )}
                      >
                        {toRoman(questionIndex + 1)}{" "}
                        {/* <span className="md:hidden">.</span> */}
                      </span>
                      <span className="text-lg text-picton-blue-700">
                        {question.question}
                      </span>
                    </p>

                    {question.questionImage && (
                      <div className="block md:hidden md:w-1/3 max-w-sm mb-2 md:mb-0">
                        <img
                          src={question.questionImage}
                          alt="Question Image"
                          className="w-full h-auto object-contain rounded-lg border"
                        />
                      </div>
                    )}

                    {/* Answer Options */}
                    <div className="grid gap-2">
                      {question.options.map(
                        (option: string, optionIndex: number) => {
                          const isSelected = selectedAnswer === option;

                          return (
                            <Button
                              key={optionIndex}
                              variant={isSelected ? "default" : "outline"}
                              onClick={() =>
                                handleAnswerSelect(question.id, option)
                              }
                              className={cn(
                                "p-2 md:p-4 h-auto text-left justify-start font-medium min-h-14",
                                {
                                  "bg-picton-blue-500 hover:bg-picton-blue-600 text-white":
                                    isSelected,
                                  "border-gray-300 text-gray-700 hover:bg-gray-50":
                                    !isSelected,
                                }
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                                    isSelected
                                      ? "border-white bg-white"
                                      : "border-gray-400"
                                  )}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-picton-blue-500" />
                                  )}
                                </div>
                                <p className="text-base text-wrap">{option}</p>
                              </div>
                            </Button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {/* Question Image */}
                  {question.questionImage && (
                    <div className="md:block hidden w-1/3 max-w-sm">
                      <img
                        src={question.questionImage}
                        alt="Question Image"
                        className="w-full h-auto object-contain rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamMultipleChoice;
