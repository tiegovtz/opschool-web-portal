"use client";

import { Check, X } from "lucide-react";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";

// Local imports
import { Button } from "@/components/ui/button";
import { cn, shuffle } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";
import ActivityTitle from "@/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import LeftNotesWithImages from "@/components/templates/left-notes-with-images";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type TComprehensionJuniorQuestion = {
  notes: string;
  title: string;
  image?: string;
  optionsTitle?: string;
  useAI?: boolean;
  algorithm: "Comprehension junior one" | "Comprehension junior two";
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

const answerChecker = new AnswerChecker();

const ComprehensionJunior = ({
  feedback,
  questions,
}: {
  feedback?: FeedbackType;
  questions: TComprehensionJuniorQuestion;
}) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [shuffledIndexes, setShuffledIndexes] = useState<number[]>([]);
  const [theTypedAnswers, setTheTypedAnswers] = useState<string[]>([]);
  const [attemptedQuestions, setAttemptedQuestions] = useState<
    Record<number, string[]>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>(
    {},
  );
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false);
  const [allUserAnswers, setAllUserAnswers] = useState<
    Record<number, string[]>
  >({}); // Store all answers for batch checking

  const { playSound } = useSoundEffects();

  // Determine if we should use batch AI checking
  const shouldUseBatchAI =
    questions.algorithm === "Comprehension junior one" && questions.useAI;

  const getCurrentQuestion = useCallback(() => {
    if (shuffledIndexes.length === 0) return questions.questions[0];
    return questions.questions[shuffledIndexes[activeQuestion]];
  }, [shuffledIndexes, activeQuestion, questions.questions]);

  useEffect(() => {
    shuffleQuestions();
  }, []);

  useEffect(() => {
    if (shuffledIndexes.length > 0) {
      const currentQuestion = getCurrentQuestion();
      setTheTypedAnswers(Array(currentQuestion.answers.length).fill(""));
    }
  }, [shuffledIndexes, activeQuestion, getCurrentQuestion]);

  const shuffleQuestions = () => {
    const indexes = Array.from(
      { length: questions.questions.length },
      (_, i) => i,
    );
    const shuffled = shuffle([...indexes]);
    setShuffledIndexes(shuffled);
    setActiveQuestion(0);

    setAttemptedQuestions(Object.fromEntries(shuffled.map((_, i) => [i, []])));
    setCorrectAnswers({});

    if (shuffled.length > 0) {
      const firstQuestion = questions.questions[shuffled[0]];
      setTheTypedAnswers(Array(firstQuestion.answers.length).fill(""));
    }
  };

  const checkAnswer = useCallback(
    async (questionIndex: number, answers: string[]) => {
      if (shuffledIndexes.length === 0) return false;

      const originalIndex = shuffledIndexes[questionIndex];

      if (
        questions.algorithm === "Comprehension junior one" &&
        questions.useAI
      ) {
        // Use AI checking for comprehension junior one when useAI is true
        try {
          setIsCheckingAnswers(true);

          const submissions = answers.map((answer, answerIndex) => ({
            questionId: `${originalIndex}-${answerIndex}`,
            answer: answer.trim(),
          }));

          const aiQuestions = answers.map((_, answerIndex) => ({
            id: `${originalIndex}-${answerIndex}`,
            question: questions.questions[originalIndex].question,
            context: {
              notes: questions.notes,
              title: questions.title,
              questionText: questions.questions[originalIndex].question,
              image:
                questions.questions[originalIndex].image || questions.image,
            },
            acceptedAnswers: [
              questions.questions[originalIndex].answers[answerIndex],
            ],
            strictMode: false,
            maxMarks: 1,
            questionType: "reasoning" as const,
            evaluationCriteria:
              "Evaluate based on comprehension of the provided text/context and semantic similarity to the accepted answer.",
          }));

          const results = await answerChecker.checkAnswersWithAI(
            submissions,
            aiQuestions,
          );

          // Check if all answers are correct
          return results.every((result) => result.result.isCorrect);
        } catch (error) {
          console.error(
            "AI checking failed, falling back to traditional method:",
            error,
          );
          // Fallback to traditional checking
          return answers.every((ans) => {
            const theResults = answerChecker.checkAnswer(ans, {
              acceptedAnswers: questions.questions[originalIndex].answers,
            });
            return theResults.isCorrect;
          });
        } finally {
          setIsCheckingAnswers(false);
        }
      } else if (questions.algorithm === "Comprehension junior one") {
        return answers.every((ans) => {
          const theResults = answerChecker.checkAnswer(ans, {
            acceptedAnswers: questions.questions[originalIndex].answers,
          });
          return theResults.isCorrect;
        });
      } else {
        return answers.every(
          (ans, i) =>
            ans.trim().toLowerCase() ===
            questions.questions[originalIndex].answers[i].trim().toLowerCase(),
        );
      }
    },
    [shuffledIndexes, questions],
  );

  // console.log(console.log(allUserAnswers[5]));

  // New function to check all answers at once using AI
  const checkAllAnswersWithAI = useCallback(async () => {
    if (shuffledIndexes.length === 0) return;

    try {
      setIsCheckingAnswers(true);

      // Prepare all submissions for AI checking
      const allSubmissions: { questionId: string; answer: string }[] = [];
      const allAIQuestions: any[] = [];

      shuffledIndexes.forEach((originalIndex, questionIndex) => {
        const userAnswers = allUserAnswers[questionIndex] || [];
        userAnswers.forEach((answer, answerIndex) => {
          const submissionId = `${originalIndex}-${answerIndex}`;
          allSubmissions.push({
            questionId: submissionId,
            answer: answer.trim(),
          });

          allAIQuestions.push({
            id: submissionId,
            question: questions.questions[originalIndex].question,
            context: {
              notes: questions.notes,
              title: questions.title,
              questionText: questions.questions[originalIndex].question,
            },
            acceptedAnswers: questions.questions[originalIndex].answers,
            strictMode: false,
            maxMarks: 1,
            questionType: "reasoning" as const,
            evaluationCriteria:
              "Evaluate based on comprehension of the provided text/context and semantic similarity to the accepted answer.",
          });
        });
      });

      const results = await answerChecker.checkAnswersWithAI(
        allSubmissions,
        allAIQuestions,
      );

      // Process results and update state
      const newCorrectAnswers: Record<number, boolean> = {};
      const newAttemptedQuestions: Record<number, string[]> = {};

      shuffledIndexes.forEach((originalIndex, questionIndex) => {
        const userAnswers = allUserAnswers[questionIndex] || [];
        newAttemptedQuestions[questionIndex] = userAnswers;

        // Check if all answers for this question are correct
        const questionResults = results.filter((result) =>
          result.questionId.startsWith(`${originalIndex}-`),
        );

        const allCorrect = questionResults.every(
          (result) => result.result.isCorrect,
        );
        newCorrectAnswers[questionIndex] = allCorrect;

        // Play sound for each question
        playSound(allCorrect ? "correct" : "failure");
      });

      setCorrectAnswers(newCorrectAnswers);
      setAttemptedQuestions(newAttemptedQuestions);

      // Calculate final score
      const finalScore =
        Object.values(newCorrectAnswers).filter(Boolean).length;
      setScore(finalScore);
      setAllAnswered(true);
    } catch (error) {
      console.error("AI batch checking failed:", error);
      // Fallback to individual checking
      for (let i = 0; i < shuffledIndexes.length; i++) {
        const userAnswers = allUserAnswers[i] || [];
        const isCorrect = await checkAnswer(i, userAnswers);

        setCorrectAnswers((prev) => ({ ...prev, [i]: isCorrect }));
        setAttemptedQuestions((prev) => ({ ...prev, [i]: userAnswers }));
      }

      const finalScore = Object.values(correctAnswers).filter(Boolean).length;
      setScore(finalScore);
      setAllAnswered(true);
    } finally {
      setIsCheckingAnswers(false);
    }
  }, [shuffledIndexes, allUserAnswers, questions, answerChecker]);

  const isAnswerCorrect = useCallback(
    (questionIndex: number) => {
      return correctAnswers[questionIndex] ?? false;
    },
    [correctAnswers],
  );

  // Update the allQuestionsAnswered logic for batch AI mode
  const allQuestionsAnswered = useMemo(() => {
    if (shuffledIndexes.length === 0) {
      return false;
    }

    if (shouldUseBatchAI) {
      // For batch AI, check if all questions have been answered (stored in allUserAnswers)
      return (
        Object.keys(allUserAnswers).length === shuffledIndexes.length &&
        Object.values(allUserAnswers).every((answers) =>
          answers.every((answer) => answer.trim() !== ""),
        )
      );
    } else {
      // Original logic for non-AI mode
      return (
        Object.keys(attemptedQuestions).length === shuffledIndexes.length &&
        Object.values(attemptedQuestions).every((answer) => answer.length > 0)
      );
    }
  }, [
    attemptedQuestions,
    allUserAnswers,
    shuffledIndexes.length,
    shouldUseBatchAI,
  ]);

  useEffect(() => {
    if (allQuestionsAnswered && !shouldUseBatchAI) {
      const newScore = Object.keys(correctAnswers).reduce(
        (acc, index) => (correctAnswers[Number(index)] ? acc + 1 : acc),
        0,
      );
      setScore(newScore);
      setAllAnswered(true);
    }
  }, [allQuestionsAnswered, correctAnswers, shouldUseBatchAI]);

  const handleAnswerSubmission = async (
    questionIndex: number,
    answer: string[],
  ) => {
    const isCorrect = await checkAnswer(questionIndex, answer);

    setAttemptedQuestions((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));

    setCorrectAnswers((prev) => ({
      ...prev,
      [questionIndex]: isCorrect,
    }));

    // Play appropriate sound based on answer correctness
    playSound(isCorrect ? "correct" : "failure");

    if (questionIndex < shuffledIndexes.length - 1) {
      setActiveQuestion(questionIndex + 1);
    }
  };

  // Handle next question for batch AI mode
  const handleNextQuestion = () => {
    // Store current answers
    setAllUserAnswers((prev) => ({
      ...prev,
      [activeQuestion]: [...theTypedAnswers],
    }));

    if (activeQuestion < shuffledIndexes.length - 1) {
      setActiveQuestion(activeQuestion + 1);
      const nextQuestion =
        questions.questions[shuffledIndexes[activeQuestion + 1]];
      setTheTypedAnswers(Array(nextQuestion.answers.length).fill(""));
    }
  };

  // console.log(attemptedQuestions);

  const handleCheckAnswer = async () => {
    if (shouldUseBatchAI) {
      // Store the last question's answers
      setAllUserAnswers((prev) => ({
        ...prev,
        [activeQuestion]: [...theTypedAnswers],
      }));
      // Check all answers at once
      await checkAllAnswersWithAI();
    } else {
      // Original behavior for non-AI mode
      await handleAnswerSubmission(activeQuestion, theTypedAnswers);

      if (activeQuestion < shuffledIndexes.length - 1) {
        const nextQuestion =
          questions.questions[shuffledIndexes[activeQuestion + 1]];
        setTheTypedAnswers(Array(nextQuestion.answers.length).fill(""));
      }
    }
  };

  const resetActivity = () => {
    setScore(0);
    setAllAnswered(false);
    setShowResults(false);
    setAllUserAnswers({});
    shuffleQuestions();
  };

  const ResultsSummary = () => {
    return (
      <div className="w-full space-y-3">
        {shuffledIndexes.map((originalIndex, idx) => {
          const question = questions.questions[originalIndex];
          const userAnswers = attemptedQuestions[idx] || [];
          const isCorrect = isAnswerCorrect(idx);

          const renderQuestionWithAnswers = () => {
            if (question.question.includes("___")) {
              const parts = question.question.split("___");

              return (
                <div className="text-base leading-loose">
                  {parts.map((part, i) => (
                    <React.Fragment key={i}>
                      <span>{i === 0 ? `${idx + 1}. ${part}` : part}</span>

                      {i < parts.length - 1 && (
                        <span className="mx-1 px-1">
                          {feedback === "wrong-correct-answers" ? (
                            <>
                              {userAnswers[i] && (
                                <span
                                  className={
                                    userAnswers[i]?.trim().toLowerCase() ===
                                    question.answers[i]?.trim().toLowerCase()
                                      ? "bg-green-200 text-green-800 px-1 rounded font-medium"
                                      : "bg-red-200 text-red-800 px-1 line-through rounded font-medium mr-1"
                                  }
                                >
                                  {userAnswers[i]}
                                </span>
                              )}
                              {(!userAnswers[i] ||
                                userAnswers[i]?.trim().toLowerCase() !==
                                  question.answers[i]
                                    ?.trim()
                                    .toLowerCase()) && (
                                <span className="bg-green-200 text-green-800 px-1 rounded font-medium">
                                  {question.answers[i]}
                                </span>
                              )}
                            </>
                          ) : (
                            <span
                              className={
                                isCorrect
                                  ? "bg-green-200 text-green-800 px-1 rounded font-medium"
                                  : "bg-red-200 text-red-800 px-1 rounded font-medium"
                              }
                            >
                              {userAnswers[i] || allUserAnswers[idx] || "_____"}
                            </span>
                          )}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              );
            } else {
              return (
                <div className="text-base">
                  <p>{`${idx + 1}. ${question.question}`}</p>
                  {feedback === "wrong-correct-answers" ? (
                    <div className="mt-1 pl-6">
                      {userAnswers[0] && (
                        <span
                          className={
                            answerChecker.checkAnswer(userAnswers[0], {
                              acceptedAnswers: question.answers,
                            }).isCorrect
                              ? "bg-green-200 text-green-800 px-1 rounded font-medium"
                              : "bg-red-200 text-red-800 px-1 line-through rounded font-medium mr-1"
                          }
                        >
                          {userAnswers[0]}
                        </span>
                      )}
                      {(!userAnswers[0] ||
                        !answerChecker.checkAnswer(userAnswers[0], {
                          acceptedAnswers: question.answers,
                        }).isCorrect) && (
                        <span className="bg-green-200 text-green-800 px-1 rounded font-medium">
                          {question.answers[0]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 pl-6">
                      <span
                        className={
                          isCorrect
                            ? "bg-green-200 text-green-800 px-1 rounded font-medium"
                            : "bg-red-200 text-red-800 px-1 rounded font-medium"
                        }
                      >
                        {userAnswers[0] || allUserAnswers[idx] || "_____"}
                      </span>
                    </div>
                  )}
                </div>
              );
            }
          };

          return (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-md border",
                isCorrect
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50",
              )}
            >
              <div className="flex items-start gap-3">
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

                <div className="flex-1">{renderQuestionWithAnswers()}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      {showResults ? (
        <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-auto">
          <ResultsSummary />
          <div className="w-full mt-4">
            <ActivityResults
              score={score}
              total={questions.questions.length}
              onRestart={resetActivity}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 h-full">
          <div className="flex flex-col md:flex-row justify-between gap-4 md:max-h-[calc(100dvh-150px)]">
            <LeftNotesWithImages
              notes={`${questions.notes}`}
              image={questions.image}
            />
            <div className="bg-white flex flex-col gap-4 justify-between w-full rounded-xl p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeQuestion}
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
                  className="flex flex-col gap-4 justify-between h-full"
                >
                  {shuffledIndexes.length > 0 && (
                    <>
                      <div className="md:max-h-[250px] overflow-auto">
                        <div className="text-lg leading-loose">
                          {getCurrentQuestion().question.includes("___") ? (
                            getCurrentQuestion()
                              .question.split("___")
                              .map((part, i) => (
                                <React.Fragment key={i}>
                                  <span>
                                    {i === 0 &&
                                      questions.algorithm ===
                                        "Comprehension junior one" &&
                                      `${activeQuestion + 1}. `}
                                    {part}
                                  </span>

                                  {i !==
                                    getCurrentQuestion().question.split("___")
                                      .length -
                                      1 && (
                                    <div className="inline-block mx-2 align-middle">
                                      <Input
                                        type="text"
                                        className="max-w-40 rounded-none border-none bg-transparent text-picton-blue-700 text-center text-lg"
                                        value={theTypedAnswers[i] || ""}
                                        onChange={(e) =>
                                          setTheTypedAnswers((prev) => {
                                            const newAnswers = [...prev];
                                            newAnswers[i] = e.target.value;
                                            return newAnswers;
                                          })
                                        }
                                      />
                                      <div className="border-b border-dashed border-picton-blue-700" />
                                    </div>
                                  )}
                                </React.Fragment>
                              ))
                          ) : (
                            <>
                              <span>{`${activeQuestion + 1}. ${
                                getCurrentQuestion().question
                              }`}</span>
                              <div className="mt-2">
                                <Input
                                  type="text"
                                  className="rounded-none border-none bg-transparent text-picton-blue-700 text-center text-lg"
                                  value={theTypedAnswers[0] || ""}
                                  onChange={(e) =>
                                    setTheTypedAnswers([e.target.value])
                                  }
                                />
                                <div className="border-b border-dashed border-picton-blue-700" />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div
                        className={cn(
                          "flex flex-col md:flex-row w-full gap-4 justify-between",
                          {
                            "md:h-[300px]": getCurrentQuestion().image,
                          },
                        )}
                      >
                        {getCurrentQuestion().image && (
                          <div className="w-full overflow-hidden">
                            <img
                              src={getCurrentQuestion().image}
                              alt="Comprehension junior Image"
                              className="object-contain w-full h-full rounded"
                            />
                          </div>
                        )}
                        {/*{((getCurrentQuestion().options.length > 0 &&
                          questions.algorithm === "Comprehension junior two") ||
                          (questions.optionsTitle &&
                            questions.optionsTitle?.length > 0)) && (
                          <div className="space-y-4 md:w-1/4">
                            <p className="font-bold">
                              {questions.algorithm ===
                              "Comprehension junior two"
                                ? "Options"
                                : questions.optionsTitle}
                            </p>
                            <div className="grid grid-cols-2 md:space-y-4 sm:grid-cols-4 md:grid-cols-4 md:block gap-2">
                              {getCurrentQuestion().options.map(
                                (option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className="text-picton-blue-700 md:min-w-20 text-lg leading-4"
                                  >
                                    {option.text}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}*/}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="flex flex-col-reverse md:flex-row gap-4 md:items-center justify-between">
            <div className="flex justify-center gap-4 flex-wrap">
              {shuffledIndexes.map((_, index) => {
                // For batch AI mode, check if question has been answered in allUserAnswers
                const isAnswered = shouldUseBatchAI
                  ? allUserAnswers[index]?.length > 0 &&
                    allUserAnswers[index].every((ans) => ans.trim() !== "")
                  : attemptedQuestions[index]?.length > 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center bg-picton-blue-200",
                      {
                        "bg-lemon-200": isAnswered,
                        "border-2 border-picton-blue-500":
                          index === activeQuestion && !isAnswered,
                      },
                    )}
                  >
                    {isAnswered &&
                      !shouldUseBatchAI &&
                      (isAnswerCorrect(index) ? (
                        <Check className="text-green-500" size={24} />
                      ) : (
                        <X className="text-red-500" size={24} />
                      ))}
                    {isAnswered &&
                      shouldUseBatchAI &&
                      allAnswered &&
                      (isAnswerCorrect(index) ? (
                        <Check className="text-green-500" size={24} />
                      ) : (
                        <X className="text-red-500" size={24} />
                      ))}
                  </div>
                );
              })}
            </div>

            {shouldUseBatchAI ? (
              // Show Next Question or Check All Answers button for batch AI mode
              activeQuestion === shuffledIndexes.length - 1 ? (
                <Button
                  disabled={
                    !theTypedAnswers.length ||
                    theTypedAnswers.some((answer) => !answer.trim()) ||
                    isCheckingAnswers
                  }
                  onClick={handleCheckAnswer}
                >
                  {isCheckingAnswers
                    ? "Checking All Answers..."
                    : "Check All Answers"}
                </Button>
              ) : (
                <Button
                  disabled={
                    !theTypedAnswers.length ||
                    theTypedAnswers.some((answer) => !answer.trim())
                  }
                  onClick={handleNextQuestion}
                >
                  Next Question
                </Button>
              )
            ) : (
              // Original Check Answer button for non-AI mode
              <Button
                disabled={
                  !theTypedAnswers.length ||
                  theTypedAnswers.some((answer) => !answer) ||
                  isCheckingAnswers
                }
                onClick={handleCheckAnswer}
              >
                {isCheckingAnswers ? "Checking..." : "Check Answer"}
              </Button>
            )}
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={questions.questions.length}
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

export default ComprehensionJunior;
