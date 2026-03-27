import { getImageUrl } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

const rearrangeTheStepsTranspiler = (params: ActivityTranspilerProps) => {
  const {
    titleDescription: title,
    serverQuestions,
    setWrongQuestionsFormat,
  } = params;

  let isWrongFormat = false;

  // Check if all questions have a path and text
  serverQuestions.forEach((question) => {
    if (!question.textOne) isWrongFormat = true;
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  const titleDescription = title.split("||")[0];

  return {
    title: titleDescription?.split("/")[0],
    type: titleDescription?.split("/")[1],
    hideWords: title?.split("||")[1] === "0",
    questions: serverQuestions.map((question) => ({
      image: getImageUrl(question.path || ""),
      question: question.textOne,
    })),
  };
};

export default rearrangeTheStepsTranspiler;
