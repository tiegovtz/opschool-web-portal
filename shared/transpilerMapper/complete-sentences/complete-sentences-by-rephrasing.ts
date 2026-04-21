// @ts-nocheck
import { getImageUrl, isFractionorMixedFraction, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";
import type { ActivityTranspilerProps } from "..";

const hasBlank = (value: string | null | undefined) => /_{1,}/.test(value ?? "");

/**
 * Some CMS saves omit `___` after a LaTeX `{array}` block; the transpiler requires at least one `_` in textOne.
 */
const ensureStemHasBlank = (question: ActivityTranspilerProps["serverQuestions"][number]) => {
  const t = question.textOne ?? "";
  if (hasBlank(t) || !t.trim()) return question;
  if (!/\\end\{array\}/.test(t)) return question;
  return { ...question, textOne: `${t.trimEnd()} ___` };
};

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

  const serverQuestionsNormalized = serverQuestions.map(ensureStemHasBlank);

  serverQuestionsNormalized.some((question) => {
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

  // Backend may send `cua(4)` (plain number), `cua(0.006)` (decimal), or `cua(11km,6dam,2m)` (metric compound).
  // Unwrap plain numeric/decimals so the UI uses a text field and matches what learners type.
  const normalizeAnswerToken = (value: string) => {
    const trimmed = (value ?? "").toString().trim();
    const match = trimmed.match(/^cua\s*\(\s*(.*?)\s*\)\s*$/i);
    if (!match) return trimmed;
    const innerRaw = (match[1] ?? "").toString().trim();
    // Metric compound typo: comma written as dot between parts (e.g. cua(48L.96mL) → cua(48L,96mL)).
    const dotCompound = innerRaw.match(/^(\d+[a-zA-Z]+)\.(\d+[a-zA-Z]+)$/i);
    const inner = dotCompound ? `${dotCompound[1]},${dotCompound[2]}` : innerRaw;
    if (/^\d+$/.test(inner)) return inner;
    if (/^\d+\.\d+$/.test(inner)) return inner;
    // Comparison blanks: backend uses cua(>) / cua(<); learners type > or <.
    if (/^[<>]$/.test(inner)) return inner;
    return inner !== innerRaw ? `cua(${inner})` : trimmed;
  };

  return {
    title: titleDescription?.split("//")[0],
    fontSize: title.split("||")[1],
    algorithm,
    questions: serverQuestionsNormalized.map((q) => ({
      id: q.id.toString(),
      question: q.textOne,
      image: q.path || q.image ? getImageUrl(q.path || q.image || "") : null,
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
                  const serverOptions = extractServerOptions(serverQuestionsNormalized);
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
              : shuffle((serverQuestionsNormalized as any[]).map((q) => q.textTwo || [])),
        }
      : {}),
  };
};
