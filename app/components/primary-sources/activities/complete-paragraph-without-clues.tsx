"use client";

import { Fragment, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// local imports
import { cn } from "@/lib/utils";
import { Input } from "../../../../../tie_open_school_primary_frontend/components/ui/input";
import { Button } from "../../../../../tie_open_school_primary_frontend/components/ui/button";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type TCompleteParagraphWithoutCluesProps = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    fontSize?: string;
    paragraph: string;
    image?: string;
    answers: string[];
    options?: string[];
    withClues: boolean;
  };
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

const CompleteParagraphWithoutClues = ({
  feedback,
  questions,
}: TCompleteParagraphWithoutCluesProps) => {
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>(
    Array.from({ length: questions.answers.length }, () => ""),
  );
  const [isCorrectAnswers, setIsCorrectAnswers] = useState<boolean[]>(
    Array.from({ length: questions.answers.length }, () => false),
  );

  const { playSound } = useSoundEffects();

  // Check if all answers are filled
  const allAnswersFilled = useCallback(() => {
    return userAnswers.every((answer) => answer.trim() !== "");
  }, [userAnswers]);

  // Check answers and calculate score
  const checkAnswers = useCallback(() => {
    const correctnessArray = userAnswers.map(
      (answer, index) =>
        answerChecker.checkAnswer(answer.trim().toLowerCase(), {
          acceptedAnswers: [questions.answers[index].trim().toLowerCase()],
        }).isCorrect,
    );

    const newScore = correctnessArray.reduce(
      (acc, isCorrect) => (isCorrect ? acc + 1 : acc),
      0,
    );

    setIsCorrectAnswers(correctnessArray);
    setScore(newScore);
    setAllAnswered(true);

    // Play success sound if all correct, otherwise play failure sound
    playSound(newScore === questions.answers.length ? "success" : "failure");
  }, [userAnswers, questions.answers, playSound]);

  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const resetActivity = () => {
    setScore(0);
    setAllAnswered(false);
    setShowResults(false);
    setUserAnswers(Array.from({ length: questions.answers.length }, () => ""));
    setIsCorrectAnswers(
      Array.from({ length: questions.answers.length }, () => false),
    );
  };

  const ResultsSummary = () => {
    const paragraphParts = questions.paragraph.split("___");

    return (
      <div
        className="bg-picton-blue-50 flex flex-col overflow-auto h-full justify-between w-full rounded-xl p-4"
        style={{
          fontSize: questions.fontSize ? `${questions.fontSize}px` : "18px",
        }}
      >
        <div className="p-4 leading-loose">
          {paragraphParts.map((part, i) => (
            <Fragment key={i}>
              <span>{part}</span>
              {i < paragraphParts.length - 1 && (
                <span className="mx-1">
                  {feedback === "wrong-correct-answers" ? (
                    <>
                      {userAnswers[i] && (
                        <span
                          className={cn(
                            "px-2 py-1 rounded font-medium",
                            isCorrectAnswers[i]
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800 line-through mr-1",
                          )}
                        >
                          {userAnswers[i]}
                        </span>
                      )}
                      {(!userAnswers[i] || !isCorrectAnswers[i]) && (
                        <span className="bg-green-200 text-green-800 px-2 py-1 rounded font-medium">
                          {questions.answers[i]}
                        </span>
                      )}
                    </>
                  ) : (
                    <span
                      className={cn(
                        "px-2 py-1 rounded font-medium",
                        isCorrectAnswers[i]
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800",
                      )}
                    >
                      {userAnswers[i] || "_____"}
                    </span>
                  )}
                </span>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderParagraphWithInputs = () => {
    const paragraphParts = questions.paragraph.split("___");

    return (
      <div className="text-lg leading-loose">
        {paragraphParts.map((part, i) => {
          // Split the part by spaces to handle individual words
          const words = part.split(" ");

          return (
            <Fragment key={i}>
              <span>
                {words.map((word, wordIndex) => (
                  <Fragment key={wordIndex}>
                    {wordIndex > 0 && " "}
                    <span
                      className={
                        word.startsWith("_")
                          ? "bg-yellow-100 text-lemon-700 p-1 rounded"
                          : ""
                      }
                    >
                      {word.startsWith("_") ? word?.slice(1) : word}
                    </span>
                  </Fragment>
                ))}
              </span>
              {i < paragraphParts.length - 1 && (
                <span className="inline-block mx-2 align-middle">
                  <Input
                    type="text"
                    value={userAnswers[i]}
                    onChange={(e) => handleInputChange(i, e.target.value)}
                    className="max-w-40 rounded-none border-none bg-transparent text-picton-blue-700 text-center !text-lg"
                    disabled={showResults}
                  />
                  <div className="border-b border-dashed border-picton-blue-700" />
                </span>
              )}
            </Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      {showResults ? (
        <>
          <ResultsSummary />
          <div className="w-full mt-4">
            <ActivityResults
              score={score}
              total={questions.answers.length}
              onRestart={resetActivity}
            />
          </div>
        </>
      ) : (
        <div
          className="flex flex-col gap-4 h-full"
          style={{
            fontSize: questions.fontSize ? `${questions.fontSize}px` : "18px",
          }}
        >
          <div className="flex flex-col md:flex-row gap-4 h-full">
            <AnimatePresence mode="wait">
              <motion.div
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
                className="bg-picton-blue-50 flex flex-col overflow-auto h-full w-full rounded-xl p-6 gap-4"
              >
                {questions.withClues && (
                  <div className="flex flex-wrap gap-4 bg-picton-blue-100 border-2 border-picton-blue-300 w-fit py-4 rounded">
                    {questions.options?.map((answer, i) => (
                      <p
                        key={i}
                        className="text-picton-blue-700 text-lg leading-4 px-3"
                      >
                        <span>{answer}</span>
                      </p>
                    ))}
                  </div>
                )}

                <div className="leading-loose">
                  {renderParagraphWithInputs()}
                </div>
              </motion.div>
            </AnimatePresence>
            {questions.image && (
              <div className="bg-white md:w-1/2 flex items-center justify-center rounded-xl p-4">
                <img
                  src={questions.image}
                  alt="complete paragraph with clues"
                  className="object-contain w-full max-h-[600px]"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button disabled={!allAnswersFilled()} onClick={checkAnswers}>
              Check Answers
            </Button>
          </div>
        </div>
      )}

      <ActivityResultsAlertDialog
        score={score}
        total={questions.answers.length}
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

export default CompleteParagraphWithoutClues;
