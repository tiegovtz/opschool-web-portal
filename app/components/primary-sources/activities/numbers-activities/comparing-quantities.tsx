"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";

// Local imports
import { QuantityRenderer } from "./shared";
import AnswerDropZone from "./shared/answer-drop-zone";
import { FeedbackType } from "@/lib/types/activity-types";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type ComparingQuantitiesProps = {
  questions: {
    title: string;
    questions: {
      answer: "Second" | "First";
      leftNumber: number;
      leftImage: string;
      rightNumber: number;
    }[];
  };
  feedback: FeedbackType;
};

const ComparingQuantities = ({
  questions,
  feedback,
}: ComparingQuantitiesProps) => {
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<number, string>
  >({});
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);

  const { playSound } = useSoundEffects();

  const totalQuestions = questions.questions.length;

  // Initialize question answers when component mounts
  useEffect(() => {
    const initialAnswers: Record<number, string> = {};
    questions.questions.forEach((_, index) => {
      initialAnswers[index] = "";
    });
    setQuestionAnswers(initialAnswers);
  }, [questions]);

  // Check if all questions are answered and calculate score
  useEffect(() => {
    const answeredQuestions = Object.keys(questionAnswers).filter((key) => {
      return questionAnswers[parseInt(key)];
    });

    if (answeredQuestions.length === totalQuestions) {
      let totalScore = 0;
      const correct: string[] = [];

      questions.questions.forEach((question, index) => {
        const userAnswer = questionAnswers[index];
        if (userAnswer === question.answer) {
          totalScore += 1;
          correct.push(index.toString());
        }
      });

      setScore(totalScore);
      setCorrectAnswers(correct);
      setAllAnswered(true);
      playSound("success");
    }
  }, [questionAnswers, questions, totalQuestions]);

  const handleAnswerClick = (
    questionIndex: number,
    side: "First" | "Second"
  ) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionIndex]: side,
    }));
    playSound("click");
  };

  const resetActivity = () => {
    setScore(0);
    setShowResults(false);
    setAllAnswered(false);
    setCorrectAnswers([]);

    // Reset question answers
    const initialAnswers: Record<number, string> = {};
    questions.questions.forEach((_, index) => {
      initialAnswers[index] = "";
    });
    setQuestionAnswers(initialAnswers);
  };

  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", damping: 10 },
    },
  };

  const isCorrect = (questionIndex: number) => {
    return correctAnswers.includes(questionIndex.toString());
  };

  const renderResultIcon = (
    questionIndex: number,
    side: "First" | "Second"
  ) => {
    if (!showResults) return null;

    const userAnswer = questionAnswers[questionIndex];
    const correctAnswer = questions.questions[questionIndex].answer;
    const isThisSideCorrect = correctAnswer === side;
    const userSelectedThis = userAnswer === side;

    if (userSelectedThis) {
      return isThisSideCorrect ? (
        <motion.div
          className="absolute -top-2 -right-2 z-10"
          variants={iconVariants}
          initial="initial"
          animate="animate"
        >
          <Check className="text-green-600 h-6 w-6 bg-white rounded-full p-1" />
        </motion.div>
      ) : (
        <motion.div
          className="absolute -top-2 -right-2 z-10"
          variants={iconVariants}
          initial="initial"
          animate="animate"
        >
          <X className="text-red-600 h-6 w-6 bg-white rounded-full p-1" />
        </motion.div>
      );
    }

    return null;
  };

  const renderQuantityImages = (count: number, image: string, alt: string) => {
    return (
      <QuantityRenderer
        count={count}
        image={image}
        maxItemsPerRow={7}
        className="sm:max-w-[350px] xl:max-w-full flex-wrap"
      />
    );
  };

  const renderQuestion = (question: any, index: number) => {
    const currentAnswer = questionAnswers[index];

    return (
      <div key={index} className="bg-white rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Side */}
          <div className="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
            {renderQuantityImages(
              question.leftNumber,
              question.leftImage,
              "Left item"
            )}
            {/* Left Selection Zone */}
            <div className="relative w-fit ml-auto">
              <AnswerDropZone
                id={`${index}-left`}
                answerType="click"
                currentAnswer={currentAnswer}
                correctAnswer={question.answer}
                showResults={showResults}
                placeholder="Select"
                onClickChange={() => handleAnswerClick(index, "First")}
                isSelected={currentAnswer === "First"}
                className={`min-w-[120px] ${
                  showResults && currentAnswer === "First"
                    ? isCorrect(index)
                      ? "bg-green-200 text-green-700 border-green-300"
                      : "bg-red-200 text-red-700 border-red-300"
                    : currentAnswer === "First"
                    ? "bg-picton-blue-200 border-picton-blue-400"
                    : ""
                }`}
              >
                First
              </AnswerDropZone>
              {renderResultIcon(index, "First")}
            </div>
          </div>

          {/* Right Side */}
          <div className="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
            {/* Right Selection Zone */}
            <div className="relative w-fit ml-auto">
              <AnswerDropZone
                id={`${index}-right`}
                answerType="click"
                currentAnswer={currentAnswer}
                correctAnswer={question.answer}
                showResults={showResults}
                placeholder="Select"
                onClickChange={() => handleAnswerClick(index, "Second")}
                isSelected={currentAnswer === "Second"}
                className={`min-w-[120px] ${
                  showResults && currentAnswer === "Second"
                    ? isCorrect(index)
                      ? "bg-green-200 text-green-700 border-green-300"
                      : "bg-red-200 text-red-700 border-red-300"
                    : currentAnswer === "Second"
                    ? "bg-picton-blue-200 border-picton-blue-400"
                    : ""
                }`}
              >
                Second
              </AnswerDropZone>
              {renderResultIcon(index, "Second")}
            </div>
            {renderQuantityImages(
              question.rightNumber,
              question.leftImage,
              "Right item"
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <div className="flex-1 flex flex-col gap-6 overflow-y-auto p-4">
        {/* All Questions */}
        <div className="space-y-6">
          {questions.questions.map((question, index) =>
            renderQuestion(question, index)
          )}
        </div>

        {showResults && (
          <div className="mt-4">
            <ActivityResults
              score={score}
              total={totalQuestions}
              onRestart={resetActivity}
            />
          </div>
        )}

        <ActivityResultsAlertDialog
          score={score}
          total={totalQuestions}
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
    </div>
  );
};

export default ComparingQuantities;
