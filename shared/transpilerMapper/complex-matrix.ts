import { type ActivityTranspilerProps } from ".";
import { getImageUrl, shuffle } from "@/lib/utils";

const completeMatrixTranspiler = (params: ActivityTranspilerProps) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  // Check if all questions have the required properties
  serverQuestions.slice(1).forEach((question) => {
    if (!question.textTwo || !question.textThree) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  return {
    title: titleDescription,
    titles: [
      serverQuestions[0]?.textOne,
      serverQuestions[0]?.textTwo,
      serverQuestions[0]?.textThree,
    ],
    options: shuffle(
      serverQuestions
        .slice(1)
        .flatMap((question) => question.textThree?.split("/"))
    ),
    questions: serverQuestions.slice(1).map((question, i) => {
      return {
        id: question.textOne
          ? `${question.textOne?.toLowerCase().replace(/\s+/g, "-")}_${i}`
          : `question${i}`,
        name: question.textOne,
        description: question.textTwo,
        image: question.path ? getImageUrl(question.path) : "",
        correctOptions: question.textThree?.split("/"),
      };
    }),
  };
};

export default completeMatrixTranspiler;
