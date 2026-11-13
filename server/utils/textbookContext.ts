type TextbookMatch = {
  id?: string;
  content?: string;
  parentContent?: string;
  citation?: string;
  parentCitation?: string;
  source?: string;
  score?: number;
  chunkType?: string;
};

// Keep the existing prompt budget, including headers and separators. Large
// chapters must never evict all the evidence returned by retrieval.
export const TEXTBOOK_CONTEXT_CHARS = 5000;

function excerpt(text: string, limit: number, query: string): string {
  if (text.length <= limit) return text;
  if (limit < 8) return text.slice(0, limit);
  const words = [...new Set(query.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || [])]
    .filter(word => !['what', 'does', 'explain', 'the', 'and', 'how', 'are'].includes(word));
  const lower = text.toLowerCase();
  const positions = words.map(word => lower.indexOf(word)).filter(index => index >= 0);
  // Centre an oversized passage on query terms instead of always taking the
  // chapter introduction. Preserve the original wording of the excerpt.
  const anchor = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, Math.min(anchor - Math.floor(limit / 4), text.length - limit + 6));
  return `${start ? '… ' : ''}${text.slice(start, start + limit - 6).trim()} …`;
}

export function buildTextbookContext(results: TextbookMatch[], query = '', maxChars = TEXTBOOK_CONTEXT_CHARS): string {
  const seen = new Set<string>();
  const matches = [...results]
    .sort((a, b) => Number(b.chunkType === 'content') - Number(a.chunkType === 'content') || (b.score || 0) - (a.score || 0))
    .filter(result => {
      const text = result.content?.trim() || result.parentContent?.trim() || '';
      const key = `${result.source || ''}\n${text}`;
      if (!text || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);

  const parts: string[] = [];
  let used = 0;
  const separator = '\n\n---\n\n';
  for (const [index, result] of matches.entries()) {
    const remaining = maxChars - used - (parts.length ? separator.length : 0);
    const allowance = Math.floor(remaining / (matches.length - index));
    if (allowance < 32) continue;
    const label = [result.source, result.citation || result.parentCitation].filter(Boolean).join(' | ') || 'Textbook';
    const header = `[${label.slice(0, Math.min(240, Math.floor(allowance / 3)))}]\n`;
    const text = result.content?.trim() || result.parentContent?.trim() || '';
    const part = header + excerpt(text, allowance - header.length, query);
    used += part.length + (parts.length ? separator.length : 0);
    parts.push(part);
  }
  return parts.join(separator);
}
