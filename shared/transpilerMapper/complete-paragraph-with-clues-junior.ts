import { getCommonSeparator, getImageUrl, shuffle } from "@/lib/utils";
// import { ActivityTranspilerProps } from ".";
import { type ActivityTranspilerProps } from ".";

export const completeParagraphWithCluesJuniorTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const { titleDescription, setWrongQuestionsFormat, serverQuestions } = params;
  let isWrongFormat = false;

  // Check if there is textOne and textTwo in all questions
  serverQuestions.forEach((question) => {
    if (!question.textOne || !question.textTwo) {
      isWrongFormat = true;
    }
  });

  // Extract paragraph and answers from the first question
  const paragraph = serverQuestions[0]?.textOne || "";
  const answersString = serverQuestions[0]?.textTwo || "";
  const separator = getCommonSeparator(answersString) || " ";

  // Count the number of blanks (___) in the paragraph
  const blankCount = (paragraph.match(/___/g) || []).length;

  // Split the answers by computed separator to get individual answers
  const answers = answersString.split(separator);

  // Validate that the number of blanks matches the number of answers
  if (blankCount !== answers.length) {
    isWrongFormat = true;
  }

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  return {
    title: titleDescription,
    image: getImageUrl(serverQuestions[0]?.path || ""),
    paragraph,
    fontSize: titleDescription.split("||")[1]?.slice(0, 2) || "",
    answers,
    options: (answersString && shuffle(answersString.split(separator))) || [],
    withClues: serverQuestions[0]?.textThree || false,
  };
};
