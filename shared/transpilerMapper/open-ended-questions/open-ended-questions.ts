// @ts-nocheck
import { getImageUrl } from "@/lib/utils";
import type { ActivityTranspilerProps } from "../index";

export interface OpenEndedQuestionsServerData {
  id: number;
  textOne: string;
  path?: string;
}

export interface OpenEndedQuestionsParsedData {
  title: string;
  fontSize?: string;
  questions: {
    id: string;
    questionNumber: string;
    questionText?: string;
    imagePath?: string;
    useAI?: boolean;
    hint?: string;
    acceptedAnswers?: string[];
    maxMarks?: number;
    parts: {
      id: string;
      partLabel: string;
      questionText?: string;
      maxMarks?: number;
      useAI?: boolean;
      hint?: string;
      acceptedAnswers?: string[];
      subQuestions: {
        id: string;
        subLabel: string;
        questionText: string;
        maxMarks: number;
        useAI?: boolean;
        hint?: string;
        acceptedAnswers?: string[];
        evaluationCriteria?: string;
      }[];
    }[];
  }[];
}

/**
 * Detects if the textOne uses the new structured format
 */
function isNewStructuredFormat(textOne: string): boolean {
  const structuredKeywords = [
    "QUESTION:",
    "PART:",
    "SUB:",
    "TEXT:",
    "MARKS:",
    "AI:",
    "HINT:",
  ];
  return structuredKeywords.some((keyword) => textOne.includes(keyword));
}

/**
 * Parser for new structured format
 */
