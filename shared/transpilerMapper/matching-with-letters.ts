// @ts-nocheck
import { getImageUrl, shuffle } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

const normalizeTrueFalse = (value: string | null): "T" | "F" | null => {
  if (!value) return null;
  const upper = String(value).trim().toUpperCase();
  if (upper === "T" || upper === "TRUE" || upper === "KWELI") return "T";
  if (upper === "F" || upper === "FALSE" || upper === "SI KWELI" || upper === "SIKWELI") {
    return "F";
  }
  return null;
};

export const matchingWithLettersTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;

  const isKweliSikweliPayload =
    serverQuestions.length > 0 &&
    serverQuestions.every((question) => {
      const tf = normalizeTrueFalse(question.textTwo);
      return Boolean(question.textOne?.trim()) && tf !== null;
    });

  if (isKweliSikweliPayload) {
    let sharedImage = "";
    for (const q of serverQuestions) {
      const raw = q.path || q.image;
      if (raw) {
        const url = getImageUrl(raw);
        if (url) {
          sharedImage = url;
          break;
        }
      }
    }

    const rawTitle = (titleDescription || "").trim();
    const title = rawTitle.includes("/")
      ? rawTitle.split("/")[0].trim()
      : rawTitle;

    return {
      mode: "kweliSikweli" as const,
      title: title || rawTitle,
      sharedImage: sharedImage || undefined,
      questions: serverQuestions.map((question, i) => ({
        id: String(i + 1),
        text: question.textOne!.trim(),
        correctAnswer: normalizeTrueFalse(question.textTwo)!,
      })),
    };
  }

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
      return `${alphabet[i]?.toUpperCase()}| ${answer}`;
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
              answer.split("|")[1]?.trim().toLowerCase() ===
              (question.textTwo?.split("/")[i]?.trim().toLowerCase() || ""),
          )
          ?.split("|")[0],
      };
    }),
    answers,
  };
};
