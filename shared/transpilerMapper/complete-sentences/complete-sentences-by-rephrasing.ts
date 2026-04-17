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
      serverQuestions.flatMap((question) => {
        const fromFields = OPTION_FIELD_KEYS.flatMap((key) => splitValues(question[key]));
        const rawOption = (question as { option?: unknown }).option;
        const fromOption = typeof rawOption === "string" ? splitValues(rawOption) : [];
        return [...fromFields, ...fromOption];
      }),
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

  // Backend may send `cua(4)` (plain number) or `cua(11km,6dam,2m)` (metric compound).
  // Unwrap only when the payload is digits-only so the UI can use CompoundUnitArithmeticInput for real cua().
  const normalizeAnswerToken = (value: string) => {
    const trimmed = (value ?? "").toString().trim();
    const match = trimmed.match(/^cua\s*\(\s*(.*?)\s*\)\s*$/i);
    if (!match) return trimmed;
    const inner = (match[1] ?? "").toString().trim();
    if (/^\d+$/.test(inner)) return inner;
    // Comparison blanks: backend uses cua(>) / cua(<); learners type > or <.
    if (/^[<>]$/.test(inner)) return inner;
    return trimmed;
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
          ? (() => {
              const rawAnswer = q.textTwo || "";
              if (!rawAnswer) return [];
              return rawAnswer
                .split("/")
                .map((ans) => normalizeAnswerToken(ans))
                .map((ans) => ans.trim())
                .filter((ans) => ans.length > 0);
            })()
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
                  // Do not fall back to correct answers (textTwo); that leaks solutions in the word bank.
                  const options =
                    serverOptions.length > 0
                      ? serverOptions
                      : titleOptions.length > 0
                        ? titleOptions
                        : [];
                  return examMode
                    ? shuffle(options.map((option: string) => option.toLowerCase().trim()))
                    : shuffle(options);
                })()
              : shuffle((serverQuestions as any[]).map((q) => q.textTwo || [])),
        }
      : {}),
  };
};
