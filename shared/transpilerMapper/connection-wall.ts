import { ActivityTranspilerProps } from ".";
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

  // Check if this is game mode
  const isGameMode = algorithm === ActivityType.ConnectionWallGames;

  if (isGameMode) {
    // For game mode, we need type in textOne and optionally time limit in textThree
    if (!serverQuestions[0]?.textOne) {
      setWrongQuestionsFormat(true);
      return null;
    }

    // Extract type and time limit for game mode
    const type = serverQuestions[0].textOne.split("/").slice(0, 4).join("/");
    const gameTimeLimit = serverQuestions[0].textThree
      ? parseInt(serverQuestions[0].textThree, 10)
      : undefined;

    return {
      algorithm,
      title: titleDescription,
      questions: [], // Will be populated by useObjects hook
      isGameMode: true,
      type,
      gameTimeLimit,
      showImages: !!serverQuestions[0].textFour,
      useStrict: true, // Enable strict mode for equal distribution across types
    };
  }

  if (checkFormat(serverQuestions[0])) {
    isWrongFormat = true;
  }

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return null;
  }

  const numItemsPerGroup =
    algorithm === ActivityType.ConnectionWallThreeRows ? 3 : 4;

  const categoryOneItems = serverQuestions[0].textOne
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: serverQuestions[0].textOne?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(serverQuestions[index].path || "")
            : undefined,
      };
    });

  const categoryTwoItems = serverQuestions[0].textTwo
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: serverQuestions[0].textTwo?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(serverQuestions[index].pathTwo || "")
            : undefined,
      };
    });

  const categoryThreeItems = serverQuestions[0].textThree
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: serverQuestions[0].textThree?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(serverQuestions[index].pathThree || "")
            : undefined,
      };
    });

  const categoryFourItems = serverQuestions[0].textFour
    ?.split(",")
    .slice(0, numItemsPerGroup)
    .map((item, index) => {
      return {
        id: item,
        name: algorithm !== ActivityType.ConnectionWallPic ? item : undefined,
        category: serverQuestions[0].textFour?.split(",")[numItemsPerGroup],
        imgSrc:
          algorithm === ActivityType.ConnectionWallPic ||
          algorithm === ActivityType.ConnectionWallPicText
            ? getImageUrl(serverQuestions[index].pathFour || "")
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
