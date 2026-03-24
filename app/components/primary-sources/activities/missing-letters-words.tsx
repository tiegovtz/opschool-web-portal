"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { motion } from "motion/react";

// Local imports
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/inputs/input";
import { Button } from "@/components/ui/button";
import ActivityResults from "@/components/templates/results";
import ActivityTitle from "@/components/templates/activity-title";
import { AnswerChecker } from "@/lib/utils/answer-checker";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import { FeedbackType } from "@/lib/types/activity-types";

type MissingLettersWordsProps = {
  feedback?: FeedbackType;
  questions: {
    title: string;
    questions: {
      textOne: string; // Word with "_" included
      textTwo: string; // Complete correct word
      image?: string;
    }[];
  };
};

const MissingLettersWords = ({
  feedback,
  questions: { title, questions },
}: MissingLettersWordsProps) => {
  const [showResults, setShowResults] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{
    [key: number]: { [key: number]: string };
  }>({});
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [feedbacks, setFeedbacks] = useState<{ [key: number]: boolean }>({});
  const [allAnswered, setAllAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // Audio references
  const { playSound } = useSoundEffects();
  const answerChecker = new AnswerChecker();

  // Check if all questions have been answered
  const allQuestionsAnswered = questions.every((_, questionIndex) => {
    const wordWithBlanks = questions[questionIndex].textOne;
    const blankCount = (wordWithBlanks.match(/_/g) || []).length;
    const userWordAnswers = userAnswers[questionIndex] || {};

    for (let i = 0; i < blankCount; i++) {
      if (!userWordAnswers[i] || userWordAnswers[i].trim() === "") {
        return false;
      }
    }
    return true;
  });

  // Handle input change for a specific blank in a specific word
  const handleInputChange = (
    questionIndex: number,
    blankIndex: number,
    value: string
  ) => {
    // Only allow single letters
    if (value.length > 1) {
      value = value.slice(-1);
    }

    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        [blankIndex]: value.toLowerCase(),
      },
    }));
  };

  // Check answer for a specific word
  const checkWordAnswer = (questionIndex: number) => {
    const wordWithBlanks = questions[questionIndex].textOne.toLowerCase();
    const correctWord = questions[questionIndex].textTwo.toLowerCase();
    const userWordAnswers = userAnswers[questionIndex] || {};

    let reconstructedWord = "";
    let blankIndex = 0;

    for (let i = 0; i < wordWithBlanks.length; i++) {
      if (wordWithBlanks[i] === "_") {
        reconstructedWord += userWordAnswers[blankIndex] || "_";
        blankIndex++;
      } else {
        reconstructedWord += wordWithBlanks[i];
      }
    }

    return reconstructedWord === correctWord;
  };

  // Handle checking all answers
  const handleCheckAllAnswers = () => {
    let newScore = 0;
    const newFeedbacks: { [key: number]: boolean } = {};
    const newCheckedItems: number[] = [];

    questions.forEach((_, questionIndex) => {
      const isCorrect = checkWordAnswer(questionIndex);

      newFeedbacks[questionIndex] = isCorrect;
      newCheckedItems.push(questionIndex);

      if (isCorrect) {
        newScore++;
      }
    });

    setScore(newScore);
    setFeedbacks(newFeedbacks);
    setCheckedItems(newCheckedItems);
    setAllAnswered(true);

    // Play sound based on overall performance
    playSound(newScore === questions.length ? "success" : "failure");
  };

  // Render word with input fields for missing letters
  const renderWordWithInputs = (questionIndex: number) => {
    const wordWithBlanks = questions[questionIndex].textOne;
    const elements = [];
    let blankIndex = 0;
    const isWordChecked = checkedItems.includes(questionIndex);
    const isWordCorrect = feedbacks[questionIndex];
    const isWordIncorrect = feedbacks[questionIndex] === false;

    for (let i = 0; i < wordWithBlanks.length; i++) {
      const char = wordWithBlanks[i];

      if (char === "_") {
        const currentBlankIndex = blankIndex;
        const userAnswer = userAnswers[questionIndex]?.[blankIndex] || "";

        elements.push(
          <Input
            key={`${questionIndex}-${blankIndex}`}
            type="text"
            value={userAnswer}
            onChange={(e) =>
              handleInputChange(
                questionIndex,
                currentBlankIndex,
                e.target.value
              )
            }
            disabled={allAnswered || isWordChecked}
            className={cn(
              "w-12 h-12 text-center text-3xl font-semibold !p-0 border-2 border-dashed border-picton-blue-400 bg-transparent",
              {
                "border-green-400 bg-green-50 text-green-700":
                  isWordCorrect && isWordChecked,
                "border-red-400 bg-red-50 text-red-700":
                  isWordIncorrect && isWordChecked,
                "border-lemon-400 bg-lemon-50":
                  isWordChecked && !isWordCorrect && !isWordIncorrect,
                "focus:border-picton-blue-600 focus:outline-none":
                  !isWordChecked && !allAnswered,
                "cursor-not-allowed": allAnswered,
              }
            )}
            maxLength={1}
          />
        );
        blankIndex++;
      } else {
        elements.push(
          <span
            key={`${questionIndex}-char-${i}`}
            className={cn(
              "text-3xl bg-picton-blue-200 w-12 h-12 flex items-center justify-center font-semibold",
              {
                "text-green-700": isWordCorrect && isWordChecked,
                "text-red-700": isWordIncorrect && isWordChecked,
              }
            )}
          >
            {char}
          </span>
        );
      }
    }

    return <div className="flex items-center gap-1 ">{elements}</div>;
  };

  // Handle reset with shuffle
  const handleResetWithShuffle = () => {
    setUserAnswers({});
    setCheckedItems([]);
    setFeedbacks({});
    setAllAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={title} />

      <div className="flex flex-col h-full bg-picton-blue-100 gap-2">
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {questions.map((question, questionIndex) => {
            const isWordChecked = checkedItems.includes(questionIndex);
            const isWordCorrect = feedbacks[questionIndex];
            const isWordIncorrect = feedbacks[questionIndex] === false;

            return (
              <motion.div
                key={`question-${questionIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: questionIndex * 0.1 }}
                className="flex items-center justify-between bg-picton-blue-50 p-2 gap-5 rounded-lg"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-gray-600">
                      {questionIndex + 1}.
                    </span>

                    <div
                      className={cn("p-4 rounded", {
                        "bg-green-100": isWordCorrect && isWordChecked,
                        "bg-red-100": isWordIncorrect && isWordChecked,
                        // "bg-picton-blue-200": !isWordChecked,
                      })}
                    >
                      {renderWordWithInputs(questionIndex)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isWordChecked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "flex items-center justify-center rounded-full p-1",
                          isWordCorrect
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        )}
                      >
                        {isWordCorrect ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <X className="h-5 w-5" />
                        )}
                      </motion.div>
                    )}

                    {question.image && (
                      <div className="h-32 relative">
                        <img
                          src={question.image}
                          alt="Word image"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <Button
          disabled={!allQuestionsAnswered || allAnswered}
          onClick={handleCheckAllAnswers}
          variant="brand-lemon"
          className="w-fit ml-auto"
          size="lg"
        >
          {allAnswered ? "Answers Checked" : "Check All Answers"}
        </Button>
      </div>

      <ActivityResultsAlertDialog
        score={score}
        total={questions.length}
        open={allAnswered && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
        completionMessage={
          score === questions.length
            ? "Fantastic! You've successfully completed all the words by filling in the missing letters!"
            : `Good work! You completed ${score} out of ${questions.length} words correctly. Keep practicing to improve!`
        }
      />
    </div>
  );
};

export default MissingLettersWords;
