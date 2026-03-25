import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from ".";

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

export const matchingWithLettersTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;

  let isWrongFormat = false;

  serverQuestions.forEach((question) => {
    if (!question.textTwo || !(question.textOne || question.path)) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  const answers = shuffle(titleDescription?.split("/").slice(1)).map(
    (answer, i) => {
      return `${alphabet[i].toUpperCase()}| ${answer}`;
    },
  );

  return {
    title: titleDescription.split("/")[0],
    questions: serverQuestions.map((question, i) => {
      return {
        id: String(i + 1),
        text: question.textOne,
        image: getImageUrl(question.path || undefined),
        correctAnswer: answers
          .find(
            (answer) =>
              answer.split("|")[1].trim().toLowerCase() ===
              (question.textTwo?.split("/")[i].trim().toLowerCase() || ""),
          )
          ?.split("|")[0],
      };
    }),
    answers,
  };
};
