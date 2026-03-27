// @ts-nocheck
import type { ActivityTranspilerProps } from ".";
import { getImageUrl, shuffle } from "@/lib/utils";

const pictureOrStoryFollowedByQuestionsTrueFalseActivityTranspiler = (
  params: ActivityTranspilerProps
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;

  let isWrongFormat = false;

  //   Check Of there is textOne and textTwo in all questions
  serverQuestions.forEach((question) => {
    if (!question.textOne || !question.textTwo) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  const activityNotes = titleDescription.split("//");

  return {
    title: activityNotes[0],
    notes: `${activityNotes[activityNotes.length - 1]}`,
    image: getImageUrl(serverQuestions[0].path || ""),
    questions: shuffle(
      serverQuestions.map((question) => {
        return {
          question: question.textOne,
          answer: question.textTwo,
        };
      })
    ),
  };
};

export default pictureOrStoryFollowedByQuestionsTrueFalseActivityTranspiler;
