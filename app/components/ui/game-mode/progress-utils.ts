import type { GameProgressItem } from "./types";

export const createProgressItems = (
  completedItems: Set<number>,
  incorrectItems: Set<number>,
  currentIndex: number,
  totalItems: number,
  itemTimes?: Record<number, number>,
): GameProgressItem[] =>
  Array.from({ length: totalItems }, (_, index) => ({
    id: index,
    isCompleted: completedItems.has(index),
    isCorrect: completedItems.has(index) && !incorrectItems.has(index),
    isCurrent: index === currentIndex,
    timeSpent: itemTimes?.[index],
  }));
