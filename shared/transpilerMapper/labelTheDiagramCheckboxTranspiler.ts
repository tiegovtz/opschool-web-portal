// @ts-nocheck
import { getImageUrl } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

export const labelTheDiagramCheckboxTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;

  let isWrongFormat = false;

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
    notes: `<b style="font-size: 1.4rem">${activityNotes[1]}</b> \n ${
      activityNotes[activityNotes.length - 2] || ""
    }
    ${activityNotes[activityNotes.length - 1] || ""}`,
    image: getImageUrl(
      serverQuestions[0]?.path || serverQuestions[0]?.pathTwo || "",
    ),
    variant: "checkbox" as const,
    questions: serverQuestions.map((question) => ({
      question: question?.textOne,
      title: question?.textThree || "",
      answers: [question?.textTwo?.trim() || ""], // "T" or "F"
    })),
  };
};
