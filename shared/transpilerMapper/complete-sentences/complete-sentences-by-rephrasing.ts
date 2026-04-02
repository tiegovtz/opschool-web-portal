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

  // Backend may send correct answers wrapped as `cua(4)` (compound-unit arithmetic format).
  // For this activity, students type plain digits, so unwrap per-token: `cua(4)` -> `4`.
  const normalizeAnswerToken = (value: string) => {
    const trimmed = (value ?? "").toString().trim();
    const match = trimmed.match(/^cua\s*\(\s*(.*?)\s*\)\s*$/i);
    return (match?.[1] ?? trimmed).toString().trim();
  };

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
            ? (() => {
                const rawAnswer = q.textTwo || "";
                if (isFractionorMixedFraction(rawAnswer).isFractionOrMixedFraction) {
                  return [rawAnswer];
                }
                return rawAnswer
                  ? rawAnswer
                      .split("/")
                      .map((ans) => normalizeAnswerToken(ans))
                      .map((ans) => ans.trim())
                      .filter((ans) => ans.length > 0)
                  : [];
              })()
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
