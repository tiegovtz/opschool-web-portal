import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from "..";

const multipleChoiceGameTranspiler = (params: ActivityTranspilerProps) => {
  const { serverQuestions, setWrongQuestionsFormat, titleDescription } = params;
  let isWrongFormat = false;

  serverQuestions.forEach((question) => {
    if (
      !question.textOne ||
      !question.textTwo ||
      !(question.textTwo.split("//")[0].split("/").length > 2)
    )
      isWrongFormat = true;
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription,
    questions: serverQuestions.map((question, index) => ({
      id: index + 1,
      question: question.textOne?.toString().trim(),
      questionImage: question.path ? getImageUrl(question.path) : undefined,
      options: question.textTwo
        ? shuffle(question.textTwo.split("//")[0].split("/"))
        : [],
      correctAnswer: question.textTwo
        ? question.textTwo.split("//")[0].split("/")[0]
        : "",
      ...(question.textTwo && question.textTwo?.split("//").length > 1
        ? {
            time: parseInt(question.textTwo?.split("//")[1]),
          }
        : {}),
    })),
  };
};

export default multipleChoiceGameTranspiler;
