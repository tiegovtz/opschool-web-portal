"use client";

import { motion } from "motion/react";
import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  Fragment,
  memo,
} from "react";

// Local imports
import { cn, extractKatexSegments } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/components/multi-select";
import { ImageModal } from "@/components/ui/image-modal";
import { useExamContext } from "@/shared/context/exam-context";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { QuestionAnswer } from "@/shared/context/exam-context";
import { BlockMath, InlineMath } from "react-katex";

// Memoized MathText component for optimized KaTeX rendering
const MathText = memo(
  ({
    text,
    className = "",
    dangerouslySetInnerHTML = false,
  }: {
    text: string;
    className?: string;
    dangerouslySetInnerHTML?: boolean;
  }) => {
    const segments = useMemo(() => extractKatexSegments(text), [text]);

    const hasMath = useMemo(
      () => segments.some((seg) => seg.type === "math"),
      [segments],
    );

    if (!hasMath) {
      if (dangerouslySetInnerHTML) {
        return (
          <span
            className={cn("whitespace-pre-line", className)}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      }
      return (
        <span className={cn("whitespace-pre-line", className)}>{text}</span>
      );
    }

    return (
      <span className={className}>
        {segments.map((seg, i) =>
          seg.type === "math" ? (
            <InlineMath key={i}>{seg.value}</InlineMath>
          ) : (
            <Fragment key={i}>{seg.value}</Fragment>
          ),
        )}
      </span>
    );
  },
);

MathText.displayName = "MathText";

// Memoized textarea component to prevent unnecessary re-renders
const MemoizedTextarea = memo(
  ({
    questionId,
    userAnswer,
    hasAnswer,
    placeholder = "",
    onChange,
  }: {
    questionId: string;
    userAnswer: string;
    hasAnswer: boolean;
    placeholder?: string;
    onChange: (questionId: string, value: string) => void;
  }) => (
    <div className="relative">
      <Textarea
        value={userAnswer}
        onChange={(e) => onChange(questionId, e.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-h-[40px] focus:border-picton-blue-500 bg-white",
          hasAnswer && "border-picton-blue-400 bg-picton-blue-50/30",
        )}
      />
      <div className="absolute top-2 right-2">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            hasAnswer ? "bg-green-500" : "bg-neutral-300",
          )}
        />
      </div>
    </div>
  ),
);

MemoizedTextarea.displayName = "MemoizedTextarea";

// Memoized SubQuestion component
const MemoizedSubQuestion = memo(
  ({
    subQuestion,
    subQuestionIndex,
    answers,
    onChange,
  }: {
    subQuestion: any;
    subQuestionIndex: number;
    answers: Record<string, string>;
    onChange: (questionId: string, value: string) => void;
  }) => {
    const userAnswer = answers[subQuestion.id] || "";
    const hasAnswer = userAnswer.trim() !== "";

    return (
      <div key={subQuestionIndex} className="space-y-2">
        {/* Sub Question Label and Text */}
        <div>
          {subQuestion.subLabel && (
            <h4 className="font-medium inline mr-2">{subQuestion.subLabel}</h4>
          )}
          {subQuestion.questionText && subQuestion.questionText.trim() && (
            <p className="inline">
              <MathText text={subQuestion.questionText} />
              {/*<span className="text-picton-blue-600 font-medium ml-2">
                ({subQuestion.maxMarks} mark
                {subQuestion.maxMarks > 1 ? "s" : ""})
              </span>*/}
            </p>
          )}

          <div className="mt-2">
            {/* Answer Input */}
            <MemoizedTextarea
              questionId={subQuestion.id}
              userAnswer={userAnswer}
              hasAnswer={hasAnswer}
              onChange={onChange}
            />
          </div>
        </div>
      </div>
    );
  },
);

MemoizedSubQuestion.displayName = "MemoizedSubQuestion";