function parseStructuredFormat(
  textOne: string,
  baseId: number,
  imagePath?: string,
): OpenEndedQuestionsParsedData["questions"][0] {
  const lines = textOne.split("\n").map((line) => line.trim());

  const result: OpenEndedQuestionsParsedData["questions"][0] = {
    id: `question-${baseId}`,
    questionNumber: "",
    questionText: undefined as string | undefined,
    imagePath,
    useAI: undefined,
    hint: undefined,
    acceptedAnswers: undefined,
    maxMarks: undefined,
    parts: [] as any[],
  };

  let currentPart: any = null;
  let textBuffer: string[] = [];
  let pendingSubQuestion: any = null;
  let subQuestionCounter = 0;
  let textContext: "main" | "part" | "sub" = "main"; // Track where collected text should go
  let currentUseAI: boolean | undefined = undefined;
  let currentHint: string | undefined = undefined;

  const flushTextBuffer = () => {
    // Join with line breaks preserved, but clean up excessive empty lines
    const text = textBuffer
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    textBuffer = [];
    return text || undefined;
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("QUESTION:")) {
      result.questionNumber = trimmedLine.replace("QUESTION:", "").trim() + ".";
      textContext = "main";
    } else if (trimmedLine.startsWith("PART:")) {
      // Flush any existing text to the appropriate context
      if (textBuffer.length > 0) {
        const text = flushTextBuffer();
        if (textContext === "main") {
          result.questionText = text;
          textContext = "main";
        } else if (textContext === "part" && currentPart) {
          currentPart.questionText = text;
        } else if (textContext === "sub" && pendingSubQuestion) {
          pendingSubQuestion.questionText = text || "";
        }
      }

      const partLabel = trimmedLine.replace("PART:", "").trim();
      currentPart = {
        id: `${baseId}-part-${partLabel}`,
        partLabel: `${partLabel})`,
        questionText: undefined,
        maxMarks: undefined,
        useAI: undefined,
        hint: undefined,
        acceptedAnswers: undefined,
        subQuestions: [],
      };
      result.parts.push(currentPart);
      textContext = "part";
      // Reset context variables for new part
      currentUseAI = undefined;
      currentHint = undefined;
    } else if (trimmedLine.startsWith("SUB:")) {
      // Flush any existing text to the appropriate context
      if (textBuffer.length > 0) {
        const text = flushTextBuffer();
        if (textContext === "main") {
          result.questionText = text;
        } else if (textContext === "part" && currentPart) {
          currentPart.questionText = text;
        } else if (textContext === "sub" && pendingSubQuestion) {
          pendingSubQuestion.questionText = text || "";
        }
      }

      const subLabel = trimmedLine.replace("SUB:", "").trim();
      pendingSubQuestion = {
        subLabel: subLabel ? `${subLabel}.` : "",
        questionText: "",
        maxMarks: 0,
        useAI: undefined,
        hint: undefined,
        acceptedAnswers: undefined,
      };
      textContext = "sub";
      // Reset context variables for new sub-question
      currentUseAI = undefined;
      currentHint = undefined;
    } else if (trimmedLine === "TEXT:") {
      // Start collecting text for the current context
      textBuffer = [];
    } else if (trimmedLine.startsWith("AI:")) {
      const aiValue = trimmedLine.replace("AI:", "").trim().toUpperCase();
      currentUseAI = aiValue === "T" || aiValue === "TRUE";
    } else if (trimmedLine.startsWith("HINT:")) {
      currentHint = trimmedLine.replace("HINT:", "").trim();
    } else if (trimmedLine.startsWith("MARKS:")) {
      const marks = parseInt(trimmedLine.replace("MARKS:", "").trim());

      // Flush any existing text to the appropriate context
      if (textBuffer.length > 0) {
        const text = flushTextBuffer();
        if (textContext === "main") {
          result.questionText = text;
        } else if (textContext === "part" && currentPart) {
          currentPart.questionText = text;
        } else if (textContext === "sub" && pendingSubQuestion) {
          pendingSubQuestion.questionText = text || "";
        }
      }

      if (pendingSubQuestion) {
        // Complete the pending sub-question
        subQuestionCounter++;
        const subQuestion = {
          id: `${baseId}-q-${subQuestionCounter}`,
          subLabel: pendingSubQuestion.subLabel,
          questionText: pendingSubQuestion.questionText,
          maxMarks: marks,
          useAI: currentUseAI,
          hint: currentHint,
          acceptedAnswers:
            currentUseAI === false && currentHint
              ? currentHint
                  .split("//")
                  .map((answer) => answer.trim())
                  .filter((answer) => answer.length > 0)
              : undefined,
        };

        if (!currentPart) {
          // Create default part if none exists
          currentPart = {
            id: `${baseId}-part-default`,
            partLabel: "",
            questionText: undefined,
            maxMarks: undefined,
            useAI: undefined,
            hint: undefined,
            acceptedAnswers: undefined,
            subQuestions: [],
          };
          result.parts.push(currentPart);
        }

        currentPart.subQuestions.push(subQuestion);
        pendingSubQuestion = null;
      } else if (currentPart && textContext === "part") {
        // Part-level marks
        currentPart.maxMarks = marks;
        currentPart.useAI = currentUseAI;
        currentPart.hint = currentHint;
        currentPart.acceptedAnswers =
          currentUseAI === false && currentHint
            ? currentHint
                .split("//")
                .map((answer) => answer.trim())
                .filter((answer) => answer.length > 0)
            : undefined;
      } else if (textContext === "main") {
        // Question-level marks (for questions without parts)
        result.maxMarks = marks;
        result.useAI = currentUseAI;
        result.hint = currentHint;
        result.acceptedAnswers =
          currentUseAI === false && currentHint
            ? currentHint
                .split("//")
                .map((answer) => answer.trim())
                .filter((answer) => answer.length > 0)
            : undefined;
      }
    } else {
      // Regular text line - add to buffer (any non-keyword line becomes text content)
      if (trimmedLine.length > 0) {
        // Remove TEXT: prefix if present, but keep all other content
        const cleanedLine = trimmedLine.replace(/^TEXT:\s*/, "");
        textBuffer.push(cleanedLine);
      } else if (textBuffer.length > 0) {
        // Preserve empty lines for formatting when we're already collecting text
        textBuffer.push("");
      }
    }
  }

  // Flush any remaining text to the appropriate context
  if (textBuffer.length > 0) {
    const text = flushTextBuffer();
    if (textContext === "main") {
      result.questionText = text;
    } else if (textContext === "part" && currentPart) {
      currentPart.questionText = text;
    } else if (textContext === "sub" && pendingSubQuestion) {
      pendingSubQuestion.questionText = text || "";
    }
  }

  // Complete any pending sub-question (in case MARKS: was missing)
  if (pendingSubQuestion) {
    subQuestionCounter++;
    const subQuestion = {
      id: `${baseId}-q-${subQuestionCounter}`,
      subLabel: pendingSubQuestion.subLabel,
      questionText: pendingSubQuestion.questionText,
      maxMarks: 1, // Default marks
      useAI: currentUseAI,
      hint: currentHint,
      acceptedAnswers:
        currentUseAI === false && currentHint
          ? currentHint
              .split("//")
              .map((answer) => answer.trim())
              .filter((answer) => answer.length > 0)
          : undefined,
    };

    if (!currentPart) {
      currentPart = {
        id: `${baseId}-part-default`,
        partLabel: "",
        questionText: undefined,
        maxMarks: undefined,
        useAI: undefined,
        hint: undefined,
        acceptedAnswers: undefined,
        subQuestions: [],
      };
      result.parts.push(currentPart);
    }

    currentPart.subQuestions.push(subQuestion);
  }

  // Filter out parts with no sub-questions and no marks (empty parts)
  result.parts = result.parts.filter(
    (part) => part.subQuestions.length > 0 || part.maxMarks,
  );

  // If no question number was found, create a default one
  if (!result.questionNumber) {
    result.questionNumber = `${baseId}.`;
  }

  return result;
}

