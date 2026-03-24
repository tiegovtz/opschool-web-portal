"use client";

import { useState, useCallback, useMemo, memo, Fragment } from "react";
import { Check, X } from "lucide-react";
import { motion } from "motion/react";

// Local imports
import { cn, extractKatexSegments } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
import { ImageModal } from "@/components/ui/image-modal";
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
    showFeedback = false,
    isCorrect,
  }: {
    questionId: string;
    userAnswer: string;
    hasAnswer: boolean;
    placeholder?: string;
    onChange: (questionId: string, value: string) => void;
    showFeedback?: boolean;
    isCorrect?: boolean;
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
      <div className="absolute top-2 right-2 flex gap-1">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            hasAnswer ? "bg-green-500" : "bg-neutral-300",
          )}
        />
        {showFeedback && hasAnswer && (
          <div
            className={cn(
              "w-3 h-3 rounded-full flex items-center justify-center",
              isCorrect ? "bg-green-500" : "bg-red-500",
            )}
          >
            {isCorrect ? (
              <Check className="w-2 h-2 text-white" />
            ) : (
              <X className="w-2 h-2 text-white" />
            )}
          </div>
        )}
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

export type OpenEndedQuestionsProps = {
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
  feedback?: FeedbackType;
};

const answerChecker = new AnswerChecker();

