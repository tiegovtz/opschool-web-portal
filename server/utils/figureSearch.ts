/**
 * Find textbook figures by meaning, not by exact topic or chapter name.
 *
 * The AI teacher used to match the model's `topic`/`chapter` text against each
 * figure's topic and chapter names. A student asking for a "hand lens" got
 * nothing even though the book has "A simple microscope" (topic "Optical
 * instruments"), because none of those words overlap. This module ranks
 * figures by how well the student's words match each figure's description,
 * caption, topic and chapter, using
 *
 *   1. a small synonym list for terms students use differently from the book,
 *   2. word overlap, and
 *   3. embedding similarity (when an embedding function is available).
 *
 * Everything here is pure except the optional `embed` function, so it can be
 * tested without a network.
 */

export interface SearchableFigure {
  shortcode: string;
  description?: string;
  alt?: string;
  caption?: string;
  topic?: string;
  chapter?: string;
  topicName?: string;
  chapterName?: string;
  subject?: string;
  category?: string;
}

export interface FigureMatch<T extends SearchableFigure = SearchableFigure> {
  figure: T;
  score: number;
}

/** Terms students use that the books call something else (and vice versa). */
const SYNONYM_GROUPS: string[][] = [
  ['hand lens', 'magnifying glass', 'magnifier', 'simple microscope', 'convex lens'],
  ['microscope', 'light microscope', 'compound microscope'],
  ['cell', 'cells', 'seli'],
  ['photosynthesis', 'usanisinuru'],
  ['heart', 'moyo', 'cardiac'],
  ['kidney', 'figo'],
  ['lung', 'lungs', 'mapafu', 'respiratory system'],
  ['stomata', 'stoma', 'leaf pores'],
  ['food chain', 'food web', 'mnyororo wa chakula'],
  ['circuit', 'electric circuit', 'saketi'],
  ['periodic table', 'jedwali la vipengele'],
];

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'show', 'figure', 'figures', 'image', 'images', 'picture',
  'pictures', 'diagram', 'diagrams', 'me', 'can', 'you', 'please', 'give', 'about', 'what', 'how',
  'form', 'of', 'in', 'on', 'to', 'is', 'are', 'a', 'an', 'my', 'this', 'that', 'it',
  'kwa', 'na', 'ya', 'wa', 'la', 'katika', 'nionyeshe', 'picha', 'mchoro',
]);

function words(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Expand a query with every synonym group it mentions. */
export function expandQuery(query: string): string {
  const q = normalize(query);
  const extra: string[] = [];
  for (const group of SYNONYM_GROUPS) {
    if (group.some((term) => q.includes(term))) {
      extra.push(...group.filter((term) => !q.includes(term)));
    }
  }
  return extra.length ? `${query} ${extra.join(' ')}` : query;
}

function figureText(f: SearchableFigure): string {
  return [
    f.description,
    f.caption,
    f.alt,
    f.topic || f.topicName,
    f.chapter || f.chapterName,
    f.subject || f.category,
  ]
    .filter(Boolean)
    .join(' . ');
}

/** 0..1 share of the query's meaningful words found in the figure text. */
export function lexicalScore(query: string, f: SearchableFigure): number {
  const qWords = new Set(words(expandQuery(query)));
  if (qWords.size === 0) return 0;
  const hay = normalize(figureText(f));
  const hayWords = new Set(hay.split(' '));
  let hits = 0;
  for (const w of qWords) {
    if (hayWords.has(w) || (w.length > 4 && hay.includes(w))) hits += 1;
  }
  // Phrase hits (e.g. "simple microscope") count extra: they are specific.
  let phraseBonus = 0;
  const qNorm = normalize(expandQuery(query));
  for (const group of SYNONYM_GROUPS) {
    for (const term of group) {
      if (term.includes(' ') && qNorm.includes(term) && hay.includes(term)) phraseBonus = 0.4;
    }
  }
  return Math.min(1, hits / Math.max(2, qWords.size) + phraseBonus);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export type EmbedFn = (texts: string[]) => Promise<number[][]>;

const embeddingCache = new Map<string, number[]>();
const EMBED_BATCH = 96;

async function embedAll(texts: string[], embed: EmbedFn): Promise<number[][]> {
  const missing = [...new Set(texts.filter((t) => !embeddingCache.has(t)))];
  for (let i = 0; i < missing.length; i += EMBED_BATCH) {
    const batch = missing.slice(i, i + EMBED_BATCH);
    const vectors = await embed(batch);
    batch.forEach((text, k) => embeddingCache.set(text, vectors[k] ?? []));
  }
  return texts.map((t) => embeddingCache.get(t) ?? []);
}

export interface SearchOptions {
  limit?: number;
  /** Minimum combined score to count as a match (0..1). */
  minScore?: number;
  embed?: EmbedFn;
}

/**
 * Rank figures for `query`. Returns the best matches above `minScore`,
 * best first. Never throws on embedding failure: it falls back to words only.
 */
export async function searchFigures<T extends SearchableFigure>(
  query: string,
  figures: T[],
  options: SearchOptions = {},
): Promise<FigureMatch<T>[]> {
  const { limit = 6, minScore = 0.35, embed } = options;
  const q = (query || '').trim();
  if (!q || figures.length === 0) return [];

  const lexical = figures.map((f) => lexicalScore(q, f));
  let semantic: number[] | null = null;

  if (embed) {
    try {
      const texts = figures.map(figureText);
      const queryVec = (await embedAll([expandQuery(q)], embed))[0] ?? [];
      const figureVecs = await embedAll(texts, embed);
      semantic = figureVecs.map((v) => (v.length && queryVec.length ? cosine(queryVec, v) : 0));
    } catch (error) {
      console.warn('[figureSearch] embeddings unavailable, using word matching only:', (error as Error).message);
    }
  }

  const matches = figures.map((figure, i) => {
    const lex = lexical[i] ?? 0;
    // Cosine similarity of short texts sits around 0.2-0.7; rescale so 0.3
    // means "unrelated" and 0.6 means "clearly the same thing".
    const sem = semantic ? Math.max(0, Math.min(1, ((semantic[i] ?? 0) - 0.3) / 0.35)) : 0;
    const score = semantic ? Math.max(lex, 0.35 * lex + 0.75 * sem) : lex;
    return { figure, score };
  });

  return matches
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Embedding function backed by the OpenAI REST API. */
export function openAiEmbedder(apiKey: string, model = 'text-embedding-3-small'): EmbedFn {
  return async (texts) => {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: texts.map((t) => t.slice(0, 2000)) }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      throw new Error(`embeddings request failed (${response.status})`);
    }
    const json = (await response.json()) as { data: Array<{ index: number; embedding: number[] }> };
    return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  };
}

export function _clearFigureEmbeddingCache(): void {
  embeddingCache.clear();
}
