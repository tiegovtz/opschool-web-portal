import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from ".";
import { ActivityType } from "@/lib/types/activity-types";

const rearrangeLettersInWordsTranspiler = (params: ActivityTranspilerProps) => {
  const {
    serverQuestions,
    setWrongQuestionsFormat,
    titleDescription,
    algorithm,
  } = params;
  let isWrongFormat = false;

  // Handle "Rearrange Letters in Words Game" mode
  if (algorithm === ActivityType.RearrangeLettersInWordsGame) {
    // For game mode, we expect the first question to have type in textOne and words count in textTwo
    if (
      !serverQuestions.length ||
      !serverQuestions[0].textOne ||
      !serverQuestions[0].textTwo
    ) {
      setWrongQuestionsFormat(true);
      return;
    }

    // Return a special structure that indicates this needs async data fetching
    return {
      title: titleDescription,
      isGameMode: true,
      type: serverQuestions[0].textOne,
      words: serverQuestions[0].textTwo,
      questions: [], // Will be populated by the component using the hook
    };
  }

  // Handle regular mode
  serverQuestions.forEach((question) => {
    if (!question.textTwo || !question.textTwo.length) {
      isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: titleDescription,
    isGameMode: false,
    gameTimeLimit: serverQuestions[0]?.textThree ?? 100,
    questions: shuffle(
      serverQuestions.map((question) => ({
        word: question.textTwo,
        image: question.path ? getImageUrl(question.path) : null,
      })),
    ),
  };
};

export default rearrangeLettersInWordsTranspiler;
