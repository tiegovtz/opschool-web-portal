import { shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from "..";

interface AscendingOrderGameQuestion {
  id: string;
  min: number;
  max: number;
  numbers: number[];
  correctOrder: number[];
}

interface AscendingOrderGameResult {
  title: string;
  questions: AscendingOrderGameQuestion[];
  isGameMode: boolean;
  gameTimeLimit: number;
}

const generateRandomNumbers = (
  min: number,
  max: number,
  count: number = 5,
): number[] => {
  const numbers: number[] = [];
  const range = max - min + 1;

  // If range is small, use all available numbers
  if (range <= count) {
    for (let i = min; i <= max; i++) {
      numbers.push(i);
    }
    return numbers;
  }

  // Generate unique random numbers
  while (numbers.length < count) {
    const randomNum = Math.floor(Math.random() * range) + min;
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }

  return numbers;
};

const ascendingOrderGameTranspiler = (
  params: ActivityTranspilerProps,
): AscendingOrderGameResult => {
  const { titleDescription, serverQuestions } = params;

  // Extract title from titleDescription
  const title =
    titleDescription?.split("||")[0]?.split("//")[0] || "Ascending Order Game";

  // Generate 10 questions from the single server question
  const questions: AscendingOrderGameQuestion[] = [];

  if (serverQuestions && serverQuestions.length > 0) {
    const serverQuestion = serverQuestions[0];
    const min = parseInt(serverQuestion?.textOne || "1") || 1;
    const max = parseInt(serverQuestion?.textTwo || "20") || 20;

    // Generate 10 questions with random numbers from the range
    for (let i = 0; i < 10; i++) {
      const randomNumbers = generateRandomNumbers(min, max, 5);
      const correctOrder = [...randomNumbers].sort((a, b) => a - b);

      questions.push({
        id: `question-${i + 1}`,
        min,
        max,
        numbers: shuffle(randomNumbers), // Shuffle for display
        correctOrder,
      });
    }
  }

  return {
    title,
    questions,
    isGameMode: true,
    gameTimeLimit: 300, // 5 minutes default
  };
};

export default ascendingOrderGameTranspiler;
