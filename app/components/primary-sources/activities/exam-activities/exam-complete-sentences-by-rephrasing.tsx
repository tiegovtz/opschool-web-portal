"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

// Local imports
import { cn, toRoman } from "@/lib/utils";
import { useExamContext } from "@/shared/context/exam-context";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { QuestionAnswer } from "@/shared/context/exam-context";
import { useWindowSize } from "@/shared/hooks/use-window-size";
import { ActivityType } from "@/lib/types/activity-types";
import { QuestionRenderer } from "@/components/activity-helpers";

export type ExamCompleteSentencesByRephrasingProps = {
  questions: {
    title: string;
    fontSize?: number;
    algorithm: ActivityType;
    questions: {
      id: string;
      question: string;
      answer: string[];
      image?: string | null;
    }[];
    options?: string[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const answerChecker = new AnswerChecker();

const ExamCompleteSentencesByRephrasing = ({
  questions,
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamCompleteSentencesByRephrasingProps) => {
  const { width } = useWindowSize();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { collectAnswers, updateActivityScore } = useExamContext();

  const totalQuestions = questions.questions.length;

  // Check answer based on algorithm type
  const checkAnswer = (userAnswer: string, question: { answer: string[] }) => {
    // Split user answers by comma and trim each answer
    const userAnswers = userAnswer
      .split("|")
      .map((ans: string) => ans.trim().toLowerCase());
    const correctAnswers = question.answer.map((ans: string) =>
      ans.toLowerCase(),
    );

    // Check if all answers match their corresponding correct answers
    return (
      (questions.algorithm === ActivityType.CompleteSentencesByRephrasing ||
        questions.algorithm ===
          ActivityType.CompleteSentenceByRephrasingWithChoices ||
        userAnswers.length === correctAnswers.length) &&
      userAnswers.every(
        (ans: string, i: number) =>
          answerChecker.checkAnswer(ans, {
            acceptedAnswers:
              questions.algorithm ===
                ActivityType.CompleteSentencesByRephrasing ||
              questions.algorithm ===
                ActivityType.CompleteSentenceByRephrasingWithChoices
                ? correctAnswers
                : [correctAnswers[i]],
            strictMode: true,
          }).isCorrect,
      )
    );
  };

  // Calculate score for this activity using AI answer checking
  const calculateScore = async () => {
    let score = 0;
    const detailedAnswers: QuestionAnswer[] = [];

    questions.questions.forEach((question) => {
      const userAnswerString = answers[question.id] || "";
      const isCorrect = checkAnswer(userAnswerString, question);

      if (isCorrect) {
        score++;
      }

      // Store detailed answer information
      detailedAnswers.push({
        questionId: question.id,
        userAnswer: userAnswerString,
        correctAnswer: question.answer.join("| "),
        isCorrect,
        question: question.question,
        options: questions.options || [],
      });
    });

    return { score, answers: detailedAnswers };
  };

  // Update exam context whenever answers change (with debouncing for AI calls)
  useEffect(() => {
    if (!collectAnswers) return;

    const updateScore = async () => {
      const { score, answers } = await calculateScore();

      updateActivityScore(activityIndex, {
        activityId,
        activityIndex,
        score,
        totalQuestions,
        answers,
      });
    };

    updateScore();
  }, [collectAnswers, answers]);

  // Update parent component state immediately for visual feedback
  useEffect(() => {
    const answeredCount = Object.keys(answers).filter(
      (key) => answers[key]?.trim() !== "",
    ).length;

    onStateUpdate?.(totalQuestions, answeredCount);
  }, [answers, totalQuestions]);

  // Handle input change for multiple blanks in a question
  const handleInputChange = (
    questionId: string,
    blankIndex: number,
    value: string,
  ) => {
    setAnswers((prev) => {
      const currentAnswerString = prev[questionId] || "";
      const currentAnswers = currentAnswerString.split("|");

      // Ensure array has enough elements
      while (currentAnswers.length <= blankIndex) {
        currentAnswers.push("");
      }

      currentAnswers[blankIndex] = value;

      return {
        ...prev,
        [questionId]: currentAnswers.join("|"),
      };
    });
  };

  // Handle input change for single blank (with choices algorithm)
  const handleSingleInputChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Render question with input fields for blanks
  const renderQuestion = (
    questionText: string,
    questionId: string,
    questionAnswers: string[],
  ) => {
    // Get current answers for this question
    const currentAnswerString = answers[questionId] || "";
    const currentAnswers = currentAnswerString.split("|");

    const handleBlankChange = (blankIndex: number, value: string) => {
      // For with choices algorithm, use single input handling
      if (
        questions.algorithm ===
        ActivityType.CompleteSentenceByRephrasingWithChoices
      ) {
        handleSingleInputChange(questionId, value);
      } else {
        handleInputChange(questionId, blankIndex, value);
      }
    };

    return (
      <QuestionRenderer
        question={questionText}
        answers={questionAnswers}
        userAnswers={currentAnswers}
        mode="exam"
        screenWidth={width}
        onBlankChange={handleBlankChange}
        highlightClassName="bg-lemon-100 text-lemon-700"
      />
    );
  };

  return (
    <div
      className="h-full flex flex-col bg-white rounded-b-xl shadow-sm"
      style={{
        fontSize: questions.fontSize ? `${questions.fontSize}px` : "20px",
      }}
    >
      {/* Options section - show at top for with choices algorithm */}
      {questions.options &&
        questions.options.length > 0 &&
        questions.algorithm ===
          ActivityType.CompleteSentenceByRephrasingWithChoices && (
          <div className="p-4 pb-2">
            <div className="flex flex-wrap gap-2 border-2 border-picton-blue-300 bg-picton-blue-100 w-fit py-4 rounded">
              {questions.options.map((option, index) => (
                <div
                  key={index}
                  className="text-picton-blue-700 leading-4 px-3"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Questions container - scrollable */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4">
        <div className="space-y-8">
          {questions.questions.map((question, questionIndex) => {
            const userAnswer = answers[question.id] || "";
            const hasAnswer = userAnswer.trim() !== "";

            return (
              <motion.div
                key={questionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: questionIndex * 0.1 }}
                className="border rounded-lg p-2 md:flex-1 bg-neutral-50"
              >
                <div className="flex flex-col md:flex-row items-center justify-between md:gap-2">
                  <div>
                    <p
                      className={cn(
                        "w-6 md:w-8 h-6 md:h-8 rounded-full mr-1 inline-flex items-center justify-center font-bold text-sm flex-shrink-0",
                        hasAnswer
                          ? "bg-picton-blue-500 text-white"
                          : "bg-gray-200 text-gray-600",
                      )}
                    >
                      {toRoman(questionIndex + 1)}{" "}
                    </p>
                    <div className="inline">
                      {renderQuestion(
                        question.question,
                        question.id,
                        question.answer,
                      )}
                    </div>
                  </div>
                  {question.image && (
                    <div className="min-w-[150px] h-32 md:h-28">
                      <img
                        src={question.image}
                        alt={question.question}
                        className="w-full h-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Options section - show at bottom for other algorithms */}
      {questions.options &&
        questions.options.length > 0 &&
        questions.algorithm !==
          ActivityType.CompleteSentenceByRephrasingWithChoices && (
          <div className="p-4 py-2 border-t bg-white space-y-1">
            <h3 className="font-semibold text-picton-blue-700">
              Available options:
            </h3>
            <div className="flex flex-wrap gap-2 bg-picton-blue-100 w-fit py-4 rounded">
              {questions.options.map((option, index) => (
                <div
                  key={index}
                  className="text-picton-blue-700 leading-4 px-3"
                >
                  {option}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default ExamCompleteSentencesByRephrasing;
