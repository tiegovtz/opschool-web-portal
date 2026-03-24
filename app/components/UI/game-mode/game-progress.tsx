"use client";

import React from "react";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GameProgressItem {
  id: string | number;
  isCompleted: boolean;
  isCorrect?: boolean;
  isCurrent?: boolean;
  label?: string;
  timeSpent?: number;
}

interface GameProgressProps {
  items: GameProgressItem[];
  showLabels?: boolean;
  showTimeSpent?: boolean;
  className?: string;
  itemClassName?: string;
}

export const GameProgress: React.FC<GameProgressProps> = ({
  items,
  showLabels = false,
  showTimeSpent = false,
  className,
  itemClassName,
}) => {
  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {items.map((item, index) => {
        const { id, isCompleted, isCorrect, isCurrent, label, timeSpent } =
          item;

        return (
          <div key={id} className="flex flex-col items-center gap-1">
            {/* Progress Item */}
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                {
                  "bg-green-100 border-2 border-green-300":
                    isCompleted && isCorrect,
                  "bg-red-100 border-2 border-red-300":
                    isCompleted && !isCorrect,
                  "bg-picton-blue-200": !isCompleted && !isCurrent,
                  "bg-picton-blue-100 border-2 border-picton-blue-500 shadow-md":
                    isCurrent && !isCompleted,
                },
                itemClassName,
              )}
            >
              {isCompleted ? (
                isCorrect ? (
                  <Check className="text-green-600" size={20} />
                ) : (
                  <X className="text-red-600" size={20} />
                )
              ) : (
                <span
                  className={cn("text-sm font-medium", {
                    "text-picton-blue-700": isCurrent,
                    "text-gray-500": !isCurrent,
                  })}
                >
                  {index + 1}
                </span>
              )}
            </div>

            {/* Label */}
            {showLabels && label && (
              <div className="text-xs text-gray-600 text-center">{label}</div>
            )}

            {/* Time Spent */}
            {showTimeSpent && timeSpent !== undefined && isCompleted && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={10} />
                <span>{Math.round(timeSpent / 1000)}s</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Helper function to create progress items from simple completion data
export const createProgressItems = (
  completedItems: Set<number>,
  incorrectItems: Set<number>,
  currentIndex: number,
  totalItems: number,
  itemTimes?: Record<number, number>,
): GameProgressItem[] => {
  return Array.from({ length: totalItems }, (_, index) => ({
    id: index,
    isCompleted: completedItems.has(index),
    isCorrect: completedItems.has(index) && !incorrectItems.has(index),
    isCurrent: index === currentIndex,
    timeSpent: itemTimes?.[index],
  }));
};
