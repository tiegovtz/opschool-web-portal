// @ts-nocheck
import { getImageUrl, isFractionorMixedFraction, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";
import type { ActivityTranspilerProps } from "..";

const hasBlank = (value: string | null | undefined) => /_{1,}/.test(value ?? "");
const splitValues = (value: string | null | undefined) =>
  (value ?? "")
    .split(/[/,;|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const OPTION_FIELD_KEYS = [
  "textThree",
  "textFour",
  "textFive",
  "textSix",
  "textSeven",
  "textEight",
  "textNine",
  "textTen",
] as const;

const extractTitleOptions = (title: string) => {
  const [rawTitle = ""] = title.split("||");
  const segments = rawTitle
    .split("//")
    .map((item) => item.trim())
    .filter(Boolean);

  return segments.slice(1).flatMap((segment) => {
    const values = splitValues(segment);
    return values.length > 1 ? values : [];
  });
};

const extractServerOptions = (serverQuestions: ActivityTranspilerProps["serverQuestions"]) =>
  Array.from(
    new Set(
      serverQuestions.flatMap((question) =>
        OPTION_FIELD_KEYS.flatMap((key) => splitValues(question[key])),
      ),
    ),
  );

const extractAnswerFallbackOptions = (
  serverQuestions: ActivityTranspilerProps["serverQuestions"],
) =>
  Array.from(
    new Set(
      serverQuestions
        .map((question) => (question.textTwo ?? "").trim())
        .filter((value) => value.length > 0),
    ),
  );

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
    if (!hasBlank(question.textOne) || !question.textTwo) {
      isWrongFormat = true;
      return true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  const titleDescription = title.split("||")[0];
  const titleOptions = extractTitleOptions(title);

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
              ? (() => {
                  const serverOptions = extractServerOptions(serverQuestions);
                  const fallbackOptions = extractAnswerFallbackOptions(serverQuestions);
                  const options =
                    serverOptions.length > 0
                      ? serverOptions
                      : titleOptions.length > 0
                        ? titleOptions
                        : fallbackOptions;
                  return examMode
                    ? shuffle(options.map((option: string) => option.toLowerCase().trim()))
                    : shuffle(options);
                })()
              : shuffle((serverQuestions as any[]).map((q) => q.textTwo || [])),
        }
      : {}),
  };
};
