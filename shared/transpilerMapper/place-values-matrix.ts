import type { ActivityTranspilerProps } from ".";

export const QUESTIONS_COUNT = 10;

// Generate random numbers with the same base as the first question
export const generateRandomNumbers = (
  baseNumber: string,
  count: number
): string[] => {
  if (!baseNumber || count <= 0) return [];

  // Parse the first number to determine its base length
  const baseLength = baseNumber.length;
  const result: string[] = [baseNumber];

  // Generate count-1 additional random numbers with the same base length
  for (let i = 1; i < count; i++) {
    let randomNum = "";
    for (let j = 0; j < baseLength; j++) {
      if (j === 0) {
        // First digit should be 1-9 to avoid leading zeros
        randomNum += Math.floor(Math.random() * 9 + 1).toString();
      } else {
        randomNum += Math.floor(Math.random() * 10).toString();
      }
    }
    result.push(randomNum);
  }

  return result;
};

const placeValuesMatrixTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription, setWrongQuestionsFormat } = params;

  if (!serverQuestions || !serverQuestions[0]?.textOne) {
    setWrongQuestionsFormat(true);
    return;
  }

  const firstNumber = serverQuestions[0]?.textOne || "";
  const randomNumbers = generateRandomNumbers(firstNumber, QUESTIONS_COUNT);

  return {
    title: titleDescription,
    questions: Array.from({ length: QUESTIONS_COUNT }).map((_, index) => {
      return {
        id: index,
        number: randomNumbers[index] || "",
      };
    }),
  };
};

export default placeValuesMatrixTranspiler;
