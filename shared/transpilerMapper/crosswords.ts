import { ActivityTranspilerProps } from ".";
import { ActivityType } from "@/lib/types/activity-types";

const CrosswordsTranspiler = (params: ActivityTranspilerProps) => {
  const {
    titleDescription,
    serverQuestions,
    setWrongQuestionsFormat,
    algorithm,
  } = params;
  let isWrongFormat = false;

  // Handle "Crossword words Game" mode
  if (algorithm === ActivityType.CrosswordWordsGame) {
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
      gameTimeLimit: serverQuestions[0]?.textThree ?? 600, // Default 10 minutes for crosswords
      numberOfWords: serverQuestions[0].textTwo ?? 1, // Will be populated by the component using the hook
    };
  }

  // Handle "Crosswords With Pics" mode
  if (algorithm === ActivityType.CrosswordsWithPics) {
    // For image-based crosswords game mode, we expect the first question to have type in textOne
    if (!serverQuestions.length || !serverQuestions[0].textOne) {
      setWrongQuestionsFormat(true);
      return;
    }

    // Return a special structure that indicates this needs async data fetching with images
    return {
      title: titleDescription,
      isGameMode: true,
      isImageMode: true, // New flag to indicate image-based clues
      type: serverQuestions[0].textTwo,
      gameTimeLimit: serverQuestions[0]?.textThree || 300, // Default 10 minutes for crosswords
      numberOfWords: 1,
    };
  }

  // Handle regular mode
  if (!serverQuestions || serverQuestions.length === 0) {
    setWrongQuestionsFormat(true);
    return null;
  }

  let wordsOutput: Array<{ id: number; word: string; clue: string }> = [];

  // Ensure serverQuestions[0] exists before processing clues from it.
  if (serverQuestions && serverQuestions.length > 0) {
    const firstQuestion = serverQuestions[0];
    const textThree = `${firstQuestion.textThree}./` || "";
    const textFour = firstQuestion.textFour || "";

    const cluesCombinedText = textThree + textFour;

    // Process only if there's actual content after combining and trimming.
    if (cluesCombinedText.trim().length > 0) {
      const clueSegments = cluesCombinedText.split("/");
      for (const segment of clueSegments) {
        const trimmedSegment = segment.trim();

        if (trimmedSegment.length === 0) {
          continue; // Skip empty segments (e.g., from "foo./bar./")
        }

        // Validate: Number and dot
        const dotIndex = trimmedSegment.indexOf(".");
        if (dotIndex <= 0) {
          // ID must exist (not at the start) and be followed by a dot.
          isWrongFormat = true;
          break;
        }
        const idStr = trimmedSegment.substring(0, dotIndex);
        const id = parseInt(idStr, 10);
        if (isNaN(id)) {
          // ID must be a valid number.
          isWrongFormat = true;
          break;
        }

        // Validate: Parentheses for the word
        const openParenIndex = trimmedSegment.lastIndexOf("(");
        const closeParenIndex = trimmedSegment.lastIndexOf(")");

        if (
          openParenIndex === -1 || // Opening parenthesis must exist
          closeParenIndex === -1 || // Closing parenthesis must exist
          openParenIndex >= closeParenIndex // Opening must be before closing
        ) {
          isWrongFormat = true;
          break;
        }

        // Extract and validate: Word
        const word = trimmedSegment
          .substring(openParenIndex + 1, closeParenIndex)
          .trim();
        if (word.length === 0) {
          // Word inside parentheses cannot be empty.
          isWrongFormat = true;
          break;
        }

        // Extract and validate: Clue text
        const clueText = trimmedSegment
          .substring(dotIndex + 1, openParenIndex)
          .trim();

        if (clueText.length === 0) {
          // Clue text (between ID. and word) cannot be empty.
          isWrongFormat = true;
          break;
        }

        // If all checks pass for this segment
        wordsOutput.push({ id, word, clue: clueText });
      }

      // If any segment was invalid, set format as wrong and return null
      if (isWrongFormat) {
        setWrongQuestionsFormat(true);
        return null;
      }
    }
  }

  return {
    title: titleDescription,
    isGameMode: false,
    words: wordsOutput,
  };
};

export default CrosswordsTranspiler;
