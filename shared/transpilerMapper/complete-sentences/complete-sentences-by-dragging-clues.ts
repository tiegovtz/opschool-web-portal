// @ts-nocheck
import { getImageUrl, shuffle } from "@/lib/utils";
import {type ActivityTranspilerProps } from "..";

const completesentencesbydraggingcluesTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const {
    titleDescription: title,
    serverQuestions,
    setWrongQuestionsFormat,
  } = params;
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

  const titleDescription = title.split("||")[0];

  return {
    title: titleDescription?.split("/")[0],
    fontSize: title.split("||")[1] || 30,
    algorithm: params.algorithm,
    questions: shuffle(
      serverQuestions.map((q) => {
        return {
          id: q.id,
          question: q.textOne,
          image: q.path ? getImageUrl(q.path) : undefined,
          answer: q.textTwo,
        };
      }),
    ),
    options: shuffle(
      serverQuestions.map((q) => {
        return {
          value: q.textTwo,
          image: q.path ? getImageUrl(q.path) : undefined,
        };
      }),
    ),
  };
};

export default completesentencesbydraggingcluesTranspiler;
