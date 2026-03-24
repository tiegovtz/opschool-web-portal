"use client";

import { useRef, useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";

// Local imports
import { cn } from "@/lib/utils";
import DNDContext from "../../../../../tie_open_school_primary_frontend/components/layout/dnd-context";
import Draggable from "../../../../../tie_open_school_primary_frontend/components/ui/dnd/draggable";
import ActivityTitle from "../../../../../tie_open_school_primary_frontend/components/templates/activity-title";
import { FeedbackType } from "@/lib/types/activity-types";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "../../../../../tie_open_school_primary_frontend/components/templates/results";

type DroppableArea = (
  props: React.HTMLAttributes<HTMLDivElement> & { id: string }
) => JSX.Element;

// Define Component Types
type TComparingQuantityWithText = {
  feedback?: FeedbackType;
  firstNumber: number;
  lastNumber: number;
  answer: string;
}[];

const DroppableArea: DroppableArea = ({ id, ...props }) => {
  return <div id={id} {...props}></div>;
};

const ComparingQuatityWithText: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const options = ["is less than", "is equal to", "is greater than"];

  const serverQuestions: TComparingQuantityWithText = [
    {
      firstNumber: 5,
      lastNumber: 3,
      answer: "is greater than",
    },
    {
      firstNumber: 2,
      lastNumber: 7,
      answer: "is less than",
    },
    {
      firstNumber: 4,
      lastNumber: 4,
      answer: "is equal to",
    },
    {
      firstNumber: 9,
      lastNumber: 6,
      answer: "is greater than",
    },
    {
      firstNumber: 1,
      lastNumber: 8,
      answer: "is less than",
    },
  ];

  const [questions, setQuestions] = useState(
    serverQuestions.map((question) => ({
      ...question,
      answer: "",
    }))
  );
  const [score, setScore] = useState(0);
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { playSound } = useSoundEffects();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.data.current) {
      const questionIndex = Number(over.id);
      const option = String(active.id).split("%")[2];

      setQuestions((prev) => {
        const newQuestions = [...prev];
        // Set the answer for the dropped question
        newQuestions[questionIndex] = {
          ...newQuestions[questionIndex],
          answer: option,
        };

        // Check if all questions have answers now
        const allQuestionsAnswered = newQuestions.every(
          (question) => question.answer !== ""
        );

        if (allQuestionsAnswered) {
          const correctAnswers = newQuestions.filter(
            (question, i) => question.answer === serverQuestions[i].answer
          ).length;
          setScore(correctAnswers);
          setAllAnswered(true);
          playSound("success");
        }

        return newQuestions;
      });
    }
  };

  const resetActivity = () => {
    setAllAnswered(false);
    setScore(0);
    setShowResults(false);
    setQuestions(
      serverQuestions.map((question) => ({
        ...question,
        answer: "",
      }))
    );
  };

  return (
    <DNDContext
      onDragEnd={handleDragEnd}
      modifiers={[restrictToHorizontalAxis]}
    >
      <div className="h-full flex flex-col">
        <ActivityTitle title="Drag the labels to the gaps to complete the sentences" />

        {!showResults ? (
          <div className="flex flex-col justify-between h-full gap-4">
            {questions.map((qn, questionIndex) => (
              <div
                ref={containerRef}
                key={questionIndex}
                className="flex items-center justify-between bg-picton-blue-50 p-2 h-full"
              >
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xl">
                    <p>{questionIndex + 1}</p>
                    <div className="flex items-center gap-4">
                      <span>{qn.firstNumber}</span>
                      {qn?.answer ? (
                        <span className="bg-lemon-100 text-lemon-700 px-4 py-2 rounded-xl">
                          {qn.answer}
                        </span>
                      ) : (
                        <DroppableArea
                          id={questionIndex.toString()}
                          className="w-28 h-12 flex items-center bg-picton-blue-200 justify-center rounded-xl"
                        ></DroppableArea>
                      )}
                      <span>{` ${
                        qn?.firstNumber > qn?.lastNumber ||
                        qn?.firstNumber < qn?.lastNumber
                          ? "than"
                          : "to"
                      } ${qn?.lastNumber}`}</span>
                    </div>
                  </div>

                  {/* Droppable slots */}
                  <div className="flex space-x-2">
                    {options.map((option) =>
                      !qn.answer || qn.answer !== option ? (
                        <Draggable
                          key={option}
                          id={`option%${questionIndex}%${option}`}
                          disabled={qn.answer !== ""}
                          className={cn(
                            "p-2 flex items-center bg-picton-blue-200 justify-center rounded-xl",
                            {
                              "opacity-50 cursor-not-allowed": qn.answer !== "",
                            }
                          )}
                        >
                          {option}
                        </Draggable>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-between p-4">
            <div className="w-full space-y-3">
              {questions.map((qn, idx) => {
                const serverQuestion = serverQuestions[idx];
                const isCorrect = qn.answer === serverQuestion.answer;

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-md border flex items-center gap-3 ${
                      isCorrect
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isCorrect ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 13L9 17L19 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M18 6L6 18M6 6L18 18"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium">Question {idx + 1}</p>
                      <div className="text-sm mt-1">
                        <span>{qn.firstNumber} </span>
                        <span
                          className={
                            isCorrect
                              ? "text-green-700 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {qn.answer}
                        </span>
                        <span>
                          {" "}
                          {qn.firstNumber > qn.lastNumber ||
                          qn.firstNumber < qn.lastNumber
                            ? "than"
                            : "to"}{" "}
                          {qn.lastNumber}
                        </span>
                        {!isCorrect && (
                          <div className="mt-1 text-green-700">
                            Correct answer: {serverQuestion.answer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="w-full mt-4">
              <ActivityResults
                score={score}
                total={questions.length}
                onRestart={resetActivity}
              />
            </div>
          </div>
        )}
      </div>

      <ActivityResultsAlertDialog
        score={score}
        total={questions.length}
        open={allAnswered && !showResults}
        onOpenChange={(open) => {
          if (!open) {
            setShowResults(true);
          }
          setAllAnswered(open);
        }}
      />
    </DNDContext>
  );
};

export default ComparingQuatityWithText;
