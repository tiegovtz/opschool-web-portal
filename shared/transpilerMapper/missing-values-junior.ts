// @ts-nocheck
import { shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

const missingValuesJuniorTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription, setWrongQuestionsFormat } = params;

  // Check if any question is in wrong format
  const isWrongFormat = serverQuestions.some(
    (item) =>
      !item.textOne ||
      !item.textTwo ||
      !item.textOne
        .split(",")
        .map((item) => item.trim())
        .includes("_")
  );

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription,
    numberRange: serverQuestions[0]?.textThree,
    sequences: shuffle(
      serverQuestions.map((item) => {
        const sequence = item.textOne
          ? item.textOne.split(",").map((num) => num.trim())
          : [];
        // Find all blank indices
        const blankIndices = sequence
          .map((num, index) => (num === "_" ? index : -1))
          .filter((index) => index !== -1);

        // Get corresponding correct answers from textTwo
        const correctAnswersTexts = item.textTwo
          ? item.textTwo.split(",").map((num) => num.trim())
          : [];
        const correctAnswers = blankIndices.map(
          (blankIndex) => correctAnswersTexts[blankIndex]
        );

        return {
          sequence: sequence.map((num) =>
            num === "_" ? "_" : parseInt(num, 10)
          ),
          answers: correctAnswers,
        };
      })
    ),
  };
};

export default missingValuesJuniorTranspiler;
