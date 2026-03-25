import { shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from ".";

// Helper function to clean strings by removing extra spaces while preserving content
const cleanString = (str: string): string => {
  return str.trim();
};

const missingValuesTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription, setWrongQuestionsFormat } = params;

  // Check if any question is in wrong format
  const isWrongFormat = serverQuestions.some(
    (item) =>
      !item.textOne ||
      !item.textTwo ||
      !item.textOne
        .split(",")
        .map((item) => cleanString(item))
        .includes("___")
  );

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription,
    questions: shuffle(
      serverQuestions.map((item) => {
        const sequence = item.textOne
          ? item.textOne.split(",").map((item) => cleanString(item))
          : [];

        // Find all blank indices
        const blankIndices = sequence
          .map((item, index) => (item === "___" ? index : -1))
          .filter((index) => index !== -1);

        // Get corresponding correct answers from textTwo
        const correctAnswersTexts = item.textTwo
          ? item.textTwo.split(",").map(cleanString)
          : [];
        const correctAnswers = blankIndices.map(
          (blankIndex) => correctAnswersTexts[blankIndex] || ""
        );

        return {
          id: item.id.toString(),
          sequence: sequence.map((item) => (item === "___" ? null : item)),
          blankIndices,
          correctAnswers,
        };
      })
    ),
  };
};

export default missingValuesTranspiler;
