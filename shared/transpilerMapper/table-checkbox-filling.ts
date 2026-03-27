// @ts-nocheck
import type { ActivityTranspilerProps } from ".";
import { getImageUrl } from "@/lib/utils";

const tableCheckboxFillingTranspiler = (params: ActivityTranspilerProps) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  serverQuestions.forEach((question, i) => {
    if (!question.textOne) isWrongFormat = true;

    if (
      i > 0 &&
      !question.textOne?.split("/").some((ques) => ques.includes("_"))
    )
      isWrongFormat = true;
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription.split("||")[0],
    tableTitles: serverQuestions[0].textOne?.split("/") || [],
    fontSize: titleDescription.split("||")[1],
    questions: serverQuestions.slice(1).map((question) => ({
      title: {
        text: question.textOne?.split("/")[0] || "",
        image: question.path ? getImageUrl(question.path) : null,
      },
      question: question.textOne
        ? question.textOne
            .split("/")
            .slice(1)
            .map((item) => item.replace(/^\n+/, ""))
        : [],
      answer: question.textOne
        ? question.textOne
            .split("/")
            .find((part) => part.includes("_"))
            ?.slice(1) || ""
        : "",
    })),
  };
};

export default tableCheckboxFillingTranspiler;
