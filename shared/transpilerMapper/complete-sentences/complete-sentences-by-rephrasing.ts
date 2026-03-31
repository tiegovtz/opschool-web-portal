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

  // Backend may send correct numeric answers wrapped as `cua(4)` (compound-unit arithmetic format).
  // This activity UI for rephrasing uses plain text inputs, so students likely type `4`.
  // To avoid strict-matching failures, unwrap `cua(x)` -> `x` and accept both forms.
  const unwrapCuaAnswers = (raw: string): string[] | null => {
    const match = raw.match(/^cua\s*\(\s*(.*?)\s*\)\s*$/i);
    if (!match) return null;

    const inner = match[1]?.trim() ?? "";
    if (!inner) return null;

    const separator = inner.includes("|") ? "|" : ",";
    const parts = inner
      .split(separator)
      .map((p) => p.trim())
      .filter(Boolean);

    // Extract numeric prefix from each part (e.g. "4", or "4m" -> "4")
    const numbers = parts.map((part) => {
      const numMatch = part.match(/^(\d+)/);
      return (numMatch ? numMatch[1] : part).trim();
    }).filter(Boolean);

    // Keep original too, in case the frontend user enters `cua(4)` / `cua (4)` directly.
    // Also keep a normalized `cua(<inner>)` form so strict string matches are stable.
    const normalizedCua = `cua(${inner.replace(/\s+/g, "")})`;
    return Array.from(new Set([raw, normalizedCua, ...numbers]));
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

                const cuaUnwrapped = unwrapCuaAnswers(rawAnswer);
                if (cuaUnwrapped) return cuaUnwrapped;

                return rawAnswer?.split("/").map((ans) => ans.trim()) || [rawAnswer];
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
