import { normalizeQuizMath } from "./normalizeQuizMath.ts";

const DELIMITED_MATH = /\\\(|\\\[|\$\$|(?<!\$)\$[^$\n]+\$|\\begin\{(?:math|displaymath|equation)\}/;
const TEX_COMMAND = /\\(?:[A-Za-z]+|[;,! {}])|\^\s*\{/;
const MATH_SPACING = /~.*[=+\-−*/^]|[=+\-−*/^].*~/;
const TEX_START = /^\s*\{?\s*\\(?:begin|mathrm|mathsf|mathbb|mathbf|mathit|text|frac|dfrac|tfrac|sqrt|left|sum|int|vec|overline|underline)\b/;
const VARIABLE_START = /^\s*[A-Za-z0-9]\s*(?:\\[;,! ]|[=+\-−*/^~])/;
const ESCAPED_SET = /\\\{[\s\S]*?\\\}/g;
const SKIP_MATH_PARENTS = "script, style, noscript, textarea, code, pre, mjx-container, mjx-assistive-mml";

export function hasMathJaxText(source: string): boolean {
  return DELIMITED_MATH.test(source) || TEX_COMMAND.test(source) || MATH_SPACING.test(source);
}

export function formatMathJaxText(source: string): string {
  if (!hasMathJaxText(source)) return source;
  const normalized = normalizeQuizMath(source).trim();
  if (DELIMITED_MATH.test(source)) return normalized;
  return /\\begin\{/.test(source) ? `\\[${normalized}\\]` : `\\(${normalized}\\)`;
}

export type MathJaxSegment = { kind: "text" | "math"; value: string };

export function splitMathJaxText(source: string): MathJaxSegment[] {
  if (/\\\(|\\\[|\$\$/.test(source)) {
    return [{ kind: "math", value: formatMathJaxText(source) }];
  }
  const start = source.indexOf("\\begin{array}");
  if (start === -1) {
    const firstSet = source.match(ESCAPED_SET)?.[0];
    const proseBeforeSet = firstSet ? source.slice(0, source.indexOf(firstSet)) : "";
    if (/\b[A-Za-z]{2,}\s+[A-Za-z]{2,}\b/.test(proseBeforeSet)) {
      const parts: MathJaxSegment[] = [];
      let offset = 0;
      for (const match of source.matchAll(ESCAPED_SET)) {
        const index = match.index ?? 0;
        if (index > offset) {
          const preceding = source.slice(offset, index);
          parts.push({ kind: "text", value: /[A-Za-z0-9]$/.test(preceding) ? `${preceding} ` : preceding });
        }
        parts.push({ kind: "math", value: formatMathJaxText(match[0]) });
        offset = index + match[0].length;
      }
      if (offset < source.length) parts.push({ kind: "text", value: source.slice(offset) });
      return parts;
    }
    return [{ kind: hasMathJaxText(source) ? "math" : "text", value: formatMathJaxText(source) }];
  }

  const endTag = "\\end{array}";
  const end = source.indexOf(endTag, start);
  if (end === -1) {
    return [{ kind: "text", value: source }];
  }

  const parts: MathJaxSegment[] = [];
  const prefix = source.slice(0, start).trim();
  if (prefix) parts.push(...splitMathJaxText(prefix));
  parts.push({ kind: "math", value: formatMathJaxText(source.slice(start, end + endTag.length)) });
  const suffix = source.slice(end + endTag.length).trim();
  if (suffix) parts.push(...splitMathJaxText(suffix));
  return parts;
}

// Notes arrive as HTML. Only wrap text nodes that look like complete raw TeX;
// existing delimited math and prose mixed with math stay with MathJax's scanner.
export function prepareUndelimitedMath(root: Element): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const parent = node.parentElement;
    const source = node.textContent ?? "";
    if (!parent || parent.closest(SKIP_MATH_PARENTS)) continue;
    if (!hasMathJaxText(source) || DELIMITED_MATH.test(source) || /https?:\/\//.test(source)) continue;
    const segments = splitMathJaxText(source);
    if (segments.length > 1) {
      const fragment = document.createDocumentFragment();
      for (const segment of segments) fragment.append(document.createTextNode(segment.value));
      node.replaceWith(fragment);
      continue;
    }
    if (!TEX_START.test(source) && !VARIABLE_START.test(source)) continue;
    node.textContent = formatMathJaxText(source);
  }
}
