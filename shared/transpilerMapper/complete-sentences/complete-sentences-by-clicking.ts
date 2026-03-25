import { shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from "..";

const completeSentencesByClickingTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  if (
    serverQuestions.some(
      (question) => !question.textOne?.includes("___") || !question.textTwo,
    )
  ) {
    isWrongFormat = true;
  }

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription.split("||")[0],
    fontSize: titleDescription.split("||")[1],
    questions: serverQuestions.map((q) => {
      return {
        id: q.id,
        question: q.textOne,
        options: shuffle(
          q.textTwo?.includes("/") ? q.textTwo?.split("/") : [q.textTwo],
        ),
        correctAnswer: q.textTwo?.includes("/")
          ? q.textTwo?.split("/")[0]
          : q.textTwo,
      };
    }),
  };
};

export default completeSentencesByClickingTranspiler;
