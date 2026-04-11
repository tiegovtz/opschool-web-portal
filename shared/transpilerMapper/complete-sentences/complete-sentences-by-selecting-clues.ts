import { shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from "..";

const hasBlank = (value: string | null | undefined) => /_{1,}/.test(value ?? "");
const splitValues = (value: string | null | undefined) =>
  (value ?? "")
    .split(/[/,;|\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const extractTitleOptions = (titleDescription: string) =>
  titleDescription
    .split("||")[0]
    .split("//")
    .slice(1)
    .flatMap((segment) => {
      const values = splitValues(segment);
      return values.length > 1 ? values : [];
    });

const completeSentencesBySelectingCluesTranspiler = (
  params: ActivityTranspilerProps
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
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

  return {
    title: titleDescription.split("//")[0].split("||")[0],
    options: shuffle(
      Array.from(
        new Set([
          ...extractTitleOptions(titleDescription),
          ...serverQuestions.flatMap((q) => [
            q.textTwo,
            ...splitValues(q.textThree),
            ...splitValues(q.textFour),
          ]),
        ].filter(Boolean)),
      ),
    ),
    questions: serverQuestions.map((q) => ({
      id: q.id,
      question: q.textOne,
      correctAnswer: q.textTwo,
    })),
  };
};

export default completeSentencesBySelectingCluesTranspiler;
