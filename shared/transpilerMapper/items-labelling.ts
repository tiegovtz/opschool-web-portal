import { getImageUrl } from "@/lib/utils";
import { ActivityTranspilerProps } from ".";
import { ActivityType } from "@/lib/types/activity-types";

const itemsLabellingTranspiler = (params: ActivityTranspilerProps) => {
  const {
    summary,
    algorithm,
    serverQuestions,
    titleDescription,
    setWrongQuestionsFormat,
  } = params;

  let isWrongFormat = false;

  const activityNotes = titleDescription.split("/");

  // Handle "Items labeling without clues Game" mode
  if (algorithm === ActivityType.ItemsLabelingWithoutCluesGame) {
    // For game mode, we expect the first question to have type in textOne
    if (!serverQuestions.length || !serverQuestions[0].textOne) {
      setWrongQuestionsFormat(true);
      return;
    }

    // Return a special structure that indicates this needs async data fetching
    return {
      title: activityNotes[0],
      isGameMode: true,
      gameTimeLimit: serverQuestions[0]?.textTwo || 100,
      type: serverQuestions[0].textOne,
      algorithm,
      questions: [], // Will be populated by the component using the hook
    };
  }

  // Handle regular mode - check if all questions have a path and text
  serverQuestions.forEach((question) => {
    if (
      !question.textOne ||
      !question.textTwo ||
      !question.textThree ||
      !question.path ||
      !question.path ||
      !question.pathTwo
    )
      isWrongFormat = true;
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  return {
    title: activityNotes[0],
    notes:
      algorithm === ActivityType.ItemsLabelingWithoutClues
        ? activityNotes[1]
        : summary,
    algorithm,
    questions: serverQuestions.flatMap((question) => [
      {
        image: getImageUrl(question.path || ""),
        answer: question.textOne,
      },
      {
        image: getImageUrl(question.pathTwo || ""),
        answer: question.textTwo,
      },
      {
        image: getImageUrl(question.pathThree || ""),
        answer: question.textThree,
      },
    ]),
  };
};

export default itemsLabellingTranspiler;
