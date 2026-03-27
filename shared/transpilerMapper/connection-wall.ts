import type { ActivityTranspilerProps } from ".";
import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";

const checkFormat = (question: any) => {
  return (
    !question.textOne ||
    !question.textTwo ||
    !question.textThree ||
    !question.textFour
  );
};

export const connectionWallTranspiler = (params: ActivityTranspilerProps) => {
  const {
    titleDescription,
    algorithm,
    setWrongQuestionsFormat,
    serverQuestions,
  } = params;
  let isWrongFormat = false;
  const firstQuestion = serverQuestions[0];

  // Check if this is game mode
  const isGameMode = algorithm === ActivityType.ConnectionWallGames;

  if (isGameMode) {
    // For game mode, we need type in textOne and optionally time limit in textThree
    if (!firstQuestion?.textOne) {
      setWrongQuestionsFormat(true);
      return null;
    }

    // Extract type and time limit for game mode
    const type = firstQuestion.textOne.split("/").slice(0, 4).join("/");
    const gameTimeLimit = firstQuestion.textThree
      ? parseInt(firstQuestion.textThree, 10)
      : undefined;

    return {
      algorithm,
      title: titleDescription,
      questions: [], // Will be populated by useObjects hook
      isGameMode: true,
      type,
      gameTimeLimit,
      showImages: !!firstQuestion.textFour,
      useStrict: true, // Enable strict mode for equal distribution across types
    };
  }

  if (!firstQuestion || checkFormat(firstQuestion)) {
    isWrongFormat = true;
  }

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  const numItemsPerGroup =
    algorithm === ActivityType.ConnectionWallThreeRows ? 3 : 4;
  const safeFirstQuestion = firstQuestion as NonNullable<typeof firstQuestion>;

  const categoryOneItems = safeFirstQuestion.textOne
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      const question = serverQuestions[index];
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: safeFirstQuestion.textOne?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(question?.path || "")
            : undefined,
      };
    });

  const categoryTwoItems = safeFirstQuestion.textTwo
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      const question = serverQuestions[index];
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: safeFirstQuestion.textTwo?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(question?.pathTwo || "")
            : undefined,
      };
    });

  const categoryThreeItems = safeFirstQuestion.textThree
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      const question = serverQuestions[index];
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: safeFirstQuestion.textThree?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(question?.pathThree || "")
            : undefined,
      };
    });

  const categoryFourItems = safeFirstQuestion.textFour
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      const question = serverQuestions[index];
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: safeFirstQuestion.textFour?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(question?.pathFour || "")
            : undefined,
      };
    });

  const questions = shuffle([
    ...(categoryOneItems || []),
    ...(categoryTwoItems || []),
    ...(categoryThreeItems || []),
    ...(categoryFourItems || []),
  ]);

  return {
    algorithm,
    title: titleDescription,
    questions,
  };
};
