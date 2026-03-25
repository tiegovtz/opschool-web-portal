import { ActivityType } from "@/lib/types/activity-types";
import { ActivityTranspilerProps } from "..";

const completeSentencesWithThreeClausesTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const {
    titleDescription,
    serverQuestions,
    algorithm,
    setWrongQuestionsFormat,
  } = params;
  let isWrongFormat = false;

  serverQuestions.some((question) => {
    if (
      algorithm === ActivityType.CompleteSentencesWithThreeClauses &&
      (!question.textOne || !question.textTwo || !question.textThree)
    ) {
      isWrongFormat = true;
      return true;
    } else if (
      algorithm === ActivityType.CompleteSentencesWithFourClauses &&
      (!question.textOne || !question.textTwo || !question.textThree)
    ) {
      isWrongFormat = true;
      return true;
    }
    return false;
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    algorithm,
    title: titleDescription.split("||")[0],
    fontSize: titleDescription.split("||")[1],
    questions: serverQuestions.map((q) => ({
      id: q.id,
      question: q.textOne,
      correctAnswers:
        algorithm === "Complete sentences with three clauses"
          ? [q.textTwo, q.textThree]
          : [q.textTwo, q.textThree, q.textFour],
    })),
  };
};

export default completeSentencesWithThreeClausesTranspiler;
