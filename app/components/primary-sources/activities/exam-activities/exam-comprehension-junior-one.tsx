"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";

// local imports
import { cn, toRoman } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useExamContext } from "@/shared/context/exam-context";

export type ExamComprehensionJuniorOneProps = {
  questions: {
    title: string;
    algorithm: "Comprehension junior one" | "Comprehension junior two";
    notes: string;
    image?: string;
    optionsTitle?: string;
    useAI?: boolean;
    questions: {
      question: string;
      image?: string;
      answers: string[];
      options: {
        id: string;
        text: string;
      }[];
    }[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const answerChecker = new AnswerChecker();

const ExamComprehensionJuniorOne = ({
  questions,
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamComprehensionJuniorOneProps) => {
  const [allUserAnswers, setAllUserAnswers] = useState<
    Record<number, string[]>
  >({});
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false);

  const { collectAnswers, updateActivityScore } = useExamContext();

  // Memoize total questions calculation
  const totalQuestions = useMemo(
    () => questions.questions.length,
    [questions.questions],
  );

  // Memoized answered count for parent updates
  const answeredCount = useMemo(() => {
    return Object.values(allUserAnswers).reduce((total, questionAnswers) => {
      return (
        total + questionAnswers.filter((answer) => answer.trim() !== "").length
      );
    }, 0);
  }, [allUserAnswers]);

  // Calculate score for this activity using AI
  const calculateScoreWithAI = useCallback(async () => {
    try {
      setIsCheckingAnswers(true);

      const allSubmissions: { questionId: string; answer: string }[] = [];
      const allAIQuestions: any[] = [];

      // Create comprehensive context with reading material
      const comprehensionContext = {
        readingMaterial: questions.notes,
        activityTitle: questions.title,
        activityType: "reading-comprehension",
        instructions:
          "Answer based on the provided reading material. Demonstrate understanding of the text content.",
      };

      questions.questions.forEach((question, questionIndex) => {
        const userAnswers = allUserAnswers[questionIndex] || [];

        userAnswers.forEach((answer, answerIndex) => {
          if (!answer.trim()) return; // Skip empty answers

          const submissionId = `q${questionIndex}-a${answerIndex}`;

          allSubmissions.push({
            questionId: submissionId,
            answer: answer.trim(),
          });

          allAIQuestions.push({
            id: submissionId,
            question: question.question,
            context: comprehensionContext,
            acceptedAnswers: question.answers[answerIndex]
              ? [question.answers[answerIndex]]
              : [],
            strictMode: false,
            maxMarks: 1,
            questionType: "reasoning" as const, // Required for AI evaluation
            evaluationCriteria: `Evaluate this comprehension answer based on the provided reading material. The student should demonstrate understanding of the text content. Accept answers that are semantically equivalent to the expected answer or show clear comprehension of the relevant concepts from the reading. Award full marks for correct understanding, partial marks for partially correct responses that show some comprehension.`,
          });
        });
      });

      const results = await answerChecker.checkAnswersWithAI(
        allSubmissions,
        allAIQuestions,
      );

      // Calculate total score from AI results
      const score = results.reduce((total, result) => {
        return total + result.result.marksAwarded;
      }, 0);

      return { score };
    } catch (error) {
      console.error("AI checking failed:", error);

      // Fallback to traditional checking
      let score = 0;
      questions.questions.forEach((question, questionIndex) => {
        const userAnswers = allUserAnswers[questionIndex] || [];
        userAnswers.forEach((answer, answerIndex) => {
          const result = answerChecker.checkAnswer(answer.trim(), {
            acceptedAnswers: [question.answers[answerIndex]],
          });
          if (result.isCorrect) {
            score++;
          }
        });
      });

      return { score };
    } finally {
      setIsCheckingAnswers(false);
    }
  }, [allUserAnswers, questions, answerChecker]);

  // Update exam context when answers are collected
  useEffect(() => {
    if (!collectAnswers) return;

    const processScoring = async () => {
      const { score } = await calculateScoreWithAI();
      updateActivityScore(activityIndex, {
        activityId,
        activityIndex,
        score,
        totalQuestions,
      });
    };

    processScoring();
  }, [collectAnswers]);

  // Update progress state
  useEffect(() => {
    onStateUpdate?.(totalQuestions, answeredCount);
  }, [totalQuestions, answeredCount]);

  // Optimized input change handler
  const handleInputChange = useCallback(
    (questionIndex: number, answerIndex: number, value: string) => {
      setAllUserAnswers((prev) => {
        const questionAnswers =
          prev[questionIndex] ||
          Array(questions.questions[questionIndex].answers.length).fill("");
        const newQuestionAnswers = [...questionAnswers];
        newQuestionAnswers[answerIndex] = value;

        return {
          ...prev,
          [questionIndex]: newQuestionAnswers,
        };
      });
    },
    [questions.questions],
  );

  // Memoized textarea component to prevent unnecessary re-renders
  const MemoizedTextarea = useCallback(
    ({
      questionIndex,
      answerIndex,
      userAnswer,
      hasAnswer,
      placeholder = "Type your answer here...",
      className = "",
    }: {
      questionIndex: number;
      answerIndex: number;
      userAnswer: string;
      hasAnswer: boolean;
      placeholder?: string;
      className?: string;
    }) => (
      <div className="relative">
        <Textarea
          value={userAnswer}
          onChange={(e) =>
            handleInputChange(questionIndex, answerIndex, e.target.value)
          }
          placeholder={placeholder}
          className={cn(
            "text-base min-h-[40px] focus:border-picton-blue-500",
            hasAnswer && "border-picton-blue-400 bg-picton-blue-50/30",
            className,
          )}
          rows={1}
          disabled={isCheckingAnswers}
        />
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              hasAnswer ? "bg-green-500" : "bg-neutral-300",
            )}
          />
        </div>
        {/* <div className="border-b border-dashed border-picton-blue-700 mt-1" /> */}
      </div>
    ),
    [handleInputChange, isCheckingAnswers],
  );

  const renderQuestionWithInputs = (question: any, questionIndex: number) => {
    const userAnswers =
      allUserAnswers[questionIndex] || Array(question.answers.length).fill("");

    if (question.question.includes("___")) {
      // Handle fill-in-the-blank questions
      const parts = question.question.split("___");

      return (
        <div className="text-base leading-relaxed">
          {parts.map((part: string, partIndex: number) => (
            <span key={partIndex}>
              <span>{part}</span>
              {partIndex < parts.length - 1 && (
                <span className="inline-block mx-2 align-middle">
                  <MemoizedTextarea
                    questionIndex={questionIndex}
                    answerIndex={partIndex}
                    userAnswer={userAnswers[partIndex] || ""}
                    hasAnswer={(userAnswers[partIndex] || "").trim() !== ""}
                    className="max-w-40"
                  />
                </span>
              )}
            </span>
          ))}
        </div>
      );
    } else {
      // Handle regular questions with single answer
      return (
        <div className="space-y-3">
          <p className="text-base font-medium">{question.question}</p>
          <div className="w-full">
            <MemoizedTextarea
              questionIndex={questionIndex}
              answerIndex={0}
              userAnswer={userAnswers[0] || ""}
              hasAnswer={(userAnswers[0] || "").trim() !== ""}
              placeholder="Enter your answer here..."
              className="w-full"
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm">
      {/* Content container - scrollable */}
      <div className="flex gap-2 h-full">
        {/* Notes section */}
        <div className="bg-white w-1/2 flex flex-col justify-start rounded-xl p-6">
          <div className="overflow-auto max-h-[calc(100vh-200px)]">
            <div
              className="whitespace-pre-line text-base leading-relaxed text-picton-blue-700"
              dangerouslySetInnerHTML={{
                __html: questions.notes,
              }}
            />
          </div>
        </div>

        {/* Questions section */}
        <div className="w-1/2 flex flex-col rounded-xl p-6">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-8">
              {questions.questions.map((question, questionIndex) => (
                <motion.div
                  key={questionIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: questionIndex * 0.1 }}
                  className="border rounded-lg p-6 bg-neutral-50 text-neutral-700"
                >
                  <div className="flex items-start gap-4">
                    {/* Question number circle */}
                    <div className="font-semibold flex-shrink-0">
                      {toRoman(questionIndex + 1)}.
                    </div>

                    {/* Question content */}
                    <div className="flex-1">
                      {renderQuestionWithInputs(question, questionIndex)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamComprehensionJuniorOne;
