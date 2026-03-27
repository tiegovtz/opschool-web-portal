import { getCommonSeparator } from "@/lib/utils";
import type { ActivityTranspilerProps } from "..";

export const examStrikeOutOddOneTranspiler = (
  params: ActivityTranspilerProps,
  examMode?: boolean
) => {
  const { serverQuestions, titleDescription, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  serverQuestions.forEach((q) => {
    if (
      !q.textOne ||
      q.textOne.split(getCommonSeparator(q.textOne) as string).length < 2
    ) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  const processedQuestions = serverQuestions
    .map((serverQuestion, index) => {
      // Split words by "/" - first word is the correct answer (odd one out)
      const wordsArray = serverQuestion?.textOne
        ? serverQuestion.textOne
            .split(getCommonSeparator(serverQuestion.textOne) as string)
            .filter((word) => word.trim())
        : [];

      // Create word objects - don't shuffle for exam consistency
      const words = wordsArray.map((word, wordIndex) => ({
        id: `${serverQuestion.id}_word_${wordIndex + 1}`,
        text: word.trim(),
        isCorrect: wordIndex === 0, // First word is the correct one to strike out
      }));

      return {
        id: serverQuestion.id.toString(),
        words,
      };
    })
    .filter((question) => question !== null);

  return {
    title: titleDescription || "Strike Out the Odd One",
    questions: processedQuestions,
  };
};