/**
 * Enhanced parser for open-ended questions with proper state management (Legacy format)
 */
function parseLegacyFormat(
  textOne: string,
  baseId: number,
  imagePath?: string,
): OpenEndedQuestionsParsedData["questions"][0] {
  const lines = textOne.split("\n");

  // Initialize result structure
  const result = {
    id: `question-${baseId}`,
    questionNumber: "",
    questionText: undefined as string | undefined,
    imagePath,
    parts: [] as any[],
  };

  let currentPart: any = null;
  let subQuestionCounter = 0;
  let currentLines: string[] = [];
  let currentState: "question" | "part" | "collecting" = "collecting";

  // Helper function to extract marks from text
  const extractMarks = (
    text: string,
  ): { cleanText: string; marks: number | null } => {
    const marksMatch = text.match(/^(.*?)\s*\((\d+)\)\s*$/);
    if (marksMatch) {
      return {
        cleanText: marksMatch[1].replace(/_+/g, "").trim(),
        marks: parseInt(marksMatch[2]),
      };
    }
    return {
      cleanText: text.replace(/_+/g, "").trim(),
      marks: null,
    };
  };

  // Helper function to join collected lines
  const joinLines = (lines: string[]): string => {
    // Preserve original formatting but clean up excessive empty lines
    const result = lines.join("\n");
    return result.replace(/\n{3,}/g, "\n\n").trim();
  };

  // Helper function to create sub-question
  const createSubQuestion = (subLabel: string, text: string, marks: number) => {
    subQuestionCounter++;
    return {
      id: `${baseId}-q-${subQuestionCounter}`,
      subLabel: subLabel,
      questionText: text,
      maxMarks: marks,
    };
  };

  // Helper function to ensure we have a current part
  const ensureCurrentPart = (partLabel: string = "") => {
    if (!currentPart) {
      currentPart = {
        id: `${baseId}-part-${partLabel || "default"}`,
        partLabel: partLabel,
        questionText: undefined,
        subQuestions: [],
      };
      result.parts.push(currentPart);
    }
    return currentPart;
  };

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      // Empty line - preserve for formatting but only if we're already collecting content
      if (currentLines.length > 0) {
        currentLines.push("");
      }
      continue;
    }

    // Check for question number (e.g., "1.", "2.", "3.")
    const questionMatch = trimmedLine.match(/^(\d+)\.\s*(.*)/);
    if (questionMatch && !result.questionNumber) {
      result.questionNumber = questionMatch[1] + ".";
      const remainder = questionMatch[2];

      if (remainder) {
        // Check if remainder starts with a part label
        const partMatch = remainder.match(/^([a-z])\)\s*(.*)/);
        if (partMatch) {
          // Question number followed immediately by part
          currentPart = {
            id: `${baseId}-part-${partMatch[1]}`,
            partLabel: `${partMatch[1]})`,
            questionText: undefined,
            subQuestions: [],
          };
          result.parts.push(currentPart);

          const { cleanText, marks } = extractMarks(partMatch[2]);
          if (marks !== null) {
            // Part has marks, so it has its own answer input
            currentPart.questionText = cleanText;
            currentPart.maxMarks = marks;
          } else if (partMatch[2]) {
            currentLines = [partMatch[2]];
          }
          currentState = "part";
        } else {
          // Question text starts here
          currentLines = [remainder];
          currentState = "question";
        }
      }
      continue;
    }

    // Check for part label (e.g., "a)", "b)", "c)")
    const partMatch = trimmedLine.match(/^([a-z])\)\s*(.*)/);
    if (partMatch) {
      // Save any collected content to previous context
      if (currentLines.length > 0) {
        const collectedText = joinLines(currentLines);
        if (currentState === "question") {
          result.questionText = collectedText;
        } else if (
          currentState === "part" &&
          currentPart &&
          !currentPart.maxMarks
        ) {
          // Only set part question text if part doesn't have its own marks
          currentPart.questionText = collectedText;
        }
        currentLines = [];
      }

      // Create new part
      currentPart = {
        id: `${baseId}-part-${partMatch[1]}`,
        partLabel: `${partMatch[1]})`,
        questionText: undefined,
        subQuestions: [],
      };
      result.parts.push(currentPart);
      currentState = "part";

      const { cleanText, marks } = extractMarks(partMatch[2]);
      if (marks !== null) {
        // Part has marks, so it has its own answer input
        currentPart.questionText = cleanText;
        currentPart.maxMarks = marks;
      } else if (partMatch[2]) {
        currentLines = [partMatch[2]];
      }
      continue;
    }

    // Check for sub-question with roman numerals (e.g., "i.", "ii.", "iii.")
    const subMatch = trimmedLine.match(/^([ivxlc]+)\.\s*(.*)/);
    if (subMatch) {
      // Save any collected content to current part or question
      if (currentLines.length > 0) {
        const collectedText = joinLines(currentLines);
        if (currentState === "question") {
          result.questionText = collectedText;
        } else if (currentState === "part" && currentPart) {
          currentPart.questionText = collectedText;
        }
        currentLines = [];
      }

      ensureCurrentPart();

      // Check if this sub-question has marks immediately
      const { cleanText, marks } = extractMarks(subMatch[2]);
      if (marks !== null) {
        // Complete sub-question on one line
        currentPart.subQuestions.push(
          createSubQuestion(`${subMatch[1]}.`, cleanText, marks),
        );
      } else {
        // Start collecting for this sub-question
        if (subMatch[2]) {
          currentLines = [subMatch[2]];
        }
        currentState = "collecting";
      }
      continue;
    }

    // Check if this line contains marks (potential end of a question)
    const { cleanText, marks } = extractMarks(trimmedLine);

    if (marks !== null) {
      // This line has marks - it's the end of a question
      if (cleanText) {
        currentLines.push(cleanText);
      }

      const questionText = joinLines(currentLines);

      // If we're in "part" state and have collected text, this might be a part-level question
      if (currentState === "part" && currentPart && !currentPart.maxMarks) {
        // This is a part with its own marks
        currentPart.questionText = questionText;
        currentPart.maxMarks = marks;
      } else {
        // This is a sub-question
        ensureCurrentPart();

        // Determine sub-label based on current context
        let subLabel = "";
        if (currentState === "collecting") {
          // Look backwards to find the most recent sub-question marker
          for (let j = i - 1; j >= 0; j--) {
            const prevLine = lines[j].trim();
            const prevSubMatch = prevLine.match(/^([ivxlc]+)\.\s*/);
            if (prevSubMatch) {
              subLabel = `${prevSubMatch[1]}.`;
              break;
            }
          }
        }

        currentPart.subQuestions.push(
          createSubQuestion(subLabel, questionText, marks),
        );
      }

      currentLines = [];
      continue;
    }

    // Regular content line - preserve original spacing for better formatting
    currentLines.push(line);
  }

  // Handle any remaining collected content
  if (currentLines.length > 0) {
    const collectedText = joinLines(currentLines);
    if (currentState === "question") {
      result.questionText = collectedText;
    } else if (currentState === "part" && currentPart) {
      currentPart.questionText = collectedText;
    }
  }

  // Filter out parts with no sub-questions and no marks (empty parts)
  result.parts = result.parts.filter(
    (part) => part.subQuestions.length > 0 || part.maxMarks,
  );

  // If no question number was found, create a default one
  if (!result.questionNumber) {
    result.questionNumber = `${baseId}.`;
  }

  return result;
}