// Memoized Part component
const MemoizedPart = memo(
  ({
    part,
    partIndex,
    questionId,
    questionNumber,
    answers,
    onChange,
  }: {
    part: any;
    partIndex: number;
    questionId: string;
    questionNumber: string;
    answers: Record<string, string>;
    onChange: (questionId: string, value: string) => void;
  }) => {
    return (
      <div key={partIndex} className="md:ml-4">
        {/* Part Label */}
        <div className="mb-4">
          {part.partLabel && (
            <h5 className="font-semibold inline mr-2">{part.partLabel}</h5>
          )}
          {part.questionText && part.questionText.trim() && (
            <p className="inline">
              <MathText
                text={part.questionText}
                dangerouslySetInnerHTML={true}
              />
              {/*{part.maxMarks && (
                      <span className="text-picton-blue-600 ml-2 italic">
                        ({part.maxMarks} mark
                        {part.maxMarks > 1 ? "s" : ""})
                      </span>
                    )}*/}
            </p>
          )}
        </div>

        {/* Part Answer Input (if part has marks) */}
        {part.maxMarks &&
          (() => {
            const partAnswerId = `${part.id}-answer`;
            const userAnswer = answers[partAnswerId] || "";
            const hasAnswer = userAnswer.trim() !== "";

            return (
              <div className="mb-4 md:ml-4">
                <MemoizedTextarea
                  questionId={partAnswerId}
                  userAnswer={userAnswer}
                  hasAnswer={hasAnswer}
                  onChange={onChange}
                />
              </div>
            );
          })()}

        {/* Sub Questions */}
        <div
          className={cn("space-y-4 md:ml-4", {
            "mt-4": part.maxMarks, // Add top margin if part has answer input above
          })}
        >
          {part.subQuestions.map(
            (subQuestion: any, subQuestionIndex: number) => (
              <MemoizedSubQuestion
                key={subQuestion.id}
                subQuestion={subQuestion}
                subQuestionIndex={subQuestionIndex}
                answers={answers}
                onChange={onChange}
              />
            ),
          )}
        </div>
      </div>
    );
  },
);

MemoizedPart.displayName = "MemoizedPart";

