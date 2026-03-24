"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X } from "lucide-react";

// Local imports
import { Input } from "../../../../../../tie_open_school_primary_frontend/components/ui/input";
import { Button } from "../../../../../../tie_open_school_primary_frontend/components/ui/button";
import { cn, shuffle } from "@/lib/utils";
import ActivityTitle from "../../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../../tie_open_school_primary_frontend/components/templates/results";
import { processGeometryData } from "@/lib/utils/shapes-utils";
import {
  draw2DShape,
  draw3DShape,
  drawPolygon,
  drawSegmentedShape,
} from "./drawing-utils";

// Local components
import ShapeCanvas from "./ShapeCanvas";
import {
  ShapeQuestion,
  ShapesData,
  Shape2D,
  Shape3D,
  SegmentedShape,
} from "./types";
import { useIsMobile } from "@/hooks";

type ShapesRenderingActivityProps = {
  feedback?: FeedbackType;
  questions?: ShapesData;
};

const ShapesRenderingActivity: React.FC<ShapesRenderingActivityProps> = ({
  feedback,
  questions: questionsData,
}) => {
  const isMobile = useIsMobile();
  // If no questions provided, use the processGeometryData function
  const processedData = !questionsData ? processGeometryData() : questionsData;

  const resultCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const [shuffledOptions, setShuffledOptions] = useState<{
    [key: number]: string[];
  }>({});

  // Local state management without useActivityBase
  const [answers, setAnswers] = useState<string[]>([]);
  const [checkedAnswers, setCheckedAnswers] = useState(false);
  const [feedbacks, setFeedbacks] = useState<boolean[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Initialize answers array with empty strings
  useEffect(() => {
    setAnswers(new Array(processedData.questions.length).fill(""));
    setFeedbacks(new Array(processedData.questions.length).fill(false));
  }, [processedData.questions.length]);

  // Initialize shuffled options for multiple choice questions
  useEffect(() => {
    const initialShuffledOptions: { [key: number]: string[] } = {};
    processedData.questions.forEach((question: ShapeQuestion, idx: number) => {
      if (question.options && question.options.length > 0) {
        initialShuffledOptions[idx] = question.options;
      }
    });
    setShuffledOptions(initialShuffledOptions);
  }, [processedData.questions]);

  // Custom reset function to shuffle options again
  const handleCustomReset = () => {
    setAnswers(new Array(processedData.questions.length).fill(""));
    setCheckedAnswers(false);
    setFeedbacks(new Array(processedData.questions.length).fill(false));
    setShowResults(false);
    setScore(0);
    const newShuffledOptions: { [key: number]: string[] } = {};
    processedData.questions.forEach((question: ShapeQuestion, idx: number) => {
      if (question.options && question.options.length > 0) {
        newShuffledOptions[idx] = shuffle([...question.options]);
      }
    });
    setShuffledOptions(newShuffledOptions);
  };
  // Handle text input change
  const handleTextInputChange = (questionIndex: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  // Handle option selection
  const handleOptionSelect = (questionIndex: number, option: string) => {
    if (checkedAnswers) return; // Don't allow changes after checking

    const newAnswers = [...answers];
    newAnswers[questionIndex] = option;
    setAnswers(newAnswers);
  };

  // Check all answers at once
  const handleCheckAllAnswers = () => {
    const newFeedbacks: boolean[] = [];
    let correctCount = 0;

    processedData.questions.forEach((question, index) => {
      const userAnswer = answers[index] || "";
      const isCorrect =
        userAnswer.trim().toLowerCase() === question.answer.toLowerCase();
      newFeedbacks[index] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setFeedbacks(newFeedbacks);
    setScore(correctCount);
    setCheckedAnswers(true);
  };
  // Render shapes on result canvases when showing results
  useEffect(() => {
    if (showResults) {
      processedData.questions.forEach((question, idx) => {
        const canvas = resultCanvasRefs.current[idx];
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // Render the shape on the result canvas
            const shape = question.shape;
            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas and set styles
            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;

            if (shape.type === "polygon") {
              drawPolygon(ctx, shape, width, height);
            } else if (shape.type.startsWith("segmented")) {
              drawSegmentedShape(ctx, shape as SegmentedShape, width, height);
            } else if (
              [
                "circle",
                "triangle",
                "square",
                "rectangle",
                "pentagon",
                "hexagon",
                "star",
                "oval",
              ].includes(shape.type)
            ) {
              draw2DShape(ctx, shape as Shape2D, width, height);
            } else {
              draw3DShape(ctx, shape as Shape3D, width, height);
            }
          }
        }
      });
    }
  }, [showResults, processedData.questions]);

  return (
    <div className="flex flex-col h-full">
      <ActivityTitle title={processedData.title} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {processedData.questions.map(
              (question: ShapeQuestion, questionIndex: number) => {
                const isChecked = checkedAnswers;
                const isCorrect = feedbacks[questionIndex] === true;
                const answer = answers[questionIndex] || "";

                return (
                  <motion.div
                    key={`question-${question.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "relative p-6 border rounded-xl bg-white flex-col flex items-center",
                      isChecked &&
                        (isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"),
                      {
                        "flex-row":
                          question.answer && /^\d+\/\d+$/.test(question.answer),
                      }
                    )}
                  >
                    <div className="w-full">
                      <ShapeCanvas
                        question={question}
                        canvasIndex={questionIndex}
                        width={isMobile ? 200 : 300}
                        height={isMobile ? 200 : 300}
                        className="mx-auto" // border border-black
                      />
                    </div>
                    {isChecked && (
                      <div className="absolute top-4 right-4">
                        {isCorrect ? (
                          <Check className="h-6 w-6 text-green-500" />
                        ) : (
                          <X className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                    )}

                    <div className="w-full">
                      {question.options && question.options.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-auto">
                          {shuffledOptions[questionIndex]?.map(
                            (option, optionIndex) => {
                              const isUserAnswer = answer === option;
                              const isCorrectAnswer =
                                option === question.answer;
                              const showCorrectAnswer =
                                feedback === "wrong-correct-answers";
                              const showFeedbackOnly =
                                feedback === "wrong-correct";

                              return (
                                <Button
                                  key={`option-${optionIndex}`}
                                  variant={
                                    isUserAnswer ? "brand" : "outline-brand"
                                  }
                                  className={cn(
                                    "w-full justify-start",
                                    isChecked &&
                                      showCorrectAnswer &&
                                      isCorrectAnswer &&
                                      "bg-green-500 hover:bg-green-600 text-white border-green-500",
                                    isChecked &&
                                      showCorrectAnswer &&
                                      isUserAnswer &&
                                      !isCorrectAnswer &&
                                      "bg-red-500 hover:bg-red-600 text-white",
                                    isChecked &&
                                      showFeedbackOnly &&
                                      isUserAnswer &&
                                      isCorrectAnswer &&
                                      "bg-green-500 hover:bg-green-600 text-white border-green-500",
                                    isChecked &&
                                      showFeedbackOnly &&
                                      isUserAnswer &&
                                      !isCorrectAnswer &&
                                      "bg-red-500 hover:bg-red-600 text-white"
                                  )}
                                  onClick={() =>
                                    !isChecked &&
                                    handleOptionSelect(questionIndex, option)
                                  }
                                  disabled={isChecked}
                                >
                                  {option}
                                </Button>
                              );
                            }
                          )}
                        </div>
                      ) : // Check if the answer format is a fraction (number/number)
                      question.answer && /^\d+\/\d+$/.test(question.answer) ? (
                        <div className="flex flex-col items-center w-full">
                          <Input
                            type="text"
                            value={answer.split("/")[0] || ""}
                            onChange={(e) => {
                              const denominator = answer.split("/")[1] || "";
                              handleTextInputChange(
                                questionIndex,
                                `${e.target.value}${
                                  denominator ? "/" + denominator : ""
                                }`
                              );
                            }}
                            disabled={isChecked}
                            className={cn(
                              "mb-2 text-center max-w-20 !text-2xl",
                              isChecked &&
                                (isCorrect
                                  ? "border-green-500 text-green-600"
                                  : "border-red-500 text-red-600")
                            )}
                          />
                          <div className="w-full border-t border-gray-300 mb-2 max-w-24"></div>
                          <Input
                            type="text"
                            value={answer.split("/")[1] || ""}
                            onChange={(e) => {
                              const numerator = answer.split("/")[0] || "";
                              handleTextInputChange(
                                questionIndex,
                                `${numerator}/${e.target.value}`
                              );
                            }}
                            disabled={isChecked}
                            className={cn(
                              "text-center max-w-20 !text-2xl",
                              isChecked &&
                                (isCorrect
                                  ? "border-green-500 text-green-600"
                                  : "border-red-500 text-red-600")
                            )}
                          />
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <Input
                            type="text"
                            placeholder="Enter your answer..."
                            value={answer}
                            onChange={(e) =>
                              handleTextInputChange(
                                questionIndex,
                                e.target.value
                              )
                            }
                            disabled={isChecked}
                            className={cn(
                              "!text-lg",
                              isChecked &&
                                (isCorrect
                                  ? "border-green-500 text-green-600"
                                  : "border-red-500 text-red-600")
                            )}
                          />
                        </div>
                      )}

                      {/* Show correct answer if feedback allows it and answer is wrong */}
                      {isChecked &&
                        !isCorrect &&
                        feedback === "wrong-correct-answers" && (
                          <div className="mt-2 text-sm text-green-600 font-medium">
                            Correct answer: {question.answer}
                          </div>
                        )}
                    </div>
                  </motion.div>
                );
              }
            )}
          </AnimatePresence>
        </div>

        {/* Check All Answers Button */}
        {!checkedAnswers && (
          <div className="mt-6 ml-auto w-fit">
            <Button
              onClick={handleCheckAllAnswers}
              disabled={answers.every((answer) => !answer.trim())}
              variant="brand-lemon"
            >
              Check All Answers
            </Button>
          </div>
        )}
        {showResults && (
          <ActivityResults
            score={score}
            total={processedData.questions.length}
            onRestart={handleCustomReset}
            className="mt-10"
          />
          // <div className="mt-6 flex flex-col items-center">
          // </div>
        )}
      </div>
      <ActivityResultsAlertDialog
        score={score}
        total={processedData.questions.length}
        open={checkedAnswers && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
        }}
      />
    </div>
  );
};

export default ShapesRenderingActivity;
