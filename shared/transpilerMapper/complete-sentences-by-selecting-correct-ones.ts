// @ts-nocheck
import React from "react";
import type { ActivityTranspilerProps } from ".";
import { shuffle } from "@/lib/utils";

const completeSentencesBySelectingCorrectOnesTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
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

  return {
    title: titleDescription.split("||")[0],
    fontSize: titleDescription.split("||")[1],
    questions: serverQuestions.map((q) => {
      const shuffled = shuffle([q.textOne, q.textTwo]);
      return {
        question: shuffled,
        answer: shuffled.indexOf(q.textOne),
      };
    }),
  };
};

export default completeSentencesBySelectingCorrectOnesTranspiler;
