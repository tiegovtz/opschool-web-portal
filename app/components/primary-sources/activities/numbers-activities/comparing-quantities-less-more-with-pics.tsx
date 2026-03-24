"use client";

import { motion } from "motion/react";
import { Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { DragEndEvent, DragStartEvent, DragMoveEvent } from "@dnd-kit/core";

// Local imports
import { QuantityRenderer } from "./shared";
import AnswerDropZone from "./shared/answer-drop-zone";
import { FeedbackType } from "@/lib/types/activity-types";
import ActivityTitle from "../../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../../tie_open_school_primary_frontend/components/templates/results";
import { Button } from "@/components/ui/button";
import DNDContext from "../../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import { cn } from "@/lib/utils";

type ComparingQuantitiesLessMoreWithPicsProps = {
  questions: {
    title: string;
    questions: {
      leftNumber: number;
      rightNumber: number;
      leftImage: string;
      answer: ">" | "<" | "=";
    }[];
  };
  feedback: FeedbackType;
};

// Comparison operators available for dragging
const OPERATORS = [">", "=", "<"];

const ComparingQuantitiesLessMoreWithPics = ({
  questions,
  feedback,
}: ComparingQuantitiesLessMoreWithPicsProps) => {
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<number, { left: string; right: string; operator: string }>
  >({});
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);

  // DND states
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);

  const { playSound } = useSoundEffects();

  const totalQuestions = questions.questions.length;

  // Initialize question answers when component mounts
  useEffect(() => {
    const initialAnswers: Record<
      number,
      { left: string; right: string; operator: string }
    > = {};
    questions.questions.forEach((_, index) => {
      initialAnswers[index] = { left: "", right: "", operator: "" };
    });
    setQuestionAnswers(initialAnswers);
  }, [questions]);

  // Check if all questions are answered to enable submit button
  useEffect(() => {
    const answeredQuestions = Object.keys(questionAnswers).filter((key) => {
      const answers = questionAnswers[parseInt(key)];
      return answers.left && answers.right && answers.operator;
    });

    setCanSubmit(answeredQuestions.length === totalQuestions);
  }, [questionAnswers, totalQuestions]);

  const handleSubmit = () => {
    let totalScore = 0;
    const correct: string[] = [];

    questions.questions.forEach((question, index) => {
      const userAnswers = questionAnswers[index];
      const isLeftCorrect = parseInt(userAnswers.left) === question.leftNumber;
      const isRightCorrect =
        parseInt(userAnswers.right) === question.rightNumber;
      const isOperatorCorrect = userAnswers.operator === question.answer;

      if (isLeftCorrect && isRightCorrect && isOperatorCorrect) {
        totalScore += 1;
        correct.push(index.toString());
      }

      // Track individual field correctness for visual feedback
      if (isLeftCorrect) {
        correct.push(`${index}-left`);
      }
      if (isRightCorrect) {
        correct.push(`${index}-right`);
      }
      if (isOperatorCorrect) {
        correct.push(`${index}-operator`);
      }
    });

    setScore(totalScore);
    setCorrectAnswers(correct);
    setAllAnswered(true);
    playSound("success");
  };

  const handleInputChange = (
    questionIndex: number,
    field: "left" | "right",
    value: string
  ) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        [field]: value,
      },
    }));
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const el = document.getElementById(String(active.id));
    if (!el) return;

    const { x, y } = {
      x: el.offsetLeft + el.offsetWidth / 2,
      y: el.offsetTop + el.offsetHeight / 2,
    };

    setDragStart({ x, y });
    playSound("click");
  };

  // Handle drag move
  const handleDragMove = (event: DragMoveEvent) => {
    if (!dragStart) return;

    const { delta } = event;
    setDragEnd({
      x: dragStart.x + delta.x,
      y: dragStart.y + delta.y,
    });
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setDragStart(null);
    setDragEnd(null);

    if (!over) return;

    const operatorValue = String(active.id).split("-")[1];
    const targetId = String(over.id);

    if (targetId.includes("operator-drop")) {
      const questionIndex = parseInt(targetId.split("-")[2]);

      setQuestionAnswers((prev) => ({
        ...prev,
        [questionIndex]: {
          ...prev[questionIndex],
          operator: operatorValue,
        },
      }));

      playSound("click");
    }
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
      { left: string; right: string; operator: string }
    > = {};
    questions.questions.forEach((_, index) => {
      initialAnswers[index] = { left: "", right: "", operator: "" };
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
    currentValue: string
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
      operator: "",
    };

    return (
      <div key={index} className="bg-white rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          {/* Left Side */}
          <div className="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
            {renderQuantityImages(
              question.leftNumber,
              question.leftImage,
              "Left item"
            )}
            {/* Left Input Zone */}
            <div className="relative w-fit ml-auto">
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
                  "w-[100px] rounded-lg p-2 ",
                  showResults ? "border-none" : "border border-picton-blue-500"
                )}
              />
              {renderResultIcon(index, "left")}
            </div>
          </div>

          {/* Center - Operator Drop Zone */}
          <div className="relative">
            <Droppable
              id={`operator-drop-${index}`}
              isOverClassName="bg-lemon-100"
              className={cn(
                "min-w-[80px] min-h-[60px] flex items-center justify-center text-2xl font-bold bg-picton-blue-100 rounded-lg",
                currentAnswers.operator
                  ? "border-picton-blue-400 bg-picton-blue-100"
                  : "border-gray-300",
                showResults &&
                  getFieldStyles(index, "operator", currentAnswers.operator)
              )}
            >
              {currentAnswers.operator && (
                <div className="text-2xl font-bold">
                  {currentAnswers.operator}
                </div>
              )}
            </Droppable>
            {showResults && renderResultIcon(index, "operator")}
          </div>

          {/* Right Side */}
          <div className="bg-gray-50 md:flex md:items-center gap-2 p-4 rounded-lg border border-gray-200 w-full">
            {/* Right Input Zone */}
            <div className="relative w-fit ml-auto">
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
                  showResults ? "border-none" : "border border-picton-blue-500"
                )}
              />
              {renderResultIcon(index, "right")}
            </div>
            {renderQuantityImages(
              question.rightNumber,
              question.leftImage,
              "Right item"
            )}
          </div>
        </div>

        {showResults && feedback === "wrong-correct-answers" && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-500">
              Correct Answer: {question.leftNumber} {question.answer}{" "}
              {question.rightNumber}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ActivityTitle title={questions.title} />

      <DNDContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
      >
        <div className="flex-1 flex flex-col gap-4 p-4">
          {/* Operator Bank */}
          <div className="flex justify-center gap-4 sticky top-4 z-10 bg-picton-blue-100 px-4 py-2 rounded-lg mx-auto w-fit">
            {OPERATORS.map((op) => (
              <Draggable
                key={`operator-${op}`}
                id={`operator-${op}`}
                className="bg-white w-16 h-16 rounded-lg flex items-center justify-center text-3xl font-bold shadow cursor-grab hover:shadow-lg z-10"
              >
                {op}
              </Draggable>
            ))}
          </div>

          {/* All Questions */}
          <div className="space-y-6">
            {questions.questions.map((question, index) =>
              renderQuestion(question, index)
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
      </DNDContext>
    </div>
  );
};

export default ComparingQuantitiesLessMoreWithPics;
