import type { ActivityTranspilerProps } from ".";
import { getImageUrl, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";

type MatchingItem = {
  id: string;
  content: string | { imageSrc: string };
};

const TEXT_FIELD_KEYS = [
  "textOne",
  "textTwo",
  "textThree",
  "textFour",
  "textFive",
  "textSix",
  "textSeven",
  "textEight",
  "textNine",
  "textTen",
] as const;

const IMAGE_FIELD_KEYS = [
  "path",
  "pathTwo",
  "pathThree",
  "pathFour",
  "image",
  "imageTwo",
  "imageThree",
  "imageFour",
] as const;

const getTextValue = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return "";
};

const getImageValue = (value: unknown) => {
  const imagePath = typeof value === "string" ? value.trim() : "";
  return imagePath ? getImageUrl(imagePath) : "";
};

const getQuestionId = (question: ActivityTranspilerProps["serverQuestions"][number], index: number) =>
  String(question.id ?? index);

const getQuestionTexts = (
  question: ActivityTranspilerProps["serverQuestions"][number],
) => {
  const descriptionTexts = Array.isArray(question.description)
    ? question.description
        .map((item) => getTextValue(item?.details))
        .filter(Boolean)
    : [];

  return [
    ...TEXT_FIELD_KEYS.map((key) => getTextValue(question[key])).filter(Boolean),
    ...descriptionTexts,
  ];
};

const getQuestionImages = (
  question: ActivityTranspilerProps["serverQuestions"][number],
) =>
  IMAGE_FIELD_KEYS.map((key) => getImageValue(question[key])).filter(Boolean);

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

  let leftItems: MatchingItem[] = [];
  let rightItems: MatchingItem[] = [];

  const shuffledQuestions = shuffle([...serverQuestions]);
  const category = (() => {
    switch (algorithm) {
      case ActivityType.PictureTextMatching:
      case ActivityType.PictureTextMatchingSixItems:
        return "image-to-text" as const;
      case ActivityType.PicturePictureMatching:
      case ActivityType.PicturePictureMatchingSixItems:
        return "image-to-image" as const;
      case ActivityType.TextTextMatching:
      case ActivityType.TextTextMatchingSixItems:
        return "text-to-text" as const;
      default:
        return "image-to-text" as const;
    }
  })();

  const pictureTextPairs = shuffledQuestions
    .map((question, index) => {
      const id = getQuestionId(question, index);
      const [imageSrc] = getQuestionImages(question);
      const [label] = getQuestionTexts(question);

      if (!imageSrc || !label) return null;
      return {
        id,
        left: { id, content: { imageSrc } },
        right: { id, content: label },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const textTextPairs = shuffledQuestions
    .map((question, index) => {
      const id = getQuestionId(question, index);
      const [firstText, secondText] = getQuestionTexts(question);

      if (!firstText || !secondText) return null;
      return {
        id,
        left: { id, content: secondText },
        right: { id, content: firstText },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const pairedImagePairs = shuffledQuestions
    .map((question, index) => {
      const id = getQuestionId(question, index);
      const [leftImage, rightImage] = getQuestionImages(question);

      if (!leftImage || !rightImage) return null;
      return {
        id,
        left: { id, content: { imageSrc: leftImage } },
        right: { id, content: { imageSrc: rightImage } },
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // Structure the items based on algorithm type
  switch (algorithm) {
    case ActivityType.PictureTextMatching:
    case ActivityType.PictureTextMatchingSixItems:
      leftItems = pictureTextPairs.map((item) => item.left);
      rightItems = pictureTextPairs.map((item) => item.right);
      break;

    case ActivityType.PicturePictureMatching:
    case ActivityType.PicturePictureMatchingSixItems:
      if (pairedImagePairs.length) {
        leftItems = pairedImagePairs.map((item) => item.left);
        rightItems = pairedImagePairs.map((item) => item.right);
        break;
      }

      const imagePoolItems = shuffledQuestions
        .map((question, index) => {
          const [imageSrc] = getQuestionImages(question);
          if (!imageSrc) return null;

          const [primaryText] = getQuestionTexts(question);
          const id = primaryText || getQuestionId(question, index);

          return {
            id,
            content: { imageSrc },
          };
        })
        .filter((item): item is MatchingItem => item !== null);

      const splitIndex =
        algorithm === ActivityType.PicturePictureMatchingSixItems
          ? 6
          : Math.ceil(imagePoolItems.length / 2);

      leftItems = shuffle(imagePoolItems.slice(0, splitIndex));
      rightItems = shuffle(imagePoolItems.slice(splitIndex));
      break;

    case ActivityType.TextTextMatching:
    case ActivityType.TextTextMatchingSixItems:
      leftItems = textTextPairs.map((item) => item.right);
      rightItems = textTextPairs.map((item) => item.left);
      break;

    default:
      leftItems = pictureTextPairs.map((item) => item.left);
      rightItems = pictureTextPairs.map((item) => item.right);
  }

  leftItems = leftItems.filter((item) => {
    if (typeof item.content === "string") return item.content.trim().length > 0;
    return !!item.content.imageSrc;
  });
  rightItems = rightItems.filter((item) => {
    if (typeof item.content === "string") return item.content.trim().length > 0;
    return !!item.content.imageSrc;
  });

  if (leftItems.length && rightItems.length && leftItems.length !== rightItems.length) {
    const sharedPairCount = Math.min(leftItems.length, rightItems.length);
    leftItems = leftItems.slice(0, sharedPairCount);
    rightItems = rightItems.slice(0, sharedPairCount);
  }

  if (!leftItems.length || !rightItems.length) {
    isWrongFormat = true;
  }

  if (isWrongFormat) {
    setWrongQuestionsFormat(true);
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
