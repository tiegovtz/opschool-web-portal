"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";

// Local imports
import { cn } from "@/lib/utils";
import { QuantityRenderer } from "./shared";
import { Button } from "@/components/ui/button";
import AnswerDropZone from "./shared/answer-drop-zone";
import { FeedbackType } from "@/lib/types/activity-types";
import ActivityTitle from "../../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../../tie_open_school_primary_frontend/components/templates/results";

type AdditionSubtractionObjectsProps = {
  questions: {
    title: string;
    questions: {
      leftNumber: number;
      rightNumber: number;
      leftImage: string;
      rightImage?: string;
      operator: string;
      displayAnswer: string;
      answer: number;
      isMultiplicationOrDivision?: boolean;
    }[];
  };
  feedback: FeedbackType;
};

const AdditionSubtractionObjects = ({
  questions,
  feedback,
}: AdditionSubtractionObjectsProps) => {
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<number, { left: string; right: string; result: string }>
  >({});
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);

  const { playSound } = useSoundEffects();

  const totalQuestions = questions.questions.length;

  // Initialize question answers when component mounts
  useEffect(() => {
    const initialAnswers: Record<
      number,
      { left: string; right: string; result: string }
    > = {};
    questions.questions.forEach((_, index) => {
      initialAnswers[index] = { left: "", right: "", result: "" };
    });
    setQuestionAnswers(initialAnswers);
  }, [questions]);

  // Check if all questions are answered to enable submit button
  useEffect(() => {
    const answeredQuestions = Object.keys(questionAnswers).filter((key) => {
      const index = parseInt(key);
      const answers = questionAnswers[index];
      const question = questions.questions[index];

      // For multiplication/division, only left and result are required
      if (question.isMultiplicationOrDivision) {
        return answers.left && answers.result;
      }

      // For addition/subtraction, all three fields are required
      return answers.left && answers.right && answers.result;
    });

    setCanSubmit(answeredQuestions.length === totalQuestions);
  }, [questionAnswers, totalQuestions, questions.questions]);

  const handleSubmit = () => {
    let totalScore = 0;
    const correct: string[] = [];

    questions.questions.forEach((question, index) => {
      const userAnswers = questionAnswers[index];
      const isLeftCorrect = parseInt(userAnswers.left) === question.leftNumber;
      const isResultCorrect = parseInt(userAnswers.result) === question.answer;

      let isRightCorrect = true;

      // For addition/subtraction, validate right answer
      if (!question.isMultiplicationOrDivision) {
        isRightCorrect = parseInt(userAnswers.right) === question.rightNumber;
      }

      // Question is fully correct if all applicable fields are correct
      if (isLeftCorrect && isRightCorrect && isResultCorrect) {
        totalScore += 1;
        correct.push(index.toString());
      }

      // Track individual field correctness for visual feedback
      if (isLeftCorrect) {
        correct.push(`${index}-left`);
      }
      if (isRightCorrect && !question.isMultiplicationOrDivision) {
        correct.push(`${index}-right`);
      }
      if (isResultCorrect) {
        correct.push(`${index}-result`);
      }
    });

    setScore(totalScore);
    setCorrectAnswers(correct);
    setAllAnswered(true);
    playSound("success");
  };

  const handleInputChange = (
    questionIndex: number,
    field: "left" | "right" | "result",
    value: string,
  ) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        [field]: value,
      },
    }));
  };

  const resetActivity = () => {
    setScore(0);
    setShowResults(false);
    setAllAnswered(false);
    setCanSubmit(false);
    setCorrectAnswers([]);

    // Reset question answers
    const initialAnswers: Record<
      number,
      { left: string; right: string; result: string }
    > = {};
    questions.questions.forEach((_, index) => {
      initialAnswers[index] = { left: "", right: "", result: "" };
    });
    setQuestionAnswers(initialAnswers);
  };

  const isFieldCorrect = (questionIndex: number, field: string) => {
    return correctAnswers.includes(`${questionIndex}-${field}`);
  };

  const renderResultIcon = (questionIndex: number, field: string) => {
    if (!showResults) return null;

    return isFieldCorrect(questionIndex, field) ? (
      <motion.div
        className="absolute -top-2 -right-2 z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10 }}
      >
        <Check className="text-green-600 h-6 w-6 bg-white rounded-full p-1" />
      </motion.div>
    ) : (
      <motion.div
        className="absolute -top-2 -right-2 z-10"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 10 }}
      >
        <X className="text-red-600 h-6 w-6 bg-white rounded-full p-1" />
      </motion.div>
    );
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

  const getFieldStyles = (
    questionIndex: number,
    field: string,
    currentValue: string,
  ) => {
    if (!showResults) return "";
    if (!currentValue) return "";

    return isFieldCorrect(questionIndex, field)
      ? "bg-green-200 text-green-700 border-green-300"
      : "bg-red-200 text-red-700 border-red-300";
  };

  const renderQuestion = (question: any, index: number) => {
    const currentAnswers = questionAnswers[index] || {
      left: "",
      right: "",
      result: "",
    };

    const rightImage = question.rightImage || question.leftImage;
    const isMultDiv = question.isMultiplicationOrDivision;

    return (
      <div key={index} className="bg-white rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {/* Left Side - Images and Input */}
          <div className="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
            {renderQuantityImages(
              question.leftNumber,
              question.leftImage,
              "Left item",
            )}
            {/* Left Input Zone */}
            <div className="relative w-fit ml-auto mt-2 md:mt-0">
              <AnswerDropZone
                id={`${index}-left`}
                answerType="input"
                currentAnswer={currentAnswers.left}
                correctAnswer={question.leftNumber.toString()}
                showResults={showResults}
                placeholder="Count"
                onInputChange={(value) =>
                  handleInputChange(index, "left", value)
                }
                className={cn(
                  "w-[100px] rounded-lg p-2",
                  showResults ? "border-none" : "border border-picton-blue-500",
                )}
              />
              {renderResultIcon(index, "left")}
            </div>
          </div>

          {/* Center - Operator */}
          <div
            className={cn("flex items-center justify-center", {
              "min-w-[60px]":
                question.operator && question.operator.length === 1,
            })}
          >
            <div className="text-4xl font-bold text-picton-blue-600">
              {question.operator}
            </div>
          </div>

          {/* Right Side - Conditional based on operation type */}
          {isMultDiv ? (
            // For multiplication/division: Show only number, no images or input
            <div className="bg-gray-50 flex items-center justify-center p-4 rounded-lg border border-gray-200 w-full min-h-[100px]">
              <div className="text-5xl font-bold text-picton-blue-700">
                {question.rightNumber}
              </div>
            </div>
          ) : (
            // For addition/subtraction: Show images and input
            <div className="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
              {renderQuantityImages(
                question.rightNumber,
                rightImage,
                "Right item",
              )}
              {/* Right Input Zone */}
              <div className="relative w-fit ml-auto mt-2 md:mt-0">
                <AnswerDropZone
                  id={`${index}-right`}
                  answerType="input"
                  currentAnswer={currentAnswers.right}
                  correctAnswer={question.rightNumber.toString()}
                  showResults={showResults}
                  placeholder="Count"
                  onInputChange={(value) =>
                    handleInputChange(index, "right", value)
                  }
                  className={cn(
                    "w-[100px] rounded-lg p-2",
                    showResults
                      ? "border-none"
                      : "border border-picton-blue-500",
                  )}
                />
                {renderResultIcon(index, "right")}
              </div>
            </div>
          )}

          {/* Equals Sign */}
          <div
            className={cn("flex items-center justify-center", {
              "min-w-[60px]":
                !question.displayAnswer || question.displayAnswer === "=",
            })}
          >
            <div className="text-4xl font-bold text-picton-blue-600">
              {question.displayAnswer || "="}
            </div>
          </div>

          {/* Result Input */}
          <div className="relative w-fit">
            <AnswerDropZone
              id={`${index}-result`}
              answerType="input"
              currentAnswer={currentAnswers.result}
              correctAnswer={question.answer.toString()}
              showResults={showResults}
              placeholder="Answer"
              onInputChange={(value) =>
                handleInputChange(index, "result", value)
              }
              className={cn(
                "w-[120px] rounded-lg p-2",
                showResults ? "border-none" : "border border-picton-blue-500",
              )}
            />
            {renderResultIcon(index, "result")}
          </div>
        </div>

        {showResults && feedback === "wrong-correct-answers" && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-500">
              Correct Answer: {question.leftNumber} {question.operator}{" "}
              {question.rightNumber} {question.displayAnswer || "="}{" "}
              {question.answer}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <div className="flex-1 flex flex-col gap-4 p-4">
        {/* All Questions */}
        <div className="space-y-6">
          {questions.questions.map((question, index) =>
            renderQuestion(question, index),
          )}
        </div>

        {/* Check Answers Button */}
        {!showResults && (
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              Check Answers
            </Button>
          </div>
        )}

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

export default AdditionSubtractionObjects;
