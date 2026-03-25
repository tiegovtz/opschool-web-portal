import { shuffle } from "@/lib/utils";
import { ActivityTranspilerProps } from "./index";

export const patternMatchingTranspiler = ({
  serverQuestions,
  titleDescription,
  setWrongQuestionsFormat,
}: ActivityTranspilerProps) => {
  try {
    // Validate server questions format
    if (!Array.isArray(serverQuestions) || serverQuestions.length === 0) {
      setWrongQuestionsFormat(true);
      return null;
    }

    // Validate each question has required fields
    const isValidFormat = serverQuestions.every(
      (question) =>
        question &&
        typeof question.id === "number" &&
        typeof question.textOne === "string" &&
        typeof question.textTwo === "string" &&
        typeof question.path === "string" &&
        question.textOne.trim() !== "" &&
        question.textTwo.trim() !== "" &&
        question.path.trim() !== "",
    );

    if (!isValidFormat) {
      setWrongQuestionsFormat(true);
      return null;
    }

    // Additional validation for pattern format (should be numbers separated by /)
    const hasValidPatterns = serverQuestions.every((question) => {
      const pattern = (question.textOne || "").split("/");
      return (
        pattern.length > 0 && pattern.every((id) => !isNaN(Number(id.trim())))
      );
    });

    if (!hasValidPatterns) {
      setWrongQuestionsFormat(true);
      return null;
    }

    // Create image map from questions - map pattern IDs to image paths
    const imageMap: { [key: string]: string } = {};
    serverQuestions.forEach((question, i) => {
      if (question.textTwo && question.path) {
        imageMap[(i + 1).toString()] = question.path;
      }
    });

    // Convert server questions to patterns array
    const patterns: string[][] = [];
    const patternAnswers: string[] = [];

    serverQuestions.forEach((question) => {
      // Parse the pattern from textOne (e.g., "1/2/3/1/2/3/1/2/3")
      const patternSequence = (question.textOne || "").split("/");

      // The pattern shows the sequence, answer is in textTwo
      patterns.push(patternSequence);
      patternAnswers.push(question.textTwo || "");
    });

    // Get all unique draggable items from all the answers
    // const draggableItems = [...new Set(patternAnswers)];

    return {
      title: titleDescription.split("/")[0] || "Pattern Matching Activity",
      patterns,
      patternAnswers,
      imageMap,
      draggableItems: shuffle(
        serverQuestions.map((_, i) => (i + 1).toString()),
      ),
    };
  } catch (error) {
    console.error("Error in pattern matching transpiler:", error);
    setWrongQuestionsFormat(true);
    return null;
  }
};
