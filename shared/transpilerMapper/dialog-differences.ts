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
    // If we already have an absolute URL, keep it as-is. Rebasing can break working URLs.
    if (/^https?:\/\//i.test(text) || text.startsWith("//")) return text;
    const idx = text.toLowerCase().indexOf("/uploads/");
    if (idx >= 0) return text.slice(idx + 1); // "uploads/..."
    return text;
  };

  // Each row must have something on the left and something on the right.
  // Left can be image-only (path) with empty text; right can be text-only (textTwo).
  // External payloads often put prose in `text` (textOne), the picture in `images[0]` (path), and leave
  // `answer` empty — that is still a complete row (explanation + illustration), not a format error.
  const hasNonEmptyText = (value: string | null | undefined) =>
    typeof value === "string" && value.trim().length > 0;

  const isValidDialogQuestion = (question: ServerQuestionType) => {
    const t1 = hasNonEmptyText(question.textOne);
    const t2 =
      hasNonEmptyText(question.textTwo) ||
      hasNonEmptyText((question as any).answer);
    const p1 = Boolean(question.path) || Boolean((question as any).image);
    const p2 = Boolean(question.pathTwo) || Boolean((question as any).imageTwo);

    const hasLeftLike = t1 || p1;
    const hasRightLike = t2 || p2;
    if (hasLeftLike && hasRightLike) return true;

    // One text + one image only (no separate answer line from CMS)
    if (t1 && p1 && !t2 && !p2) return true;

    return false;
  };

  const isWrongFormat = serverQuestions.some((question) => !isValidDialogQuestion(question));

  if (isWrongFormat) {
    params.setWrongQuestionsFormat(true);
    // Don't fail closed — render best-effort so the activity doesn't go blank.
  }

  const isOneSideFixed = algorithm === ActivityType.DialogOneSideFixed;
  const primaryImagePath = (question: ServerQuestionType) =>
    question.path ?? (question as any).image ?? null;
  // External API: `text` → textOne (step title), `answer` → textTwo, first `images[]` → path.
  // For Dialog one side fixed with images, the UI uses "image draggable" mode.
  // - When textOne is non-empty: map answer + image onto data-left and step titles onto data-right
  //   so the fixed column shows titles and the pool shows image + answer together.
  // - When textOne is empty (picture-to-label matching): map image-only onto data-left (text "")
  //   and answers onto data-right so the fixed column shows pictures only and draggable cards show answers.
  const osfSwapForImageLayout =
    isOneSideFixed && serverQuestions.some((q) => Boolean(primaryImagePath(q)));

  let idCounter = 1;
  items = serverQuestions.map((question) => {
    const leftPath = primaryImagePath(question);
    const answerText = question.textTwo ?? (question as any).answer ?? "";
    const hasStepTitle = hasNonEmptyText(question.textOne);

    if (osfSwapForImageLayout) {
      if (leftPath) {
        return {
          id: idCounter++,
          text: hasStepTitle ? answerText : "",
          image: getImageUrl(rebaseUploadsUrl(leftPath)),
          side: "left",
        };
      }
      return {
        id: idCounter++,
        text: answerText,
        side: "left",
      };
    }

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
      const answerText = question.textTwo ?? (question as any).answer ?? "";

      if (osfSwapForImageLayout) {
        if (rightPath)
          return {
            id: idCounter++,
            text: question.textOne ?? "",
            image: getImageUrl(rebaseUploadsUrl(rightPath)),
            side: "right",
          };
        return {
          id: idCounter++,
          text: hasNonEmptyText(question.textOne) ? (question.textOne ?? "") : answerText,
          side: "right",
        };
      }

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
