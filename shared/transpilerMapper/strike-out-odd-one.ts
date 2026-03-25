import { getCommonSeparator, shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from "./index";

const strikeOutOddOneTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  serverQuestions.forEach((q) => {
    if (
      !q.textOne ||
      q.textOne.split(getCommonSeparator(q.textOne)).length < 2
    ) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  const processedQuestions = shuffle(
    serverQuestions
      .map((serverQuestion, index) => {
        // Split words by "/" - first word is the correct answer (odd one out)
        const wordsArray = serverQuestion?.textOne
          ? serverQuestion.textOne
              .split(getCommonSeparator(serverQuestion.textOne))
              .filter((word) => word.trim())
          : [];

        // First word is the correct answer (the odd one out)
        // const correctWord = wordsArray[0].trim();
        // const allWords = wordsArray.map((word) => word.trim());

        // Create word objects
        const words = shuffle(
          wordsArray.map((word, wordIndex) => ({
            id: wordIndex + 1,
            text: word,
            isCorrect: wordIndex === 0, // First word is the correct one to strike out
          })),
        );

        return {
          id: serverQuestion.id || index + 1,
          words,
          userAnswered: false,
          // isCorrect: false,
        };
      })
      .filter((question) => question !== null),
  );

  return {
    title: titleDescription.split("//")[0] || "Strike Out the Odd One",
    fontSize: titleDescription.split("//")[1]?.substring(0, 2),
    questions: processedQuestions,
  };
};

export default strikeOutOddOneTranspiler;
