import { getImageUrl } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

const pictureOrStoryFollowedByQuestionsActivityTranspiler = (
  params: ActivityTranspilerProps
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;

  let isWrongFormat = false;

  // Check if there is textOne and textTwo in all questions
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
    options: serverQuestions.flatMap((options) => options.textTwo?.split(",")),
    image: serverQuestions[0]?.path
      ? getImageUrl(serverQuestions[0]?.path || "")
      : "",
    questions: serverQuestions.map((question) => ({
      question: question.textOne,
      answer: question.textTwo?.split(",")[0]?.trim() || "",
    })),
  };
};

export default pictureOrStoryFollowedByQuestionsActivityTranspiler;
