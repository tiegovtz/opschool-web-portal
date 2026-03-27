import type { ActivityTranspilerProps } from ".";
import { getImageUrl } from "@/lib/utils";

export const multipleChoiceWithNotesTranspiler = (
  params: ActivityTranspilerProps
) => {
  const { titleDescription, serverQuestions, setWrongQuestionsFormat } = params;
  let isWrongFormat = false;

  //   Check if all questions have the correct format
  //   Take the first question and check if textOne and textTwo are not null
  if (
    !serverQuestions.every((question) => question.textOne && question.textTwo)
  ) {
    isWrongFormat = true;
  }

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  //  get the questions before the first encounter of "\n" and the options after the first encounter of "\n"
  return {
    title: titleDescription.split("//")[0],
    notes: titleDescription.split("//")[1],
    image: getImageUrl(serverQuestions[0]?.path || ""),
    questions: serverQuestions.map((question) => {
      return {
        question: question.textOne?.split("\n")[0],
        options: question.textOne
          ?.split("\n")
          .slice(1)
          .map((option) => {
            const [id, text] = option.includes(":")
              ? option.split(":")
              : option.split(")");

            return {
              id: id?.trim(),
              text: text?.trim(),
              correct:
                question.textTwo?.toLowerCase() === id?.trim().toLowerCase(),
            };
          }),
      };
    }),
  };
};
