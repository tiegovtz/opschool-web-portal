"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { Input } from "../../../../../../tie_open_school_primary_frontend/components/ui/inputs/input";
import { useExamContext } from "@/shared/context/exam-context";
import { QuestionAnswer } from "@/shared/context/exam-context";

export type ExamRearrangeStepsVerticallyProps = {
  questions: {
    title: string;
    questions: {
      id: string;
      text: string;
      order: number;
    }[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const ExamRearrangeStepsVertically = ({
  questions,
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamRearrangeStepsVerticallyProps) => {
  const [order, setOrder] = useState<Record<string, string>>({});

  const { collectAnswers, updateActivityScore } = useExamContext();

  const totalQuestions = questions.questions.length;

  // Calculate score for this activity
  const calculateScore = () => {
    let score = 0;
    const detailedAnswers: QuestionAnswer[] = [];

    questions.questions.forEach((question) => {
      const userAnswer = order[question.id] || "";
      const correctAnswer = question.order.toString();
      const isCorrect = !!(userAnswer && Number(userAnswer) === question.order);

      if (isCorrect) {
        score++;
      }

      // Store detailed answer information
      detailedAnswers.push({
        questionId: question.id,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect,
        question: question.text,
        options: [],
      });
    });

    return { score, answers: detailedAnswers };
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
  }, [collectAnswers, order]);

  // Update parent component state immediately for visual feedback
  useEffect(() => {
    const answeredCount = Object.keys(order).filter(
      (key) => order[key]?.trim() !== "",
    ).length;

    onStateUpdate?.(totalQuestions, answeredCount);
  }, [order, totalQuestions]);

  // Handle input change
  const handleChange = (questionId: string, value: string) => {
    if (value === "") {
      setOrder((prev) => ({
        ...prev,
        [questionId]: "",
      }));
    } else if (
      !isNaN(Number(value)) &&
      Number(value) > 0 &&
      Number(value) <= totalQuestions
    ) {
      setOrder((prev) => ({
        ...prev,
        [questionId]: value,
      }));
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm">
      {/* Questions container - scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {questions.questions.map((question, index) => {
            const userAnswer = order[question.id] || "";
            const hasAnswer = userAnswer.trim() !== "";

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  {/* Step number input */}
                  <div className="relative flex-shrink-0">
                    <Input
                      type="number"
                      min="1"
                      max={totalQuestions}
                      value={userAnswer}
                      onChange={(e) =>
                        handleChange(question.id, e.target.value)
                      }
                      className={cn(
                        "w-16 h-16 no-number-input-arrows text-center text-2xl font-bold border-2",
                        hasAnswer
                          ? "bg-picton-blue-100 border-picton-blue-500 text-picton-blue-700"
                          : "bg-gray-100 border-gray-300 text-gray-600",
                      )}
                      placeholder=""
                    />
                  </div>

                  {/* Question text */}
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed text-gray-800">
                      {question.text}
                    </p>
                  </div>

                  {/* Visual indicator */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      hasAnswer
                        ? "bg-picton-blue-500 text-white"
                        : "bg-gray-200 text-gray-600",
                    )}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Instructions footer */}
      {/*<div className="p-4 border-t bg-picton-blue-50">
        <p className="text-sm text-picton-blue-700 text-center">
          <strong>Instructions:</strong> Enter numbers from 1 to{" "}
          {totalQuestions} to arrange the steps in the correct order.
        </p>
      </div>*/}
    </div>
  );
};

export default ExamRearrangeStepsVertically;
