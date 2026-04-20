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
 * // `_word` after whitespace OR at line/string start is highlighted; only 2+ underscores is a blank.
 * parseQuestionSegments("gari _dogo ___")
 * // text "gari", highlighted "dogo", blank "___"
 * parseQuestionSegments("_Dagaa ni samaki ___")
 * // highlighted "Dagaa", text " ni samaki ", blank "___"
 */
export function parseQuestionSegments(question: string): QuestionSegment[] {
  const segments: QuestionSegment[] = [];
  let currentIndex = 0;
  let segmentIndex = 0;

  // Blanks: two or more consecutive underscores only. A single `_` before a word is the highlight
  // marker: either after whitespace or at the start of the string / a new line (m flag).
  const blankRegex = /_{2,}/g;
  const highlightRegex = /(?:^|\s)_(?!_)(\S+)/gm;

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

const TEXT_MACRO_PREFIX = "\\text{";

/**
 * Reads `{...}` starting at `openBraceIndex` (must be `{`), respecting nested `{}` and `\\` escapes.
 */
function readBalancedBraces(
  s: string,
  openBraceIndex: number,
): { closeIndex: number; inner: string } | null {
  if (s[openBraceIndex] !== "{") return null;
  let depth = 1;
  let i = openBraceIndex + 1;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "\\") {
      i += 2;
      if (i > s.length) break;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return { closeIndex: i, inner: s.slice(openBraceIndex + 1, i) };
      }
    }
    i++;
  }
  return null;
}

/**
 * Long `\\text{...}` runs are one MathJax box and do not wrap. Rewrite to
 * `\\text{word1} \\text{word2} ...` (spaces between atoms) so callers can split
 * into multiple inline chunks; MathJax 3 CHTML does not wrap on `\\allowbreak` here.
 * Only transforms arguments with enough length and at least two words; otherwise returns unchanged.
 */
export function injectLineBreaksInMathText(latex: string): string {
  if (!latex || latex.length < TEXT_MACRO_PREFIX.length + 8) return latex;

  const MIN_INNER_LEN = 28;
  let out = "";
  let pos = 0;

  while (pos < latex.length) {
    const hit = latex.indexOf(TEXT_MACRO_PREFIX, pos);
    if (hit === -1) {
      out += latex.slice(pos);
      break;
    }
    out += latex.slice(pos, hit);
    const openBrace = hit + TEXT_MACRO_PREFIX.length - 1;
    const parsed = readBalancedBraces(latex, openBrace);
    if (!parsed) {
      out += latex.slice(hit);
      break;
    }
    const { closeIndex, inner } = parsed;
    const originalFull = latex.slice(hit, closeIndex + 1);
    out += rebuildTextWithAllowBreaks(inner, originalFull, MIN_INNER_LEN);
    pos = closeIndex + 1;
  }

  return out;
}

function rebuildTextWithAllowBreaks(
  inner: string,
  originalFull: string,
  minInnerLen: number,
): string {
  const normalized = inner.replace(/\s+/g, " ").trim();
  if (normalized.length < minInnerLen || !/\s/.test(normalized)) {
    return originalFull;
  }
  const words = normalized.split(" ").filter((w) => w.length > 0);
  if (words.length < 2) return originalFull;
  // MathJax 3 does not honor \\allowbreak for CHTML wrapping. Use spaces between
  // short \\text{...} atoms so the layout can split into separate inline-math chunks
  // (see texChunksForMathJaxInline).
  return words.map((w) => `\\text{${w}}`).join(" ");
}

/**
 * Split TeX at whitespace that is outside of `{...}` groups so each piece can be
 * typeset as its own `\\(...\\)` — MathJax 3 wraps between chunks like normal inline content.
 */
export function splitTexAtTopLevelWhitespace(tex: string): string[] {
  const s = tex.trim();
  if (!s) return [];
  const chunks: string[] = [];
  let depth = 0;
  let buf = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "\\") {
      buf += ch + (s[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (ch === "{") {
      depth++;
      buf += ch;
      continue;
    }
    if (ch === "}") {
      depth--;
      buf += ch;
      continue;
    }
    if (depth === 0 && /\s/.test(ch)) {
      if (buf.trim()) chunks.push(buf.trim());
      buf = "";
      while (i + 1 < s.length && /\s/.test(s[i + 1] ?? "")) i++;
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [s];
}

/**
 * 1) Split long `\\text{...}` into `\\text{word} \\text{next} ...`
 * 2) Split the result at top-level spaces into short inline-math fragments for separate MathJax runs.
 *
 * Skips (2) when `\\begin{...}` is present — top-level spaces can appear inside environments
 * (e.g. `\\begin{array}{ccc} ...`) and splitting would break TeX; `mathJaxWrap` still uses
 * `\\[...\\]` for arrays in the single-chunk path.
 */
export function texChunksForMathJaxInline(latex: string): string[] {
  const processed = injectLineBreaksInMathText(latex);
  if (/\\begin\{/.test(processed)) {
    return [processed];
  }
  // No long-\text rewrite: keep one MathJax run so numbers and \times stay together.
  if (processed === latex) {
    return [processed];
  }
  const parts = splitTexAtTopLevelWhitespace(processed);
  return parts.length ? parts : [processed];
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
  const isSingleOrDoubleUnderscore = underscoreCount <= 2;
  let baseWidth;
  let widthMultiplier;

  if (isSingleOrDoubleUnderscore) {
    baseWidth = 60; // Half of the original base width
    widthMultiplier = 1;
  } else {
    // For three or more underscores (multiples of 3)
    if (screenWidth <= 480) {
      baseWidth = 52;
    } else if (screenWidth <= 640) {
      baseWidth = 72;
    } else {
      baseWidth = screenWidth > 448 ? 120 : 100;
    }
    widthMultiplier = underscoreCount / 3;
  }

  let calculatedWidth = baseWidth * widthMultiplier;

  // Long `___` runs can exceed viewport width on phones and force awkward vertical scroll;
  // cap blank width on narrow screens while keeping tablet/desktop behavior close to before.
  if (!isSingleOrDoubleUnderscore && screenWidth <= 640) {
    const maxBlankPx =
      screenWidth <= 400
        ? 118
        : screenWidth <= 480
          ? 132
          : Math.min(172, Math.floor(screenWidth * 0.26));
    calculatedWidth = Math.min(calculatedWidth, maxBlankPx);
  }

  return {
    calculatedWidth,
    isTwoUnderscores: isSingleOrDoubleUnderscore,
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
