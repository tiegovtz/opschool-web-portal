import { shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from "..";

const completeSentencesBySelectingCluesTranspiler = (
  params: ActivityTranspilerProps
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  serverQuestions.some((question) => {
    if (!question.textOne?.includes("___") || !question.textTwo) {
      isWrongFormat = true;
      return true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription.split("/")[0],
    options: shuffle(serverQuestions.map((q) => q.textTwo)),
    questions: serverQuestions.map((q) => ({
      id: q.id,
      question: q.textOne,
      correctAnswer: q.textTwo,
    })),
  };
};

export default completeSentencesBySelectingCluesTranspiler;
