// @ts-nocheck
import { getImageUrl, isFractionorMixedFraction, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";
import type { ActivityTranspilerProps } from "..";

export const completeSentencesByRephrasingPropsTranspiler = (
  params: ActivityTranspilerProps,
  examMode?: boolean,
) => {
  const {
    titleDescription: title,
    algorithm,
    serverQuestions,
    setWrongQuestionsFormat,
  } = params;
  let isWrongFormat = false;

  serverQuestions.some((question) => {
    if (!question.textOne?.includes("__") || !question.textTwo) {
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
    title: titleDescription?.split("//")[0],
    fontSize: title.split("||")[1],
    algorithm,
    questions: serverQuestions.map((q) => ({
      id: q.id.toString(),
      question: q.textOne,
      image: q.path ? getImageUrl(q.path) : null,
      answer:
        algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices
          ? q.textTwo || ""
          : algorithm === ActivityType.CompleteSentencesByRephrasing
            ? isFractionorMixedFraction(q.textTwo || "")
                .isFractionOrMixedFraction
              ? [q.textTwo]
              : q.textTwo?.split("/").map((ans) => ans.trim()) || [q.textTwo]
            : q.textTwo?.split(" ") || [],
    })),
    ...(algorithm === ActivityType.CompleteSentencesByRephrasingTwoFields ||
    algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices
      ? {
          options:
            algorithm === ActivityType.CompleteSentenceByRephrasingWithChoices
              ? examMode
                ? shuffle(
                     (serverQuestions as any[])[0].textThree
                      ?.split("/")
                      .map((q: any) => q.toLowerCase().trim()) || [],
                  )
                : (serverQuestions as any[])[0].textThree
                  ? shuffle((serverQuestions as any[])[0].textThree?.split("/") || [])
                  : []
              : shuffle((serverQuestions as any[]).map((q) => q.textTwo || [])),
        }
      : {}),
  };
};
