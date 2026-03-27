import type { ActivityTranspilerProps } from ".";
import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";

type MatchingItem = {
  id: string;
  content: string | { imageSrc: string };
};

const matchingItemsPictureTextTranspiler = (
  params: ActivityTranspilerProps,
) => {
  const {
    serverQuestions,
    algorithm,
    titleDescription,
    setWrongQuestionsFormat,
  } = params;
  let isWrongFormat = false;

  // Check if this is game mode
  const isGameMode =
    algorithm === ActivityType.MatchingItemsGame ||
    algorithm === ActivityType.MatchingItemsPicturesGame;

  if (isGameMode) {
    // For game mode, we need type in textOne and optionally time limit in textThree
    if (!serverQuestions[0]?.textOne) {
      setWrongQuestionsFormat(true);
      return null;
    }

    // Extract type and time limit for game mode
    const type = serverQuestions[0].textOne;
    const gameTimeLimit = serverQuestions[0].textThree
      ? parseInt(serverQuestions[0].textThree, 10)
      : undefined;

    return {
      algorithm,
      title: titleDescription.split("||")[0],
      fontSize: titleDescription.split("||")[1],
      leftItems: [], // Will be populated by useObjects hook
      rightItems: [], // Will be populated by useObjects hook
      category:
        algorithm === ActivityType.MatchingItemsPicturesGame
          ? "image-to-text"
          : "text-to-text",
      isGameMode: true,
      type,
      gameTimeLimit,
      useStrict: algorithm === ActivityType.MatchingItemsGame, // Only use strict for words-only game
    };
  }

  // Check if questions have the required fields based on algorithm type
  serverQuestions.forEach((question) => {
    if (
      (algorithm === ActivityType.PictureTextMatching ||
        algorithm === ActivityType.PicturePictureMatching) &&
      (!question.path || !question.textOne)
    ) {
      isWrongFormat = true;
    }

    if (algorithm === ActivityType.TextTextMatching) {
      if (!question.textOne || !question.textTwo) isWrongFormat = true;
    }
  });

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
    return;
  }

  // Make a copy and shuffle the server questions
  const shuffledQuestions = shuffle([...serverQuestions]);

  let leftItems: MatchingItem[] = [];
  let rightItems: MatchingItem[] = [];

  // Structure the items based on algorithm type
  switch (algorithm) {
    case ActivityType.PictureTextMatching:
    case ActivityType.PictureTextMatchingSixItems:
      // Left side: pictures, Right side: text
      leftItems = shuffledQuestions.map((question) => ({
        id: question.id,
        content: { imageSrc: getImageUrl(question.path || "") },
      }));
      rightItems = shuffledQuestions.map((question) => ({
        id: question.id,
        content: question.textOne,
      }));
      break;

    case ActivityType.PicturePictureMatching:
    case ActivityType.PicturePictureMatchingSixItems:
      // Left side: pictures, Right side: pictures
      const leftQuestions = shuffle(
        [...serverQuestions].slice(
          0,
          algorithm == ActivityType.PicturePictureMatchingSixItems ? 6 : 8,
        ),
      );
      const rightQuestions = shuffle(
        [...serverQuestions].slice(
          algorithm == ActivityType.PicturePictureMatchingSixItems ? 6 : 8,
        ),
      );

      leftItems = leftQuestions.map((question) => ({
        id: question.textOne,
        content: { imageSrc: getImageUrl(question.path || "") },
      }));
      rightItems = rightQuestions.map((question) => ({
        id: question.textOne,
        content: { imageSrc: getImageUrl(question.path || "") },
      }));
      break;

    case ActivityType.TextTextMatching:
    case ActivityType.TextTextMatchingSixItems:
      // Left side: text, Right side: text
      leftItems = shuffledQuestions.map((question) => ({
        id: question.id,
        content: question.textTwo,
      }));
      rightItems = shuffledQuestions.map((question) => ({
        id: question.id,
        content: question.textOne,
      }));
      break;

    default:
      // Default to picture-text matching
      leftItems = shuffledQuestions.map((question) => ({
        id: question.id,
        content: { imageSrc: getImageUrl(question.path || "") },
      }));
      rightItems = shuffledQuestions.map((question) => ({
        id: question.id,
        content: question.textOne,
      }));
  }

  // Determine category based on algorithm
  let category;
  switch (algorithm) {
    case ActivityType.PictureTextMatching:
      category = "image-to-text";
      break;
    case ActivityType.PicturePictureMatching:
    case ActivityType.PicturePictureMatchingSixItems:
      category = "image-to-image";
      break;
    case ActivityType.TextTextMatching:
    case ActivityType.TextTextMatchingSixItems:
      category = "text-to-text";
      break;
    default:
      category = "image-to-text";
  }

  return {
    title: titleDescription.split("||")[0],
    fontSize: titleDescription.split("||")[1],
    category,
    leftItems,
    rightItems,
  };
};

export default matchingItemsPictureTextTranspiler;
