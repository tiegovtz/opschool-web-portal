import type { ActivityTranspilerProps } from ".";
import { getImageUrl } from "@/lib/utils";

const QUESTION_TEXT_FIELDS = [
  "textOne",
  "textTwo",
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

const extractDescriptionValues = (
  description: Array<{ id: number; details: string }> | null | undefined,
) =>
  (description ?? [])
    .flatMap((item) => splitValues(item.details))
    .filter(Boolean);

const getQuestionFields = (question: Record<string, unknown>) =>
  QUESTION_TEXT_FIELDS
    .map((key) => question[key])
    .filter((value): value is string => typeof value === "string" && value.trim() !== "")
    .map((value) => value.trim());

const getQuestionParts = (question: Record<string, unknown>) => {
  const fields = getQuestionFields(question);
  const flattenedFields = fields.flatMap((value) =>
    value.includes("/") ? splitValues(value) : [value],
  );

  if (flattenedFields.length > 1) {
    return flattenedFields;
  }

  const descriptionValues = extractDescriptionValues(
    (question.description as Array<{ id: number; details: string }> | null | undefined) ?? null,
  );

  if (!flattenedFields.length) {
    return descriptionValues;
  }

  return [...flattenedFields, ...descriptionValues];
};

const extractTitleMetadata = (titleDescription: string) => {
  const [rawTitle = "", fontSize = ""] = titleDescription.split("||");
  const segments = rawTitle
    .split("//")
    .map((item) => item.trim())
    .filter(Boolean);

  const title = segments[0] || "";
  const extraSegments = segments.slice(1);
  const instructions: string[] = [];
  const options: string[] = [];

  extraSegments.forEach((segment) => {
    const values = splitValues(segment);
    const looksLikeOptionList =
      values.length > 1 && values.every((value) => value.length <= 20);

    if (looksLikeOptionList) {
      options.push(...values);
      return;
    }

    instructions.push(segment);
  });

  return { title, fontSize, instructions, options };
};

const extractHeaderTitles = (headerQuestion: Record<string, unknown>) => {
  return getQuestionParts(headerQuestion);
};

const extractOptions = (headerQuestion: Record<string, unknown>, headerTitles: string[]) => {
  const optionFields = QUESTION_TEXT_FIELDS.slice(1)
    .map((key) => headerQuestion[key])
    .filter((value): value is string => typeof value === "string" && value.trim() !== "");

  const options = optionFields.flatMap((value) => splitValues(value));
  return options.filter((option) => !headerTitles.includes(option));
};

const extractAnswerOptions = (questions: Array<{ question: string[] }>) =>
  questions.flatMap((question) =>
    question.question
      .filter((cell) => cell.includes("_"))
      .map((cell) => cell.replace(/^_+/, "").trim())
      .filter(Boolean),
  );

const extractRow = (question: Record<string, unknown>) => {
  const fields = getQuestionParts(question);
  return {
    title: {
      text: fields[0] || "",
      image: typeof question.path === "string" && question.path
        ? getImageUrl(question.path)
        : null,
    },
    question: fields.slice(1),
  };
};

const extractAnswer = (cells: string[]) => {
  const answerCell = cells.find((cell) => cell.includes("_"));
  return answerCell ? answerCell.replace(/^_+/, "").trim() : "";
};

const hasBlankCell = (cells: string[]) => cells.some((cell) => cell.includes("_"));

const shouldUseHeaderRow = (
  rows: Array<{
    title: { text: string; image: string | null };
    question: string[];
    answer: string;
  }>,
) => {
  if (rows.length < 2) {
    return false;
  }

  const [firstRow, ...otherRows] = rows;
  const firstRowHasNoBlanks = !hasBlankCell(firstRow.question);
  const otherRowsHaveBlanks = otherRows.some((row) => hasBlankCell(row.question));

  return firstRowHasNoBlanks && otherRowsHaveBlanks && firstRow.question.length > 0;
};

const tableCheckboxFillingTranspiler = (params: ActivityTranspilerProps) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
  const titleMeta = extractTitleMetadata(titleDescription);

  if (!serverQuestions.length) {
    setWrongQuestionsFormat(true);
    return;
  }

  const parsedRows = serverQuestions.map((question) => {
    const row = extractRow(question as Record<string, unknown>);
    return {
      ...row,
      answer: extractAnswer(row.question),
    };
  });

  const useHeaderRow = shouldUseHeaderRow(parsedRows);
  const headerQuestion = useHeaderRow ? (serverQuestions[0] as Record<string, unknown>) : null;
  const headerTitles = headerQuestion ? extractHeaderTitles(headerQuestion) : [];
  const questions = useHeaderRow ? parsedRows.slice(1) : parsedRows;
  const tableTitles =
    headerTitles.length > 0
      ? headerTitles
      : Array.from(
          {
            length:
              Math.max(
                0,
                ...questions.map((question) => question.question.length + 1),
              ),
          },
          () => "",
        );
  const options = headerQuestion ? extractOptions(headerQuestion, tableTitles) : [];

  const hasAnyInputCell = questions.some((question) =>
    question.question.some((cell) => cell.includes("_")),
  );

  if (!tableTitles.length || !questions.length || !hasAnyInputCell) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleMeta.title,
    tableTitles,
    options: Array.from(
      new Set([
        ...titleMeta.options,
        ...options,
        ...extractAnswerOptions(questions),
      ]),
    ),
    instructions: titleMeta.instructions,
    fontSize: titleMeta.fontSize,
    questions,
  };
};

export default tableCheckboxFillingTranspiler;
