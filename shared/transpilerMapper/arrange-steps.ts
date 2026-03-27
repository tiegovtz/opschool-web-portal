// import { ActivityTranspilerProps } from ".";
import { type ActivityTranspilerProps } from ".";

const arrangeStepsTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, titleDescription } = params;
  let isWrongFormat = false;

  // Check if server data is in the expected format
  serverQuestions.forEach((question) => {
    if (!question.textOne) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    params.setWrongQuestionsFormat(true);
    return null;
  }

  return {
    title: titleDescription.split("/")[0],
    notes: params.summary || "",
    steps: serverQuestions.map((question, index) => ({
      id: index.toString(),
      text: question.textOne,
    })),
  };
};

export default arrangeStepsTranspiler;
