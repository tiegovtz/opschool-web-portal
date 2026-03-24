"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { DragEndEvent } from "@dnd-kit/core";

// Local imports
import { shuffle } from "@/lib/utils";
import { QuantityRenderer } from "./shared";
import Draggable from "@/components/ui/dnd/draggable";
import Droppable from "@/components/ui/dnd/droppable";
import DNDContext from "@/components/layout/dnd-context";
import { FeedbackType } from "@/lib/types/activity-types";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";

type ComparingQuantitiesDraggingProps = {
  questions: {
    title: string;
    questions: {
      leftNumber: number;
      leftAnswer: string;
      leftImage: string;
      rightNumber: number;
      rightAnswer: string;
      rightImage: string;
    }[];
  };
  feedbackType: FeedbackType;
};

const ComparingQuantitiesDragging = ({
  questions,
  feedbackType,
}: ComparingQuantitiesDraggingProps) => {
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<number, { left: string; right: string }>
  >({});
  const [questionAvailableAnswers, setQuestionAvailableAnswers] = useState<
    Record<number, string[]>
  >({});
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);

  const { playSound } = useSoundEffects();

  const totalQuestions = questions.questions.length;

  // Initialize available answers and question answers when component mounts
  useEffect(() => {
    const initialAnswers: Record<number, { left: string; right: string }> = {};
    const initialAvailableAnswers: Record<number, string[]> = {};

    questions.questions.forEach((question, index) => {
      const answers = [question.leftAnswer, question.rightAnswer];
      initialAnswers[index] = { left: "", right: "" };
      initialAvailableAnswers[index] = shuffle(answers);
    });

    setQuestionAnswers(initialAnswers);
    setQuestionAvailableAnswers(initialAvailableAnswers);
  }, [questions]);

  // Check if all questions are answered and calculate score
  useEffect(() => {
    const answeredQuestions = Object.keys(questionAnswers).filter((key) => {
      const answers = questionAnswers[parseInt(key)];
      return answers && answers.left && answers.right;
    });

    if (answeredQuestions.length === totalQuestions) {
      let totalScore = 0;
      const correct: string[] = [];

      questions.questions.forEach((question, index) => {
        const answers = questionAnswers[index];
        if (answers) {
          const isLeftCorrect = answers.left === question.leftAnswer;
          const isRightCorrect = answers.right === question.rightAnswer;

          if (isLeftCorrect && isRightCorrect) {
            totalScore += 1;
          }

          if (isLeftCorrect) {
            correct.push(`${index}-left`);
          }
          if (isRightCorrect) {
            correct.push(`${index}-right`);
          }
        }
      });

      setScore(totalScore);
      setCorrectAnswers(correct);
      setAllAnswered(true);
      playSound("success");
    }
  }, [questionAnswers, questions, totalQuestions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Parse activeId: Can be "answer-questionIndex-answerValue" or "dropped-questionIndex-side-answerValue"
    const activeIdParts = activeId.split("-");
    if (activeIdParts.length < 3) return;

    let sourceQuestionIndex: number;
    let answer: string;
    let sourceType: "available" | "dropped";
    let sourceSide: string | null = null;

    if (activeIdParts[0] === "answer") {
      // From available answers
      sourceType = "available";
      sourceQuestionIndex = parseInt(activeIdParts[1]);
      answer = activeIdParts[2];
    } else if (activeIdParts[0] === "dropped") {
      // From dropped zone
      sourceType = "dropped";
      sourceQuestionIndex = parseInt(activeIdParts[1]);
      sourceSide = activeIdParts[2];
      answer = activeIdParts[3];
    } else {
      return;
    }

    // Parse overId: "questionIndex-side"
    const overIdParts = overId.split("-");
    if (overIdParts.length !== 2) return;

    const targetQuestionIndex = parseInt(overIdParts[0]);
    const side = overIdParts[1];

    // Only allow dropping on the same question
    if (sourceQuestionIndex !== targetQuestionIndex) return;

    if (side === "left" || side === "right") {
      // If moving from a dropped zone, clear the source zone first
      if (sourceType === "dropped" && sourceSide) {
        setQuestionAnswers((prev) => ({
          ...prev,
          [sourceQuestionIndex]: {
            ...prev[sourceQuestionIndex],
            [sourceSide]: "",
          },
        }));

        // If moving to a different zone, also need to handle the existing answer in target zone
        const currentTargetAnswer =
          questionAnswers[targetQuestionIndex]?.[side];
        if (currentTargetAnswer && currentTargetAnswer !== answer) {
          // Return the displaced answer to available answers
          setQuestionAvailableAnswers((prev) => ({
            ...prev,
            [targetQuestionIndex]: [
              ...prev[targetQuestionIndex],
              currentTargetAnswer,
            ],
          }));
        }
      }

      // If moving from available answers, remove from available
      if (sourceType === "available") {
        setQuestionAvailableAnswers((prev) => ({
          ...prev,
          [targetQuestionIndex]: prev[targetQuestionIndex].filter(
            (a) => a !== answer
          ),
        }));

        // If target zone already has an answer, return it to available
        const currentTargetAnswer =
          questionAnswers[targetQuestionIndex]?.[side];
        if (currentTargetAnswer) {
          setQuestionAvailableAnswers((prev) => ({
            ...prev,
            [targetQuestionIndex]: [
              ...prev[targetQuestionIndex],
              currentTargetAnswer,
            ],
          }));
        }
      }

      // Set the new answer in the target zone
      setQuestionAnswers((prev) => ({
        ...prev,
        [targetQuestionIndex]: {
          ...prev[targetQuestionIndex],
          [side]: answer,
        },
      }));

      playSound("click");
    }
  };

  const resetActivity = () => {
    setScore(0);
    setShowResults(false);
    setAllAnswered(false);
    setCorrectAnswers([]);

    // Reset question answers
    const initialAnswers: Record<number, { left: string; right: string }> = {};
    const initialAvailableAnswers: Record<number, string[]> = {};

    questions.questions.forEach((question, index) => {
      const answers = [question.leftAnswer, question.rightAnswer];
      initialAnswers[index] = { left: "", right: "" };
      initialAvailableAnswers[index] = shuffle(answers);
    });

    setQuestionAnswers(initialAnswers);
    setQuestionAvailableAnswers(initialAvailableAnswers);
  };

  const iconVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", damping: 10 },
    },
  };

  const isCorrect = (questionIndex: number, side: "left" | "right") => {
    return correctAnswers.includes(`${questionIndex}-${side}`);
  };

  const renderResultIcon = (questionIndex: number, side: "left" | "right") => {
    if (!showResults) return null;

    return isCorrect(questionIndex, side) ? (
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
  };

  const renderQuantityImages = (count: number, image: string, alt: string) => {
    return (
      <QuantityRenderer
        count={count}
        image={image}
        maxItemsPerRow={7}
        className="md:max-w-[350px] xl:max-w-full flex-wrap"
      />
    );
  };

  const renderQuestion = (question: any, index: number) => {
    const currentAnswers = questionAnswers[index] || { left: "", right: "" };
    const availableAnswers = questionAvailableAnswers[index] || [];

    return (
      <div key={index} className="bg-white rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side */}
          <div className="bg-gray-50 p-4 md:flex md:items-center gap-2 rounded-lg border border-gray-200 w-full">
            {renderQuantityImages(
              question.leftNumber,
              question.leftImage,
              "Left item"
            )}
            <div className="relative w-fit ml-auto mt-2 md:mt-0">
              <Droppable
                id={`${index}-left`}
                className={`h-[50px] w-[90px] flex items-center justify-center rounded-lg transition-colors bg-picton-blue-100 duration-200 ${
                  currentAnswers.left
                    ? showResults
                      ? isCorrect(index, "left")
                        ? "bg-green-200 text-green-700 border-green-300"
                        : "bg-red-200 text-red-700 border-red-300"
                      : "bg-lemon-200 text-lemon-700 border-lemon-300"
                    : "border-picton-blue-300"
                }`}
                isOverClassName="bg-lemon-100 border-lemon-400"
              >
                {currentAnswers.left && !showResults ? (
                  <Draggable
                    id={`dropped-${index}-left-${currentAnswers.left}`}
                    className="bg-lemon-200 text-lemon-700 h-[50px] w-[90px] rounded-md cursor-move hover:bg-lemon-200 transition-colors text-lg font-medium flex justify-center items-center"
                  >
                    {currentAnswers.left}
                  </Draggable>
                ) : (
                  currentAnswers.left
                )}
              </Droppable>
              {renderResultIcon(index, "left")}
            </div>
          </div>

          {/* Center - Available Answers */}
          <div className="flex flex-col items-center gap-4 max-w-[300px]">
            {/* Available Answers for this question */}
            {!showResults && availableAnswers.length > 0 && (
              <div className="flex md:flex-col justify-center gap-3">
                {availableAnswers.map((answer, answerIndex) => (
                  <Draggable
                    key={`answer-${index}-${answer}-${answerIndex}`}
                    id={`answer-${index}-${answer}`}
                    className="bg-picton-blue-100 text-picton-blue-700 h-[50px] w-[90px] z-10 rounded-lg border border-picton-blue-300 cursor-move hover:bg-picton-blue-200 transition-colors text-lg font-medium flex justify-center items-center"
                  >
                    {answer}
                  </Draggable>
                ))}
              </div>
            )}

            {showResults && feedbackType === "wrong-correct-answers" && (
              <div className="text-center">
                <div className="text-sm text-gray-500">
                  Correct: {question.leftAnswer} | {question.rightAnswer}
                </div>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="bg-gray-50 md:flex md:items-center p-4 gap-2 rounded-lg border border-gray-200 w-full">
            <div className="relative w-fit ml-auto mt-2">
              <Droppable
                id={`${index}-right`}
                className={`h-[50px] w-[90px] flex items-center justify-center rounded-lg transition-colors bg-picton-blue-100  duration-200 ${
                  currentAnswers.right
                    ? showResults
                      ? isCorrect(index, "right")
                        ? "bg-green-200 text-green-700 border-green-300"
                        : "bg-red-200 text-red-700 border-red-300"
                      : "bg-lemon-200 text-lemon-700 "
                    : "border-picton-blue-300"
                }`}
                isOverClassName="bg-lemon-100 border-lemon-400"
              >
                {currentAnswers.right && !showResults ? (
                  <Draggable
                    id={`dropped-${index}-right-${currentAnswers.right}`}
                    className="bg-lemon-200 text-lemon-700 h-[50px] w-[90px] rounded-md border border-lemon-300 cursor-move hover:bg-lemon-200 transition-colors text-lg font-medium flex items-center justify-center"
                  >
                    {currentAnswers.right}
                  </Draggable>
                ) : (
                  currentAnswers.right
                )}
              </Droppable>
              {renderResultIcon(index, "right")}
            </div>
            {renderQuantityImages(
              question.rightNumber,
              question.rightImage,
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
        <DNDContext onDragEnd={handleDragEnd}>
          {/* All Questions */}
          <div className="space-y-6">
            {questions.questions.map((question, index) =>
              renderQuestion(question, index)
            )}
          </div>
        </DNDContext>

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
              if (feedbackType === "none") {
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

export default ComparingQuantitiesDragging;
