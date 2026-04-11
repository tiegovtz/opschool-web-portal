import { getImageUrl, shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

const QUESTION_OPTION_FIELDS = [
  "textThree",
  "textFour",
  "textFive",
  "textSix",
  "textSeven",
  "textEight",
  "textNine",
  "textTen",
] as const;

const splitValues = (value: string | null | undefined) =>
  (value ?? "")
    .split(/[/,;|\n]+/)
    .map((item) => item.replace(/^\n+/, "").trim())
    .filter(Boolean);

const extractTitleMetadata = (titleDescription: string) => {
  const [rawTitle = ""] = titleDescription.split("||");
  const segments = rawTitle
    .split("//")
    .map((item) => item.trim())
    .filter(Boolean);

  const title = segments[0] || "";
  const instructions: string[] = [];
  const options: string[] = [];

  segments.slice(1).forEach((segment) => {
    const values = splitValues(segment);
    const looksLikeOptionList =
      values.length > 1 &&
      values.every((value) => value.length <= 20 && !value.includes(" "));

    if (looksLikeOptionList) {
      options.push(...values);
      return;
    }

    instructions.push(segment);
  });

  return { title, instructions, options };
};

const missingLettersWordsTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, setWrongQuestionsFormat, titleDescription } = params;
  const titleMeta = extractTitleMetadata(titleDescription);
  let isWrongFormat = false;

  // Validate server questions format
  serverQuestions.forEach((question) => {
    if (
      !question.textOne ||
      !question.textTwo ||
      !question.textOne.includes("_")
    ) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleMeta.title,
    instructions: titleMeta.instructions,
    options: Array.from(
      new Set([
        ...titleMeta.options,
        ...serverQuestions.flatMap((question) =>
          QUESTION_OPTION_FIELDS.flatMap((field) => splitValues(question[field])),
        ),
      ]),
    ),
    questions: shuffle(
      serverQuestions.map((question) => ({
        textOne: question.textOne, // Word with "_" included
        textTwo: question.textTwo, // Complete correct word
        image: question.path ? getImageUrl(question.path) : null,
      })),
    ),
  };
};

export default missingLettersWordsTranspiler;
