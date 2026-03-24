"use client";

import { ReactNode } from "react";
import Droppable from "@/components/ui/dnd/droppable";
import Draggable from "@/components/ui/dnd/draggable";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AnswerType = "drag-drop" | "input" | "click";

type AnswerDropZoneProps = {
  id: string;
  answerType: AnswerType;
  currentAnswer?: string;
  correctAnswer?: string;
  showResults?: boolean;
  placeholder?: string;
  onInputChange?: (value: string) => void;
  onClickChange?: (value: string) => void;
  className?: string;
  children?: ReactNode;
  isDraggable?: boolean;
  dragId?: string;
  isSelected?: boolean;
};

const AnswerDropZone = ({
  id,
  answerType,
  currentAnswer = "",
  correctAnswer,
  showResults = false,
  placeholder = "Drop answer here",
  onInputChange,
  onClickChange,
  className = "",
  children,
  isDraggable = false,
  dragId,
  isSelected = false,
}: AnswerDropZoneProps) => {
  const isCorrect = showResults && currentAnswer === correctAnswer;
  const isIncorrect =
    showResults && currentAnswer !== correctAnswer && currentAnswer !== "";

  const getResultStyles = () => {
    if (!showResults) return "";
    if (isCorrect) return "!bg-green-200 !text-green-700 !border-green-300";
    if (isIncorrect) return "bg-red-200 text-red-700 border-red-300";
    return "";
  };

  const baseStyles = `
    min-h-[60px] flex items-center justify-center bg-picton-blue-100 rounded-lg transition-colors duration-200
    ${className} ${getResultStyles()}
  `;

  const renderContent = () => {
    if (children) return children;
    if (currentAnswer) return currentAnswer;
    return placeholder;
  };

  switch (answerType) {
    case "drag-drop":
      if (currentAnswer && isDraggable && dragId) {
        return (
          <Draggable
            id={dragId}
            className={`${baseStyles} bg-lemon-200 text-lemon-700 cursor-move`}
          >
            {renderContent()}
          </Draggable>
        );
      }
      return (
        <Droppable
          id={id}
          className={baseStyles}
          isOverClassName="bg-lemon-100 border-lemon-400"
        >
          {renderContent()}
        </Droppable>
      );

    case "input":
      return (
        // <input
        //   type="text"
        //   value={currentAnswer}
        //   onChange={(e) => onInputChange?.(e.target.value)}
        //   placeholder={placeholder}
        //   className={`${baseStyles} p-2 border-solid text-center text-lg font-medium`}
        //   disabled={showResults}
        // />
        <div className={className}>
          <Input
            type="text"
            value={currentAnswer}
            onChange={(e) => onInputChange?.(e.target.value)}
            className={cn(
              "text-center border-none font-medium !text-3xl bg-transparent focus-visible:ring-offset-0",
              showResults && {
                "bg-green-200 text-green-600": isCorrect,
                "bg-red-100 text-red-600": isIncorrect,
              }
            )}
            disabled={showResults}
          />
          <div
            className={cn(
              "border-b border-dashed mt-1",
              showResults
                ? {
                    "border-green-600": isCorrect,
                    "border-red-600": isIncorrect,
                  }
                : "border-picton-blue-700"
            )}
          />
        </div>
      );

    case "click":
      return (
        <div
          onClick={() => !showResults && onClickChange?.(id)}
          className={`transition-colors
            ${isSelected ? "bg-picton-blue-200 border-picton-blue-400" : ""}
            ${
              showResults
                ? "cursor-default"
                : "cursor-pointer hover:bg-picton-blue-100"
            } ${baseStyles}`}
        >
          <div className="flex items-center justify-center gap-2">
            {isSelected && <Check size={32} />}
          </div>
        </div>
      );

    default:
      return <div className={baseStyles}>{renderContent()}</div>;
  }
};

export default AnswerDropZone;
