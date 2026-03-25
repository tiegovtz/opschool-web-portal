import { ActivityTranspilerProps } from "../index";

const shortAnswerQuestionsGameTranspiler = ({
  titleDescription,
  serverQuestions,
  setWrongQuestionsFormat,
}: ActivityTranspilerProps) => {
  try {
    // Extract configuration from the first server question
    const firstQuestion = serverQuestions[0];

    if (!firstQuestion) {
      setWrongQuestionsFormat(true);
      return null;
    }

    // Extract type from textOne (object type to fetch)
    const type = firstQuestion.textOne;

    // Extract game time limit from textTwo (in seconds, default 300 = 5 minutes)
    const gameTimeLimit = firstQuestion.textTwo
      ? parseInt(firstQuestion.textTwo)
      : 300;

    // Extract fontSize from textThree (default 20)
    const fontSize = titleDescription.split("||")[1]
      ? parseInt(titleDescription.split("||")[1])
      : 20;

    if (!type) {
      setWrongQuestionsFormat(true);
      return null;
    }

    return {
      title: titleDescription.split("||")[0] || "Short Answer Questions Game",
      type: type,
      fontSize: isNaN(fontSize) ? 20 : fontSize,
      isGameMode: true,
      gameTimeLimit: isNaN(gameTimeLimit) ? 300 : gameTimeLimit,
    };
  } catch (error) {
    console.error("Error parsing short answer questions game:", error);
    setWrongQuestionsFormat(true);
    return null;
  }
};

export default shortAnswerQuestionsGameTranspiler;
