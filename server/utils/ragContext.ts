/**
 * Pure helpers that turn Insights `/rag/query` results into prompt context and
 * citations. No Nuxt/Nitro imports, so this file can be unit-tested with
 * `node --experimental-strip-types --test`.
 */

export type RagResult = {
  content?: string | null;
  parentContent?: string | null;
  citation?: string | null;
  parentCitation?: string | null;
  source?: string | null;
  score?: number | null;
  chunkType?: string | null;
};

export type RagCitation = {
  book: string;
  chapter: string;
};

export type BuildRagContextOptions = {
  /** Total character budget for the joined context. */
  maxChars?: number;
  /**
   * Per-passage cap. Parent passages longer than this are replaced by the child
   * `content`, and any passage still longer is truncated at a boundary.
   */
  maxParentChars?: number;
  /** Stop trying to add passages once less than this much budget remains. */
  minPassageChars?: number;
};

export type RagContextResult = {
  context: string;
  citations: RagCitation[];
  passagesUsed: number;
};

export const DEFAULT_RAG_CONTEXT_MAX_CHARS = 12000;
export const DEFAULT_RAG_MAX_PARENT_CHARS = 4000;
const DEFAULT_MIN_PASSAGE_CHARS = 200;
const SEPARATOR = "\n\n---\n\n";
const ELLIPSIS = "…";

/** Content chunks first, then by score (highest first). */
export function sortRagResults<T extends RagResult>(results: T[]): T[] {
  return [...results].sort((a, b) => {
    if (a.chunkType === "content" && b.chunkType !== "content") return -1;
    if (a.chunkType !== "content" && b.chunkType === "content") return 1;
    return (b.score || 0) - (a.score || 0);
  });
}

/**
 * Cut `text` to at most `maxChars` characters (ellipsis included), preferring a
 * paragraph break, then a sentence end, then a word boundary in the last part
 * of the allowed range.
 */
export function truncateAtBoundary(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  if (maxChars <= ELLIPSIS.length) return "";

  const limit = maxChars - ELLIPSIS.length;
  const window = trimmed.slice(0, limit);
  // Only accept a boundary that keeps most of the allowed text.
  const minCut = Math.floor(limit * 0.6);

  const paragraph = window.lastIndexOf("\n\n");
  if (paragraph >= minCut) return window.slice(0, paragraph).trimEnd() + ELLIPSIS;

  const sentence = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("? "),
    window.lastIndexOf("! "),
    window.lastIndexOf(".\n"),
  );
  if (sentence >= minCut) return window.slice(0, sentence + 1).trimEnd() + ELLIPSIS;

  const space = window.lastIndexOf(" ");
  if (space >= minCut) return window.slice(0, space).trimEnd() + ELLIPSIS;

  return window.trimEnd() + ELLIPSIS;
}

/**
 * Pick the passage text for one result: a reasonably sized parent, else the
 * child. Whatever is picked is capped at `maxPassageChars` so one long passage
 * cannot take the whole budget from the other hits.
 */
function pickPassageText(result: RagResult, maxPassageChars: number): string {
  const parent = (result.parentContent || "").trim();
  const child = (result.content || "").trim();
  if (parent && parent.length <= maxPassageChars) return parent;
  const text = child || parent;
  return text ? truncateAtBoundary(text, maxPassageChars) : "";
}

function stripPageSuffix(value: string): string {
  return value.replace(/\s*\((?:page|pages|part)\s[^)]*\)\s*$/i, "").trim();
}

/** Derive "book" and "chapter" from Insights' source and citation strings. */
export function toRagCitation(result: RagResult): RagCitation | null {
  const citation = (result.parentCitation || result.citation || "").trim();
  const dash = citation.indexOf(" - ");
  const book =
    (result.source || "").trim() || (dash > 0 ? citation.slice(0, dash).trim() : citation);
  const chapter = dash > 0 ? stripPageSuffix(citation.slice(dash + 3)) : "";
  if (!book) return null;
  return { book, chapter };
}

export function collectRagCitations(results: RagResult[]): RagCitation[] {
  const seen = new Set<string>();
  const citations: RagCitation[] = [];
  for (const result of results) {
    const citation = toRagCitation(result);
    if (!citation) continue;
    const key = `${citation.book}\u0000${citation.chapter}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push(citation);
  }
  return citations;
}

/**
 * Build the prompt context from RAG results within a character budget.
 *
 * A passage that does not fit is truncated to the remaining budget instead of
 * ending the loop, so one long chapter can never turn a real hit into an empty
 * context. Duplicate passages (children that share a parent) are skipped.
 */
export function buildRagContext(
  results: RagResult[],
  options: BuildRagContextOptions = {},
): RagContextResult {
  const maxChars = options.maxChars ?? DEFAULT_RAG_CONTEXT_MAX_CHARS;
  const maxParentChars = options.maxParentChars ?? DEFAULT_RAG_MAX_PARENT_CHARS;
  const minPassageChars = options.minPassageChars ?? DEFAULT_MIN_PASSAGE_CHARS;

  const parts: string[] = [];
  const used: RagResult[] = [];
  const seenTexts = new Set<string>();
  let total = 0;

  const valid = (Array.isArray(results) ? results : []).filter(
    (result): result is RagResult => !!result && typeof result === "object",
  );

  for (const result of sortRagResults(valid)) {
    const text = pickPassageText(result, maxParentChars);
    if (!text) continue;
    if (seenTexts.has(text)) continue;

    const citation = (result.citation || result.parentCitation || "").trim() || "Unknown source";
    const source = (result.source || "").trim();
    const header = `[${[source, citation].filter(Boolean).join(" | ")}]\n`;

    const separatorCost = parts.length > 0 ? SEPARATOR.length : 0;
    const remaining = maxChars - total - separatorCost - header.length;
    if (remaining < minPassageChars) {
      // Not enough room for a useful passage; a shorter later one may still fit.
      if (remaining <= 0) break;
      continue;
    }

    const body = text.length > remaining ? truncateAtBoundary(text, remaining) : text;
    if (!body) continue;

    const chunk = header + body;
    parts.push(chunk);
    used.push(result);
    seenTexts.add(text);
    total += separatorCost + chunk.length;
  }

  return {
    context: parts.join(SEPARATOR),
    citations: collectRagCitations(used),
    passagesUsed: parts.length,
  };
}
