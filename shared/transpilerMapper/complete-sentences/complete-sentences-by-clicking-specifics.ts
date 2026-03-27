// @ts-nocheck
import { shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from "..";

const completeSentencesByClickingSpecificsTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const {
    titleDescription: title,
    serverQuestions,
    setWrongQuestionsFormat,
  } = params;
  let isWrongFormat = false;

  serverQuestions.some((question) => {
    if (!question.textOne || !question.textTwo) {
      isWrongFormat = true;
      return true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  const titleDescription = title.split("||")[0];

  return {
    title: titleDescription.split("//")[0],
    fontSize: title.split("||")[1],
    questions: shuffle(
      serverQuestions.map((q) => {
        return {
          id: q.id,
          question: q.textOne,
          answers: q.textTwo?.includes("/")
            ? q.textTwo?.split("/")
            : [q.textTwo],
        };
      }),
    ),
  };
};

export default completeSentencesByClickingSpecificsTranspiler;
