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

  const rebaseUploadsUrl = (value: unknown) => {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) return "";
    const idx = text.toLowerCase().indexOf("/uploads/");
    if (idx >= 0) return text.slice(idx + 1); // "uploads/..."
    return text;
  };

  // Each row must have something on the left and something on the right.
  // Left can be image-only (path) with empty text; right can be text-only (textTwo).
  const hasNonEmptyText = (value: string | null | undefined) =>
    typeof value === "string" && value.trim().length > 0;

  const isWrongFormat = serverQuestions.some((question) => {
    const hasLeft = hasNonEmptyText(question.textOne) || Boolean(question.path) || Boolean((question as any).image);
    const hasRight =
      hasNonEmptyText(question.textTwo) ||
      Boolean(question.pathTwo) ||
      Boolean((question as any).imageTwo) ||
      // For external payloads we often map answer -> textTwo; ensure we don't fail if answer is present.
      hasNonEmptyText((question as any).answer);
    return !hasLeft || !hasRight;
  });

  if (isWrongFormat) {
    params.setWrongQuestionsFormat(true);
    // Don't fail closed — render best-effort so the activity doesn't go blank.
  }

  let idCounter = 1;
  items = serverQuestions.map((question) => {
    const leftPath = question.path ?? (question as any).image ?? null;
    if (leftPath)
      return {
        id: idCounter++,
        text: question.textOne ?? "",
        image: getImageUrl(rebaseUploadsUrl(leftPath)),
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
      const rightPath = question.pathTwo ?? (question as any).imageTwo ?? null;
      const rightText = question.textTwo ?? (question as any).answer ?? question.textOne ?? "";
      if (rightPath)
        return {
          id: idCounter++,
          text: rightText,
          image: getImageUrl(rebaseUploadsUrl(rightPath)),
          side: "right",
        };
      else
        return {
          id: idCounter++,
          text: rightText,
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
