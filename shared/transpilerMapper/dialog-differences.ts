// @ts-nocheck
import { getImageUrl } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";
import type { ServerQuestionType } from "@/lib/types/activity-props";

const dialogDifferencesPropsTranspiler = (params: {
  titleDescription: string;
  algorithm: ActivityType;
  serverQuestions: ServerQuestionType[];
  setWrongQuestionsFormat: (value: boolean) => void;
}) => {
  let items;
  const { titleDescription, algorithm, serverQuestions } = params;

  // Each row must have something on the left and something on the right.
  // Left can be image-only (path) with empty text; right can be text-only (textTwo).
  const hasNonEmptyText = (value: string | null | undefined) =>
    typeof value === "string" && value.trim().length > 0;

  const isWrongFormat = serverQuestions.some((question) => {
    const hasLeft = hasNonEmptyText(question.textOne) || Boolean(question.path);
    const hasRight = hasNonEmptyText(question.textTwo) || Boolean(question.pathTwo);
    return !hasLeft || !hasRight;
  });

  if (isWrongFormat) {
    params.setWrongQuestionsFormat(true);
    return null;
  }

  let idCounter = 1;
  items = serverQuestions.map((question) => {
    if (question.path)
      return {
        id: idCounter++,
        text: question.textOne ?? "",
        image: getImageUrl(question.path || ""),
        side: "left",
      };
    else
      return {
        id: idCounter++,
        text: question.textOne ?? "",
        side: "left",
      };
  });

  items = items.concat(
    serverQuestions.map((question) => {
      if (question.pathTwo)
        return {
          id: idCounter++,
          text: question.textTwo ?? "",
          image: getImageUrl(question.pathTwo || ""),
          side: "right",
        };
      else
        return {
          id: idCounter++,
          text: question.textTwo ?? "",
          side: "right",
        };
    }),
  );

  return {
    title: titleDescription.split("/")[0],
    leftLabel: titleDescription.split("/")[1],
    rightLabel: titleDescription.split("/")[2],
    lockSide: algorithm === ActivityType.DialogOneSideFixed ? "left" : null,
    fontSize: titleDescription.includes("||")
      ? parseInt(titleDescription.split("||")[1] ?? "20", 10) || 20
      : 20,

    items,
  };
};

export default dialogDifferencesPropsTranspiler;