const OpenEndedQuestions = ({
  questions: { title, fontSize, questions },
  feedback = "wrong-correct",
}: OpenEndedQuestionsProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [scoreCalculated, setScoreCalculated] = useState(false);
  const [aiResults, setAiResults] = useState<
    Record<
      string,
      {
        isCorrect: boolean;
        marksAwarded: number;
        maxMarks: number;
        feedback?: string;
        confidence: number;
      }
    >
  >({});

  // Memoize answers to prevent unnecessary re-renders of child components
  const memoizedAnswers = useMemo(() => answers, [answers]);

  const { playSound } = useSoundEffects();

  // Memoize total marks calculation
  const totalMarks = useMemo(() => {
    return questions.reduce(
      (total, question) =>
        total +
        (question.maxMarks || 0) + // Add question-level marks
        question.parts.reduce((partTotal, part) => {
          const subQuestionMarks = part.subQuestions.reduce(
            (sum, sq) => sum + sq.maxMarks,
            0,
          );
          return partTotal + subQuestionMarks + (part.maxMarks || 0);
        }, 0),
      0,
    );
  }, [questions]);

  // Calculate answered count
  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter((key) => answers[key]?.trim() !== "")
      .length;
  }, [answers]);

  // Calculate score for this activity using AI answer checking
  const calculateScore = async () => {
    if (isCalculatingScore || !Object.keys(answers).length) return { score: 0 };

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
            });
          });

          // 2. Group sub-questions that DON'T have their own text
          if (subQuestionsWithoutText.length > 0) {
            const parentQuestionText =
              part.questionText?.trim() || question.questionText?.trim();
            const parentId = part.questionText?.trim() ? part.id : question.id;

            if (parentQuestionText && subQuestionsWithoutText.length > 0) {
              const groupedAnswer = subQuestionsWithoutText
                .map((sq) => {
                  const answer = answers[sq.id] || "";
                  return answer ? `${sq.subLabel} ${answer}`.trim() : null;
                })
                .filter(Boolean)
                .join("\n");

              const totalMarks = subQuestionsWithoutText.reduce(
                (sum, sq) => sum + sq.maxMarks,
                0,
              );
              const evaluationCriteria = subQuestionsWithoutText
                .map((sq) => sq.evaluationCriteria)
                .filter(Boolean)
                .join("\n");

              // Use AI if any of the sub-questions use AI
              const useAI = subQuestionsWithoutText.some(
                (sq) => sq.useAI !== false,
              );

              const groupId = `${parentId}-grouped`;
              submissions.push({
                questionId: groupId,
                answer: groupedAnswer,
              });

              questionsForChecking.push({
                id: groupId,
                question: parentQuestionText,
                context: {
                  mainQuestion: `${question.questionNumber} ${
                    question.questionText || ""
                  }`.trim(),
                  partLabel: part.partLabel,
                },
                acceptedAnswers: part.acceptedAnswers || [],
                questionType: useAI ? "reasoning" : "exact",
                maxMarks: totalMarks,
                evaluationCriteria,
                hint: part.hint,
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
            });
          }
        });
      });

      //   console.log(submissions);
      //   console.log(questionsForChecking);

      // Use batch checking (handles both AI and non-AI questions)
      const results = await answerChecker.checkAnswersBatch(
        submissions,
        questionsForChecking,
      );

      // Store AI results for feedback display
      const newAiResults: Record<string, any> = {};
      results.forEach((result) => {
        newAiResults[result.questionId] = result.result;
      });
      setAiResults(newAiResults);

      // Calculate total score
      const totalScore = results.reduce(
        (sum, result) => sum + result.result.marksAwarded,
        0,
      );

      console.log(
        "AI Answer Checking Results for Open Ended Questions:",
        results,
      );

      return { score: totalScore, results };
    } catch (error) {
      console.error("Failed to calculate score with AI:", error);
      return { score: 0 };
    } finally {
      setIsCalculatingScore(false);
    }
  };

  // Handle manual submission
  const handleSubmit = useCallback(async () => {
    if (isCalculatingScore || scoreCalculated) return;

    // setSubmitted(true);
    // Check if we have any answers
    if (Object.keys(answers).length === 0) {
      console.warn("No answers to submit");
      return;
    }

    const { score } = await calculateScore();
    setFinalScore(score);
    setScoreCalculated(true);
    setAllAnswered(true);

    // Play sound based on performance
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    playSound(percentage >= 70 ? "correct" : "failure");
  }, [answers, isCalculatingScore, scoreCalculated, totalMarks]);

  // Handle when all questions are answered (removed automatic submission)
  // useEffect(() => {
  //   if (allQuestionsAnswered && !isCalculatingScore && !scoreCalculated) {
  //     const processScore = async () => {
  //       const { score } = await calculateScore();
  //       setFinalScore(score);
  //       setScoreCalculated(true);
  //       setAllAnswered(true);

  //       // Play sound based on performance
  //       const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  //       playSound(percentage >= 70 ? "correct" : "failure");
  //     };

  //     processScore();
  //   }
  // }, [
  //   allQuestionsAnswered,
  //   isCalculatingScore,
  //   scoreCalculated,
  //   // calculateScore,
  //   totalMarks,
  //   // playSound,
  // ]);

  // Optimized input change handler
  const handleInputChange = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const resetActivity = () => {
    setAnswers({});
    setAllAnswered(false);
    setShowResults(false);
    setFinalScore(0);
    setScoreCalculated(false);
    setAiResults({});
    setIsCalculatingScore(false);
  };

  // Get result for a question (individual or grouped)
  const getQuestionResult = (questionId: string) => {
    return aiResults[questionId];
  };

  // Results summary component
  const ResultsSummary = () => {
    return (
      <div className="w-full space-y-3">
        {questions.map((question, questionIndex) => (
          <motion.div
            key={questionIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: questionIndex * 0.1 }}
            className="border rounded-lg p-2 md:p-6 bg-neutral-50"
          >
            {/* Question Number */}
            <div className="mb-6">
              <div className="mb-4 flex gap-4">
                {parseInt(question.questionNumber) < 100 && (
                  <h4 className="font-bold text-neutral-800">
                    {question.questionNumber}
                  </h4>
                )}
                {question.questionText && question.questionText.trim() && (
                  <div>
                    <MathText
                      text={question.questionText}
                      dangerouslySetInnerHTML={true}
                    />
                    {/*{question.maxMarks && (
                      <span className="text-sm text-picton-blue-600 font-medium ml-2">
                        ({question.maxMarks} mark
                        {question.maxMarks > 1 ? "s" : ""})
                      </span>
                    )}*/}
                  </div>
                )}

                {/* Question-Level Answer Result */}
              </div>

              {/* Question Image in Results */}
              {question.imagePath && (
                <div className="mb-4">
                  <ImageModal
                    src={question.imagePath}
                    alt={`Question ${question.questionNumber} image`}
                    className="max-w-md w-full h-auto rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </div>
              )}
              {question.maxMarks &&
                feedback !== "none" &&
                (() => {
                  const questionAnswerId = `${question.id}-answer`;
                  const userAnswer = answers[questionAnswerId] || "";
                  const result = getQuestionResult(questionAnswerId);
                  if (!result) return null;

                  const isCorrect = result?.isCorrect || false;
                  return (
                    <div
                      className={cn(
                        "p-3 rounded-md border flex items-start gap-3",
                        isCorrect
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center mt-1",
                          isCorrect
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700",
                        )}
                      >
                        {isCorrect ? <Check size={18} /> : <X size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">Your Answer:</p>
                        <p className="text-sm mb-2">{userAnswer}</p>
                        {feedback === "wrong-correct-answers" &&
                          result?.feedback && (
                            <p className="text-sm text-blue-600">
                              <strong>Feedback:</strong> {result.feedback}
                            </p>
                          )}
                      </div>
                    </div>
                  );
                })()}

              {/* Question Parts */}
              <div className="space-y-6">
                {question.parts.map((part, partIndex) => (
                  <div key={partIndex} className="md:ml-4">
                    {/* Part Label */}
                    <div className="mb-4">
                      <div className="mb-4 flex items-start gap-4">
                        {part.partLabel && (
                          <h5 className="font-semibold">{part.partLabel}</h5>
                        )}
                        {part.questionText && part.questionText.trim() && (
                          <div>
                            <MathText
                              text={part.questionText}
                              dangerouslySetInnerHTML={true}
                            />
                            {/*{part.maxMarks && (
                              <span className="text-sm text-picton-blue-600 font-medium ml-2">
                                ({part.maxMarks} mark
                                {part.maxMarks > 1 ? "s" : ""})
                              </span>
                            )}*/}
                          </div>
                        )}

                        {/* Part hint */}
                        {/*{part.hint && (
                          <div className="mb-3 text-xs text-neutral-600 italic">
                            Hint: {part.hint}
                          </div>
                        )}*/}
                      </div>

                      {/* Part Answer Display (if part has marks) */}
                      {part.maxMarks &&
                        (() => {
                          const partAnswerId = `${part.id}-answer`;
                          const userAnswer = answers[partAnswerId] || "";
                          const result = getQuestionResult(partAnswerId);
                          const isCorrect = result?.isCorrect || false;

                          return (
                            <div
                              className={cn(
                                "p-3 rounded-md border flex items-start gap-3",
                                isCorrect
                                  ? "border-green-300 bg-green-50"
                                  : "border-red-300 bg-red-50",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center mt-1",
                                  isCorrect
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700",
                                )}
                              >
                                {isCorrect ? (
                                  <Check size={18} />
                                ) : (
                                  <X size={18} />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-1">
                                  Your Answer:
                                </p>
                                <p className="text-sm mb-2">{userAnswer}</p>
                                {feedback === "wrong-correct-answers" &&
                                  result?.feedback && (
                                    <p className="text-sm text-blue-600">
                                      <strong>Feedback:</strong>{" "}
                                      {result.feedback}
                                    </p>
                                  )}
                                {/*{result && (
                                  <p className="text-xs text-gray-600">
                                    Marks: {result.marksAwarded}/
                                    {result.maxMarks}
                                  </p>
                                )}*/}
                              </div>
                            </div>
                          );
                        })()}

                      {/* Sub Questions Display */}
                      <div
                        className={cn("space-y-4 ml-4", {
                          "mt-4": part.maxMarks, // Add top margin if part has answer input above
                        })}
                      >
                        {part.subQuestions.map(
                          (subQuestion, subQuestionIndex) => {
                            const userAnswer = answers[subQuestion.id] || "";
                            const result = getQuestionResult(subQuestion.id);
                            const isCorrect = result?.isCorrect || false;

                            return (
                              <div key={subQuestionIndex} className="space-y-2">
                                {/* Sub Question Label and Text */}
                                <div className="flex items-start gap-2">
                                  {subQuestion.subLabel && (
                                    <span className="font-medium">
                                      {subQuestion.subLabel}
                                    </span>
                                  )}
                                  <div className="flex-1">
                                    <p>
                                      <MathText
                                        text={subQuestion.questionText}
                                      />
                                      {/*{subQuestion.maxMarks && (
                                      <span className="text-xs text-picton-blue-600 font-medium ml-2">
                                        ({subQuestion.maxMarks} mark
                                        {subQuestion.maxMarks > 1 ? "s" : ""})
                                      </span>
                                    )}*/}
                                    </p>
                                    {/*{subQuestion.hint && (
                                    <p className="text-xs text-neutral-600 italic mt-1">
                                      Hint: {subQuestion.hint}
                                    </p>
                                  )}*/}
                                  </div>
                                </div>

                                {/* Answer Display */}
                                <div
                                  className={cn(
                                    "p-3 rounded-md border flex items-start gap-3 ml-6",
                                    isCorrect
                                      ? "border-green-300 bg-green-50"
                                      : "border-red-300 bg-red-50",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center mt-1",
                                      isCorrect
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700",
                                    )}
                                  >
                                    {isCorrect ? (
                                      <Check size={14} />
                                    ) : (
                                      <X size={14} />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm mb-1">
                                      Your Answer:
                                    </p>
                                    <p className="text-sm mb-2">{userAnswer}</p>
                                    {feedback === "wrong-correct-answers" &&
                                      result?.feedback && (
                                        <p className="text-sm text-blue-600">
                                          <strong>Feedback:</strong>{" "}
                                          {result.feedback}
                                        </p>
                                      )}
                                    {/*{result && (
                                    <p className="text-xs text-gray-600">
                                      Marks: {result.marksAwarded}/
                                      {result.maxMarks}
                                    </p>
                                  )}*/}
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col relative">
      <ActivityTitle title={title} />

      {/* Loading Overlay */}
      {isCalculatingScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-picton-blue-600"></div>
            <p className="text-lg font-medium text-gray-700">
              Processing your answers...
            </p>
            <p className="text-sm text-gray-500">
              Please wait while we evaluate your responses
            </p>
          </div>
        </div>
      )}

      {showResults ? (
        <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-auto">
          <ResultsSummary />
          <div className="w-full mt-4">
            <ActivityResults
              score={finalScore}
              total={totalMarks}
              onRestart={resetActivity}
            />
          </div>
        </div>
      ) : (
        <div
          className="h-full flex flex-col bg-white rounded-xl shadow-sm"
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

          {/* Footer with progress and submit button */}
          <div className="border-t p-4 bg-gray-50">
            <div className="flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={
                  isCalculatingScore || scoreCalculated || answeredCount === 0
                }
                className="px-8 py-2"
                variant="default"
              >
                {isCalculatingScore ? "Submitting..." : "Submit Answers"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={finalScore}
        total={totalMarks}
        open={allAnswered}
        onOpenChange={(open) => {
          if (!open) {
            if (feedback === "none") {
              resetActivity();
            } else {
              setShowResults(true);
            }
            setAllAnswered(false);
          }
        }}
      />
    </div>
  );
};

export default OpenEndedQuestions;
