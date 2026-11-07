export type OrderedQuestionSegment =
  | { type: "text"; text: string; key: string }
  | { type: "blank"; index: number; key: string };

export type OrderedQuestionBlock =
  | { type: "paragraph"; segments: OrderedQuestionSegment[]; key: string }
  | {
      type: "ordered-item";
      marker: string;
      segments: OrderedQuestionSegment[];
      key: string;
    };

const orderedMarkerPattern =
  /(?<![A-Za-z0-9])(\(\s*(?:\d+|[A-Za-z]|[ivxlcdmIVXLCDM]+)\s*\)\.?\s*|(?:\d+|[A-Za-z]|[ivxlcdmIVXLCDM]+)[.)]\s+)/g;

const splitSegmentsWithBlanks = (text: string, blankStartIndex = 0) => {
  const parts = text.split(/(_\$blank)/);
  let blankIndex = blankStartIndex;
  const segments: OrderedQuestionSegment[] = [];

  parts.forEach((part, index) => {
    if (!part) return;

    if (part === "_$blank") {
      segments.push({ type: "blank", index: blankIndex, key: `blank-${blankIndex}` });
      blankIndex += 1;
      return;
    }

    segments.push({ type: "text", text: part, key: `text-${blankIndex}-${index}` });
  });

  return { segments, nextBlankIndex: blankIndex };
};

export const parseOrderedQuestionBlocks = (
  rawQuestion: string,
): OrderedQuestionBlock[] | null => {
  const matches = Array.from(rawQuestion.matchAll(orderedMarkerPattern));
  if (matches.length < 2) return null;

  const blocks: OrderedQuestionBlock[] = [];
  let blankIndex = 0;

  matches.forEach((match, index) => {
    const markerStart = match.index ?? 0;
    const markerText = match[0] ?? "";
    const contentStart = markerStart + markerText.length;
    const nextMarkerStart =
      index + 1 < matches.length
        ? (matches[index + 1]?.index ?? rawQuestion.length)
        : rawQuestion.length;

    if (index === 0) {
      const introText = rawQuestion.slice(0, markerStart);
      if (introText.trim()) {
        const parsed = splitSegmentsWithBlanks(introText, blankIndex);
        blankIndex = parsed.nextBlankIndex;
        blocks.push({ type: "paragraph", segments: parsed.segments, key: "paragraph-intro" });
      }
    }

    let itemText = rawQuestion.slice(contentStart, nextMarkerStart);
    const trailingBreakMatch = itemText.match(/^(.*?)(\n\s*\n+)$/s);
    let trailingText = "";

    if (trailingBreakMatch) {
      itemText = trailingBreakMatch[1] ?? "";
      trailingText = trailingBreakMatch[2] ?? "";
    }

    const parsed = splitSegmentsWithBlanks(itemText, blankIndex);
    blankIndex = parsed.nextBlankIndex;
    blocks.push({
      type: "ordered-item",
      marker: markerText.trim(),
      segments: parsed.segments,
      key: `ordered-item-${index}`,
    });

    if (index === matches.length - 1 && trailingText.trim()) {
      const parsedTrailing = splitSegmentsWithBlanks(trailingText, blankIndex);
      blankIndex = parsedTrailing.nextBlankIndex;
      blocks.push({
        type: "paragraph",
        segments: parsedTrailing.segments,
        key: "paragraph-outro",
      });
    }
  });

  return blocks;
};
