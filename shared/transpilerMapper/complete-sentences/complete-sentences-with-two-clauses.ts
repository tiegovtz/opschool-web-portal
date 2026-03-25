import { ActivityTranspilerProps } from "..";

const completeSentencesWithTwoClausesTranspiler = (
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
    questions: serverQuestions.map((q) => {
      return {
        word: q.textOne,
        answer: q.textTwo?.includes("/")
          ? q.textTwo.split("/").map((part) => part.trim().toLowerCase())
          : q.textTwo?.trim().toLowerCase(),
      };
    }),
  };
};

export default completeSentencesWithTwoClausesTranspiler;
