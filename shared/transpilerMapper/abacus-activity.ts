// @ts-nocheck
import type { ActivityTranspilerProps } from ".";

const abacusActivityTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription } = params;
  let isWrongFormat = false;

  serverQuestions.forEach((question) => {
    if (!question.textOne || !question.textTwo) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    params.setWrongQuestionsFormat(true);
    return null;
  }

  // generate 10 random numbers between serverQuestions[0].textOne and serverQuestions[0].textTwo
  const randomNumbers = Array.from({ length: 10 }, () => {
    const min = Number(serverQuestions[0].textOne);
    const max = Number(serverQuestions[0].textTwo);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  });

  return {
    title: titleDescription,
    questions: randomNumbers.map((number, index) => ({
      id: index,
      number: number.toString(),
    })),
  };
};

export default abacusActivityTranspiler;
