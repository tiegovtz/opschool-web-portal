import { shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

export const rearrangeStepsVerticallyTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { titleDescription, setWrongQuestionsFormat, serverQuestions } = params;
  let isWrongFormat = false;

  if (serverQuestions.every((question) => !question.textOne))
    isWrongFormat = true;

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  return {
    title: titleDescription.split("/")[0],
    questions: shuffle(
      serverQuestions.map((question, i) => ({
        id: question.id.toString(),
        text: question.textOne,
        order: i + 1,
      })),
    ),
  };
};