/**
 * Main parser that detects format and uses appropriate parser
 */
export function parseOpenEndedQuestions(
  textOne: string,
  baseId: number,
  imagePath?: string,
): OpenEndedQuestionsParsedData["questions"][0] {
  if (isNewStructuredFormat(textOne)) {
    return parseStructuredFormat(textOne, baseId, imagePath);
  } else {
    return parseLegacyFormat(textOne, baseId, imagePath);
  }
}

/**
 * Transpiler function for open-ended questions
 */
export function openEndedQuestionsTranspiler(
  params: ActivityTranspilerProps,
  // examMode: boolean = true,
): OpenEndedQuestionsParsedData {
  try {
    // Extract the open-ended data from serverQuestions
    const serverData: OpenEndedQuestionsServerData[] =
      params.serverQuestions.map((q: any) => ({
        id: q.id,
        textOne: q.textOne,
        path: getImageUrl(q.path),
      }));

    const questions = serverData.map((item) => {
      const parsed = parseOpenEndedQuestions(item.textOne, item.id, item.path);

      // Validate AI/Answer format consistency
      const validateElement = (element: any, elementType: string) => {
        if (
          element.useAI === false &&
          (!element.acceptedAnswers || element.acceptedAnswers.length === 0)
        ) {
          throw new Error(
            `${elementType} has AI:F but no HINT: provided with acceptable answers (use // to separate multiple answers)`,
          );
        }
      };

      // Validate question level
      if (parsed.maxMarks && parsed.useAI !== undefined) {
        validateElement(parsed, "Question");
      }

      // Validate parts and sub-questions
      parsed.parts.forEach((part) => {
        if (part.maxMarks && part.useAI !== undefined) {
          validateElement(part, "Part");
        }
        part.subQuestions.forEach((sub) => {
          if (sub.useAI !== undefined) {
            validateElement(sub, "Sub-question");
          }
        });
      });

      return parsed;
    });

    // Sort questions by question number
    const sortedQuestions = questions.sort((a, b) => {
      // Extract numeric part from question numbers (e.g., "1." -> 1, "2." -> 2)
      const getQuestionNumber = (questionNumber: string): number => {
        const match = questionNumber.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      };

      const aNum = getQuestionNumber(a.questionNumber);
      const bNum = getQuestionNumber(b.questionNumber);

      return aNum - bNum;
    });

    return {
      title: params.titleDescription?.split("||")[0] || "",
      fontSize: params.titleDescription?.split("||")[1],
      questions: sortedQuestions,
    };
  } catch (error) {
    console.error("Error in open-ended questions transpiler:", error);
    params.setWrongQuestionsFormat?.(true);
    return {
      title: params.titleDescription || "",
      questions: [],
    };
  }
}

export default openEndedQuestionsTranspiler;
