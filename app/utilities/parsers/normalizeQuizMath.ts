// Mathpix sometimes sends prose as letter-spaced TeX. Restore text where its
// intent is clear, without changing formulas or the stored answer values.
const FONT_DECLARATION = /\{\s*\\(?:rm|sf|tt|bf|it|sl|sc|cal|rmfamily|sffamily|ttfamily|bfseries|mdseries|itshape|slshape|scshape|upshape)\s+([^{}]*)\}/g;
const NESTED_PROSE_FONT = /\\(?:mathrm|math(?:rm|sf|tt|bf|normal)|text(?:rm|sf|tt|bf|normal)?)\s*\{\s*\\(?:rm|sf|tt|bf|it|sl|sc)\s+([^{}]*)\}/g;
const FONT_COMMAND = /\\(?:math(?:rm|it|bf|sf|tt|normal|cal|scr|frak|bb|bfit|bfsf)|text(?:rm|sf|tt|bf|it|sc|normal|up|sl|md)?|boldsymbol|pmb|bm|emph)\s*\{([^{}]*)\}/g;
const SUBJECT_PROMPT = /\\mathrm\s*\{\s*\\text\{Make\}\\;([A-Za-z])\s+((?:\\;|~|[A-Za-z ])+)~\s*([A-Za-z])\s*~\s*\}/g;
const TEXT_ONLY = /^(?:[A-Za-z\s~.,:;!?]|\\[;,!: ])+$/;
const MATH_WORDS = new Set(["sin", "cos", "tan", "sec", "csc", "cot", "log", "ln", "exp", "lim", "min", "max"]);
const SHORT_PROSE = new Set(["if", "it", "is", "of", "to", "as", "an", "in", "by", "we", "be"]);

function isProseFontContent(content: string): boolean {
  if (!TEXT_ONLY.test(content)) return false;
  const tokens = content.replace(/\\[;,!: ]|~/g, " ").trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return false;
  const joined = tokens.join("");
  return !MATH_WORDS.has(joined.toLowerCase()) &&
    (joined.length >= 3 || SHORT_PROSE.has(joined.toLowerCase()));
}

function restoreWords(value: string): string {
  const words = value
    .replace(/\\[;,!: ]|~/g, "|")
    .split("|")
    .map((part) => {
      const letters = part.trim().split(/\s+/).filter(Boolean);
      return letters.length > 1 && letters.every((letter) => /^[A-Za-z]$/.test(letter))
        ? letters.join("")
        : part.trim();
    })
    .filter(Boolean)
    .join(" ");

  // This OCR pattern has no separator between its three words.
  return words.replace(/^Abinaryoperation$/i, "A binary operation");
}

function restorePlainProse(source: string): string {
  let result = "";
  let depth = 0;

  for (let index = 0; index < source.length;) {
    const rest = source.slice(index);
    if (rest[0] === "\\") {
      const command = rest.match(/^\\(?:[A-Za-z]+|.)/);
      if (command) {
        result += command[0];
        index += command[0].length;
        continue;
      }
    }
    if (rest[0] === "{") depth += 1;
    if (rest[0] === "}") depth = Math.max(0, depth - 1);

    if (depth === 0 && /[A-Za-z]/.test(rest[0] ?? "")) {
      const phrase = rest.match(/^[A-Za-z]+(?:\s+[A-Za-z]+)*/)?.[0];
      if (phrase) {
        const words = phrase.trim().split(/\s+/);
        if (words.some((word) => word.length > 1 && !MATH_WORDS.has(word.toLowerCase()))) {
          result += `\\text{${phrase.trim()}}`;
          index += phrase.length;
          continue;
        }
      }
    }
    result += rest[0] ?? "";
    index += 1;
  }
  return result;
}

export function normalizeQuizMath(source: string): string {
  const repaired = source
    // Mathpix can nest a font declaration in a font command. Convert the
    // whole expression before the inner declaration loses its outer braces.
    .replace(NESTED_PROSE_FONT, (full, content: string) =>
      isProseFontContent(content) ? `\\text{${restoreWords(content)}}` : full,
    )
    // A TeX escaped space must not become a dangling backslash when the
    // question is later split around =, +, or a comma.
    .replace(/(?<!\\)\\[ \t]+/g, "\\;")
    .replace(/\\\\[ \t]*(?=\\end\{array\})/g, "")
    .replace(/\\(?=\d)/g, "")
    .replace(FONT_DECLARATION, (full, content: string) =>
      isProseFontContent(content) ? `\\text{${restoreWords(content)}}` : full,
    )
    .replace(FONT_COMMAND, (full, content: string) => {
      return isProseFontContent(content) ? `\\text{${restoreWords(content)}}` : full;
    });

  return restorePlainProse(repaired)
    // OCR sometimes wraps a prose fragment in an extra group. Math mode
    // ignores ordinary spaces between that group and the next variable.
    .replace(/\{\s*(\\text\{[^{}]+\})\s*\}/g, "$1")
    .replace(/(\\text\{[^{}]+\})\s+(?=[A-Za-z])/g, "$1\\;")
    .replace(/\b([A-Za-z])\s+(?=\\text\{)/g, "$1\\;")
    .replace(SUBJECT_PROMPT, (full, subject: string, prose: string, formula: string) =>
      restoreWords(prose).toLowerCase() === "the subject of the formula"
        ? `\\text{Make}\\;${subject}\\;\\text{the subject of the formula}\\;${formula}`
        : full,
    );
}
