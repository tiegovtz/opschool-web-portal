import { getImageUrl } from "@/lib/utils";
import type { ActivityTranspilerProps } from ".";
import type { ServerQuestionType } from "@/lib/types/activity-props";

type ColumnOption = {
  text: string;
  isCorrect: boolean;
};

const singleCheckTableTranspiler = ({
  titleDescription,
  serverQuestions,
  setWrongQuestionsFormat,
}: ActivityTranspilerProps) => {
  try {
    // Extract column headers from the first question
    const headerQuestion = serverQuestions[0];
    if (!headerQuestion) {
      throw new Error("Missing header question");
    }
    const columnHeaders = [
      headerQuestion.textTwo,
      headerQuestion.textThree,
      headerQuestion.textFour,
      headerQuestion.textFive,
      headerQuestion.textSix,
      headerQuestion.textSeven,
      headerQuestion.textEight,
      headerQuestion.textNine,
      headerQuestion.textTen,
    ].filter(
      (text): text is string => typeof text === "string" && text.trim() !== "",
    );

    const processQuestion = (question: ServerQuestionType) => {
      // Get all non-empty text fields from textTwo to textTen
      const columnTexts = [
        question.textTwo,
        question.textThree,
        question.textFour,
        question.textFive,
        question.textSix,
        question.textSeven,
        question.textEight,
        question.textNine,
        question.textTen,
      ].filter(
        (text): text is string =>
          typeof text === "string" && text.trim() !== "",
      ); // Create column options with correct answers marked
      const options: ColumnOption[] = columnTexts.map((text, index) => {
        // By default, mark as correct if the text is "T"
        let isCorrect = text === "T";

        // Check if we have answer number in the description
        if (question.description && Array.isArray(question.description)) {
          for (const desc of question.description) {
            if (desc.details) {
              const answerMatch = desc.details.match(/Answer:?\s*(\d+)/i);
              if (answerMatch && answerMatch[1]) {
                const answerIndex = parseInt(answerMatch[1]) - 1;
                if (index === answerIndex) {
                  isCorrect = true;
                  break;
                }
              }
            }
          }
        }

        return {
          text,
          isCorrect,
        };
      });

      return {
        id: question.id,
        question: question.textOne, // Main question or description
        options,
        media: question.path
          ? {
              type: "image",
              url: getImageUrl(question.path),
              alt: question.textOne,
            }
          : undefined,
        description: question.description || undefined,
      };
    };

    const processedQuestions = serverQuestions.slice(1).map(processQuestion);

    // Additional validation
    if (processedQuestions.some((q) => q.options.length === 0)) {
      throw new Error("Some questions have no options");
    }

    if (
      processedQuestions.some((q) => !q.options.some((opt) => opt.isCorrect))
    ) {
      throw new Error("Some questions have no correct answer");
    }

    return {
      title: titleDescription.split("||")[0],
      fontSize: titleDescription.split("||")[1],
      questionHeader: headerQuestion.textOne || "",
      columnHeaders: columnHeaders.length > 0 ? columnHeaders : undefined,
      questions: processedQuestions,
    };
  } catch (error) {
    console.error("Error in singleCheckTableTranspiler:", error);
    setWrongQuestionsFormat(true);
    return {
      title: "",
      questions: [],
    };
  }
};

export default singleCheckTableTranspiler;
