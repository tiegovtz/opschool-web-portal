import { shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from ".";
import { ActivityType } from "@/lib/types/activity-types";

const hiddenWordsTranspiler = (params: ActivityTranspilerProps) => {
  const {
    serverQuestions,
    setWrongQuestionsFormat,
    titleDescription,
    algorithm,
  } = params;
  let isWrongFormat = false;

  // Handle "Hidden Words Game" mode
  if (algorithm === ActivityType.HiddenWordsGame) {
    // For game mode, we expect the first question to have type in textOne
    if (!serverQuestions.length || !serverQuestions[0].textOne) {
      setWrongQuestionsFormat(true);
      return;
    }

    // Return a special structure that indicates this needs async data fetching
    return {
      title: titleDescription,
      isGameMode: true,
      type: serverQuestions[0].textOne,
      gameTimeLimit: serverQuestions[0]?.textTwo ?? 300, // Default 5 minutes for hidden words
      words: [], // Will be populated by the component using the hook
    };
  }

  // Handle regular mode
  serverQuestions.forEach((question) => {
    if (!question.textTwo) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  const forChildren = titleDescription.split("||")[1] === "0" || false;

  const words =
    serverQuestions[0].textTwo?.split("/").map((word) => word.trim()) || [];
  const finalWords =
    words.length > (forChildren ? 5 : 8)
      ? shuffle(words).slice(0, forChildren ? 5 : 8)
      : words;

  return {
    title: titleDescription.split("||")[0],
    isGameMode: false,
    words: finalWords,
    forChildren,
  };
};

export default hiddenWordsTranspiler;
