"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { ShapeQuestion } from "./types";
import { cn } from "@/lib/utils";
import ActivityResults from "@/components/templates/results";

type ResultsSummaryProps = {
  questions: ShapeQuestion[];
  score: number;
  answers: { [key: number]: string };
  feedbacks: { [key: number]: boolean };
  resultCanvasRefs: React.MutableRefObject<(HTMLCanvasElement | null)[]>;
  onRestart: () => void;
};

const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  questions,
  score,
  answers,
  feedbacks,
  resultCanvasRefs,
  onRestart,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-auto">
      <div className="w-full space-y-4">
        {questions.map((question: ShapeQuestion, idx: number) => {
          const userAnswer = answers[idx] || "";
          const isCorrect =
            userAnswer.toLowerCase() === question.answer.toLowerCase();
          // Find the user's selected option shape if incorrect
          let userSelectedShape = null;
          if (!isCorrect && userAnswer && question.options) {
            // If user chose a different option, we need to figure out what it is
            const userOption = question.options.find(
              (opt: string) => opt.toLowerCase() === userAnswer.toLowerCase()
            );
            if (userOption) {
              // For simplicity, we'll use the same shape but change color
              userSelectedShape = {
                ...question.shape,
                color: "#ff5555", // Red color for incorrect answer
              };
            }
          }

          return (
            <div
              key={question.id}
              className={cn(
                "p-4 rounded-md border",
                isCorrect
                  ? "border-green-300 bg-green-50"
                  : "border-red-300 bg-red-50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-lg">Question {idx + 1}</p>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isCorrect
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {isCorrect ? <Check size={18} /> : <X size={18} />}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm font-medium mb-1 text-gray-500">
                    Correct Shape:
                  </p>
                  <div className="flex flex-col items-center">
                    <canvas
                      ref={(el) => {
                        resultCanvasRefs.current[idx] = el;
                        return undefined;
                      }}
                      width={200}
                      height={200}
                      className="border border-green-300 rounded-md bg-white"
                    />
                    <span className="mt-2 font-medium text-green-700">
                      {question.answer}
                    </span>
                  </div>
                </div>

                {!isCorrect && userAnswer && (
                  <div>
                    <p className="text-sm font-medium mb-1 text-gray-500">
                      Your Answer:
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="border border-red-300 rounded-md h-[200px] w-[200px] flex items-center justify-center bg-white">
                        {/* We're not rendering another canvas, just showing the text for simplicity */}
                        <span className="font-medium text-red-700 text-lg">
                          {userAnswer}
                        </span>
                      </div>
                      <span className="mt-2 font-medium text-red-700">
                        {userAnswer}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="w-full mt-4">
        <ActivityResults
          score={score}
          total={questions.length}
          onRestart={onRestart}
        />
      </div>
    </div>
  );
};

export default ResultsSummary;