// Memoized Question component
const MemoizedQuestion = memo(
  ({
    question,
    questionIndex,
    fontSize,
    answers,
    onChange,
  }: {
    question: any;
    questionIndex: number;
    fontSize?: string;
    answers: Record<string, string>;
    onChange: (questionId: string, value: string) => void;
  }) => {
    return (
      <motion.div
        key={questionIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: questionIndex * 0.1 }}
        className="border rounded-lg p-2 md:p-6 bg-neutral-50"
      >
        {/* Question Number */}
        <div
          className={cn("mb-6", {
            flex:
              !question.questionText &&
              !question.maxMarks &&
              !question.imagePath,
          })}
        >
          <div className="mb-4">
            {parseInt(question.questionNumber) < 100 && (
              <h4 className="font-bold inline mr-2">
                {question.questionNumber}
              </h4>
            )}
            {question.questionText && question.questionText.trim() && (
              <p className="inline">
                <MathText
                  text={question.questionText}
                  className="inline"
                  dangerouslySetInnerHTML={true}
                />
                {/*{question.maxMarks && (
                  <span className="text-picton-blue-600 ml-2 italic">
                    ({question.maxMarks} mark
                    {question.maxMarks > 1 ? "s" : ""})
                  </span>
                )}*/}
              </p>
            )}
          </div>

          {/* Question Image */}
          {question.imagePath && (
            <div className="mb-4">
              <ImageModal
                src={question.imagePath}
                alt={`Question ${question.questionNumber} image`}
                className="max-w-md w-full h-auto rounded-lg border border-neutral-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
              />
            </div>
          )}

          {/* Question-Level Answer Input */}
          {question.maxMarks &&
            (() => {
              const questionAnswerId = `${question.id}-answer`;
              const userAnswer = answers[questionAnswerId] || "";
              const hasAnswer = userAnswer.trim() !== "";

              return (
                <div className="mb-4">
                  <MemoizedTextarea
                    questionId={questionAnswerId}
                    userAnswer={userAnswer}
                    hasAnswer={hasAnswer}
                    onChange={onChange}
                  />
                </div>
              );
            })()}

          {/* Question Parts */}
          <div className={cn("space-y-6")}>
            {question.parts.map((part: any, partIndex: number) => (
              <MemoizedPart
                key={part.id}
                part={part}
                partIndex={partIndex}
                questionId={question.id}
                questionNumber={question.questionNumber}
                answers={answers}
                onChange={onChange}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  },
);

MemoizedQuestion.displayName = "MemoizedQuestion";

export type ExamOpenEndedQuestionsProps = {
  questions: {
    title: string;
    fontSize?: string;
    questions: {
      id: string;
      questionNumber: string;
      questionText?: string;
      imagePath?: string;
      useAI?: boolean;
      hint?: string;
      acceptedAnswers?: string[];
      maxMarks?: number;
      parts: {
        id: string;
        partLabel: string; // e.g., "a)", "b)"
        questionText?: string;
        maxMarks?: number;
        useAI?: boolean;
        hint?: string;
        acceptedAnswers?: string[];
        subQuestions: {
          id: string;
          subLabel: string; // e.g., "i.", "ii.", "iii."
          questionText: string;
          maxMarks: number;
          useAI?: boolean;
          hint?: string;
          acceptedAnswers?: string[];
          evaluationCriteria?: string;
        }[];
      }[];
    }[];
  };
  activityIndex: number;
  activityId: string;
  onStateUpdate?: (totalQuestions: number, answeredCount: number) => void;
};

const answerChecker = new AnswerChecker();

const ExamOpenEndedQuestions = ({
  questions: { fontSize, questions },
  activityIndex,
  activityId,
  onStateUpdate,
}: ExamOpenEndedQuestionsProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);

  // Memoize answers to prevent unnecessary re-renders of child components
  const memoizedAnswers = useMemo(() => answers, [answers]);
  // console.log(questions);
  // Debounced answers for expensive operations
  const debouncedAnswers = useDebounce(answers, 500);

  // Ref to track if we should update parent state
  const shouldUpdateParent = useRef(true);

  const { collectAnswers, updateActivityScore } = useExamContext();

  // Memoize total questions calculation
  const totalQuestions = useMemo(() => {
    return questions.reduce(
      (total, question) =>
        total +
        (question.maxMarks ? 1 : 0) + // Add question-level answers
        question.parts.reduce(
          (partTotal, part) =>
            partTotal + part.subQuestions.length + (part.maxMarks ? 1 : 0),
          0,
        ),
      0,
    );
  }, [questions]);

  // Memoized debounced answered count for parent updates
  const debouncedAnsweredCount = useMemo(() => {
    return Object.keys(debouncedAnswers).filter(
      (key) => debouncedAnswers[key]?.trim() !== "",
    ).length;
  }, [debouncedAnswers]);

  // Calculate score for this activity using AI answer checking
  const calculateScore = useCallback(async () => {
    if (isCalculatingScore || !Object.keys(debouncedAnswers).length)
      return { score: 0, answers: [] };

    setIsCalculatingScore(true);

    try {
      // Prepare submissions for both AI and non-AI checking
      const submissions: { questionId: string; answer: string }[] = [];
      const questionsForChecking: any[] = [];

      questions.forEach((question) => {
        // Handle question-level answers (questions without parts)
        if (question.maxMarks) {
          const questionAnswerId = `${question.id}-answer`;
          const answer = answers[questionAnswerId] || "";

          submissions.push({
            questionId: questionAnswerId,
            answer,
          });

          questionsForChecking.push({
            id: questionAnswerId,
            question: [question.questionNumber, question.questionText]
              .filter(Boolean)
              .join(" "),
            acceptedAnswers: question.acceptedAnswers || [],
            questionType: question.useAI !== false ? "reasoning" : "exact",
            maxMarks: question.maxMarks,
            hint: question.hint,
            imagePath: question.imagePath, // Include image path for AI context
          });
        }

        question.parts.forEach((part) => {
          const subQuestionsWithText = part.subQuestions.filter((sq) =>
            sq.questionText?.trim(),
          );
          const subQuestionsWithoutText = part.subQuestions.filter(
            (sq) => !sq.questionText?.trim(),
          );

          // 1. Process all sub-questions that have their own text individually
          subQuestionsWithText.forEach((subQuestion) => {
            const answer = answers[subQuestion.id] || "";
            submissions.push({
              questionId: subQuestion.id,
              answer,
            });

            questionsForChecking.push({
              id: subQuestion.id,
              question: [subQuestion.subLabel, subQuestion.questionText]
                .filter(Boolean)
                .join(" "),
              context: {
                mainQuestion: `${question.questionNumber} ${
                  question.questionText || ""
                }`.trim(),
                partQuestion: `${part.partLabel} ${
                  part.questionText || ""
                }`.trim(),
              },
              acceptedAnswers: subQuestion.acceptedAnswers || [],
              questionType: subQuestion.useAI !== false ? "reasoning" : "exact",
              maxMarks: subQuestion.maxMarks,
              evaluationCriteria: subQuestion.evaluationCriteria,
              hint: subQuestion.hint,
              imagePath: question.imagePath, // Include image path for AI context
            });
          });

          // 2. Handle sub-questions that DON'T have their own text (grouped)
          if (subQuestionsWithoutText.length > 0) {
            const parentQuestionText =
              part.questionText?.trim() || question.questionText?.trim();

            if (parentQuestionText && subQuestionsWithoutText.length > 0) {
              // Submit each sub-question individually but with shared context
              subQuestionsWithoutText.forEach((subQuestion) => {
                const answer = answers[subQuestion.id] || "";

                submissions.push({
                  questionId: subQuestion.id,
                  answer,
                });

                questionsForChecking.push({
                  id: subQuestion.id,
                  question: `${parentQuestionText} - ${subQuestion.subLabel}`,
                  context: {
                    mainQuestion: `${question.questionNumber} ${
                      question.questionText || ""
                    }`.trim(),
                    partLabel: part.partLabel,
                    parentText: parentQuestionText,
                    subLabel: subQuestion.subLabel,
                    isGroupedSubQuestion: true,
                  },
                  acceptedAnswers: subQuestion.acceptedAnswers || [],
                  questionType:
                    subQuestion.useAI !== false ? "reasoning" : "exact",
                  maxMarks: subQuestion.maxMarks,
                  evaluationCriteria: subQuestion.evaluationCriteria,
                  hint: subQuestion.hint,
                  imagePath: question.imagePath, // Include image path for AI context
                });
              });
            }
          }
          // 3. If no sub-questions were grouped, check if the part itself is a question
          else if (part.maxMarks) {
            const partAnswerId = `${part.id}-answer`;
            const answer = answers[partAnswerId] || "";
            submissions.push({
              questionId: partAnswerId,
              answer,
            });

            questionsForChecking.push({
              id: partAnswerId,
              question: [part.partLabel, part.questionText]
                .filter(Boolean)
                .join(" "),
              context: {
                mainQuestion: `${question.questionNumber} ${
                  question.questionText || ""
                }`.trim(),
              },
              acceptedAnswers: part.acceptedAnswers || [],
              questionType: part.useAI !== false ? "reasoning" : "exact",
              maxMarks: part.maxMarks,
              hint: part.hint,
              imagePath: question.imagePath, // Include image path for AI context
            });
          }
        });
      });

      // console.log(submissions);
      // console.log(questionsForChecking);

      // // Use batch checking (handles both AI and non-AI questions)
      const results = await answerChecker.checkAnswersBatch(
        submissions,
        questionsForChecking,
      );

      // Calculate total score
      const totalScore = results.reduce(
        (sum, result) => sum + result.result.marksAwarded,
        0,
      );

      // Create detailed answers for results display
      const detailedAnswers: QuestionAnswer[] = [];

      // Map results back to questions for detailed answers
      questions.forEach((question) => {
        // Handle question-level answers
        if (question.maxMarks) {
          const questionAnswerId = `${question.id}-answer`;
          const result = results.find((r) => r.questionId === questionAnswerId);
          const userAnswer = answers[questionAnswerId] || "";

          detailedAnswers.push({
            questionId: questionAnswerId,
            userAnswer: userAnswer,
            aiFeedback: result?.result.feedback || "",
            correctAnswer:
              question.acceptedAnswers && question.acceptedAnswers.length > 0
                ? question.acceptedAnswers?.join(", ") || ""
                : question.hint || "",
            isCorrect: result?.result.isCorrect || false,
            question: `${question.questionNumber} ${
              question.questionText || ""
            }`.trim(),
            options: [],
          });
        }

        // Handle part and sub-question answers
        question.parts.forEach((part) => {
          // Part-level answers
          if (part.maxMarks) {
            const partAnswerId = `${part.id}-answer`;
            const result = results.find((r) => r.questionId === partAnswerId);
            const userAnswer = answers[partAnswerId] || "";

            detailedAnswers.push({
              questionId: partAnswerId,
              userAnswer: userAnswer,
              aiFeedback: result?.result.feedback || "",
              correctAnswer:
                part.acceptedAnswers && part.acceptedAnswers?.length > 0
                  ? part.acceptedAnswers?.join(", ") || ""
                  : part.hint || "",
              isCorrect: result?.result.isCorrect || false,
              question: `${question.questionNumber} ${part.partLabel} ${
                part.questionText || ""
              }`.trim(),
              options: [],
            });
          }

          // Sub-question answers
          part.subQuestions.forEach((subQuestion) => {
            const result = results.find((r) => r.questionId === subQuestion.id);
            const userAnswer = answers[subQuestion.id] || "";

            detailedAnswers.push({
              questionId: subQuestion.id,
              userAnswer: userAnswer,
              aiFeedback: result?.result.feedback || "",
              correctAnswer:
                subQuestion.acceptedAnswers &&
                subQuestion.acceptedAnswers.length > 0
                  ? subQuestion.acceptedAnswers?.join(", ") || ""
                  : subQuestion.hint || "",
              isCorrect: result?.result.isCorrect || false,
              question:
                `${question.questionNumber} ${part.partLabel} ${subQuestion.subLabel} ${subQuestion.questionText}`.trim(),
              options: [],
            });
          });
        });
      });

      // console.log(
      //   "Answer Checking Results for Exam Open Ended Questions:",
      //   results,
      // );

      return { score: totalScore, answers: detailedAnswers };
    } catch (error) {
      console.error("Failed to calculate score with AI:", error);
      return { score: 0, answers: [] };
    } finally {
      setIsCalculatingScore(false);
    }
  }, [debouncedAnswers, isCalculatingScore, questions]);

  // Update exam context with debounced answers
  useEffect(() => {
    if (!collectAnswers) return;

    const processScore = async () => {
      const { score, answers } = await calculateScore();

      updateActivityScore(activityIndex, {
        activityId,
        activityIndex,
        score,
        totalQuestions,
        answers,
        questions,
      });
    };

    processScore();
  }, [collectAnswers]);

  // Update parent component state with debounced values
  useEffect(() => {
    if (shouldUpdateParent.current) {
      onStateUpdate?.(totalQuestions, debouncedAnsweredCount);
    }
  }, [totalQuestions, debouncedAnsweredCount]);

  // Optimized input change handler
  const handleInputChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  return (
    <div
      className="h-full flex flex-col bg-white rounded-b-xl shadow-sm"
      style={{
        fontSize: fontSize ? `${fontSize}px` : "18px",
      }}
    >
      {/* Questions container - scrollable */}
      <div className="flex-1 overflow-y-auto p-2 md:p-6">
        <div className="space-y-8">
          {questions.map((question, questionIndex) => (
            <MemoizedQuestion
              key={question.id}
              question={question}
              questionIndex={questionIndex}
              fontSize={fontSize}
              answers={memoizedAnswers}
              onChange={handleInputChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExamOpenEndedQuestions;
