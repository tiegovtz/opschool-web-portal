import { getImageUrl } from "@/lib/utils";
import type { ActivityTranspilerProps } from "..";
import { ActivityType } from "@/lib/types/activity-types";

const comparingQuantitiesDraggingTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const {
    serverQuestions,
    setWrongQuestionsFormat,
    titleDescription,
    algorithm,
  } = params;
  let isWrongFormat = false;

  serverQuestions.forEach((question) => {
    if (
      !question.textOne ||
      !question.textTwo ||
      !question.textThree ||
      !question.path ||
      (algorithm === ActivityType.ComparingQuantitiesDragging &&
        !question.textFour)
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
    questions: serverQuestions.map((question) => ({
      leftNumber: parseInt(question.textOne as string),
      leftAnswer: question.textThree,
      answer:
        algorithm === ActivityType.ComparingQuantitiesDragging
          ? null
          : question.textThree,
      leftImage: getImageUrl(question.path as string),
      rightNumber: parseInt(question.textTwo as string),
      rightAnswer: question.textFour,
      rightImage: getImageUrl(question.path as string),
    })),
  };
};

export default comparingQuantitiesDraggingTranspiler;
