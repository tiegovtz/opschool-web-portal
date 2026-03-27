import { getImageUrl, shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

const missingLettersWordsTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, setWrongQuestionsFormat, titleDescription } = params;
  let isWrongFormat = false;

  // Validate server questions format
  serverQuestions.forEach((question) => {
    if (
      !question.textOne ||
      !question.textTwo ||
      !question.textOne.includes("_")
    ) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription,
    questions: shuffle(
      serverQuestions.map((question) => ({
        textOne: question.textOne, // Word with "_" included
        textTwo: question.textTwo, // Complete correct word
        image: question.path ? getImageUrl(question.path) : null,
      })),
    ),
  };
};

export default missingLettersWordsTranspiler;
