/**
 * Utility functions for parsing and segmenting questions with KaTeX, blanks, and highlighted text
 */

export type QuestionSegment = {
  type: "blank" | "text" | "highlighted";
  content: string;
  index: number;
};

/**
 * Parses a question string into segments without breaking KaTeX expressions
 *
 * @param question - The question text to parse
 * @returns Array of segments with their types
 *
 * @example
 * parseQuestionSegments("The answer is $x + y$ and __ is _correct")
 * // Returns:
 * // [
 * //   { type: "text", content: "The answer is $x + y$ and ", index: 0 },
 * //   { type: "blank", content: "__", index: 1 },
 * //   { type: "text", content: " is ", index: 2 },
 * //   { type: "highlighted", content: "correct", index: 3 }
 * // ]
 */
export function parseQuestionSegments(question: string): QuestionSegment[] {
  const segments: QuestionSegment[] = [];
  let currentIndex = 0;
  let segmentIndex = 0;

  // Use regex to find blanks and highlighted text
  const blankRegex = /_{2,}/g;
  const highlightRegex = /\s_(?!_)(\S+)/g;

  // First, find all blanks
  const blanks: Array<{ start: number; end: number; content: string }> = [];
  let match;
  while ((match = blankRegex.exec(question)) !== null) {
    blanks.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
    });
  }

  // Find all highlighted text
  const highlights: Array<{
    start: number;
    end: number;
    content: string;
    fullMatch: string;
  }> = [];
  while ((match = highlightRegex.exec(question)) !== null) {
    highlights.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1] ?? "",
      fullMatch: match[0],
    });
  }

  // Combine and sort all special segments
  const allSpecialSegments = [
    ...blanks.map((b) => ({ ...b, type: "blank" as const })),
    ...highlights.map((h) => ({ ...h, type: "highlighted" as const })),
  ].sort((a, b) => a.start - b.start);

  // Build segments array
  allSpecialSegments.forEach((special) => {
    // Add text before this special segment
    if (currentIndex < special.start) {
      const textContent = question.substring(currentIndex, special.start);
      if (textContent.trim()) {
        segments.push({
          type: "text",
          content: textContent,
          index: segmentIndex++,
        });
      }
    }

    // Add the special segment
    if (special.type === "blank") {
      segments.push({
        type: "blank",
        content: special.content,
        index: segmentIndex++,
      });
    } else {
      segments.push({
        type: "highlighted",
        content: special.content,
        index: segmentIndex++,
      });
    }

    currentIndex = special.end;
  });

  // Add remaining text
  if (currentIndex < question.length) {
    const textContent = question.substring(currentIndex);
    if (textContent.trim()) {
      segments.push({
        type: "text",
        content: textContent,
        index: segmentIndex++,
      });
    }
  }

  return segments;
}

/**
 * Calculates the width for a blank input based on underscore count and screen width
 *
 * @param underscoreCount - Number of underscores in the blank
 * @param screenWidth - Current screen width in pixels
 * @returns Object containing calculated width and whether it's a two-underscore blank
 */
export function calculateBlankWidth(
  underscoreCount: number,
  screenWidth: number,
): {
  calculatedWidth: number;
  isTwoUnderscores: boolean;
  baseWidth: number;
  widthMultiplier: number;
} {
  const isTwoUnderscores = underscoreCount === 2;
  let baseWidth;
  let widthMultiplier;

  if (isTwoUnderscores) {
    baseWidth = 60; // Half of the original base width
    widthMultiplier = 1;
  } else {
    // For three or more underscores (multiples of 3)
    baseWidth = screenWidth > 448 ? 120 : 100;
    widthMultiplier = underscoreCount / 3;
  }

  const calculatedWidth = baseWidth * widthMultiplier;

  return {
    calculatedWidth,
    isTwoUnderscores,
    baseWidth,
    widthMultiplier,
  };
}

/** True when a `cua(...)` value has a non-empty digit part in every column. */
export function isCompoundCuaAnswerFilled(value: string): boolean {
  const trimmed = (value ?? "").trim();
  const m = trimmed.match(/^cua\s*\(\s*(.*?)\s*\)\s*$/i);
  if (!m) return trimmed.length > 0;
  const inner = m[1] ?? "";
  const sep = inner.includes("|") ? "|" : ",";
  const parts = inner.split(sep).map((p) => p.trim());
  const nonEmpty = parts.filter((p) => p.length > 0);
  if (nonEmpty.length === 0) return false;
  return nonEmpty.every((part) => {
    const vm = part.match(/^(\d+)([a-zA-Z]*)$/);
    return vm != null && vm[1].length > 0;
  });
}
