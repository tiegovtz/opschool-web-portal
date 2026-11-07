/**
 * Pure helpers for the AI teacher's server-side textbook retrieval: decide
 * whether the latest message is a curriculum question and build the search
 * query. No Nuxt imports, so it can be unit-tested with node --test.
 */

const GREETING_OR_ACK_RE =
  /^(hi|hello|hey|habari|mambo|hujambo|shikamoo|salamu|good (morning|afternoon|evening)|asante( sana)?|thanks?( you)?|ok(ay)?|sawa|poa|ndiyo|ndio|yes|no|hapana|sure|cool|nice|great|bye|kwaheri)\b[\s!.?,]*$/i;

const MATH_OR_VISUAL_RE =
  /\b(plot|graph|sketch|draw|chart|differentiate|derivative|integrate|simplify|factori[sz]e|factor|expand|evaluate|solve|calculate|compute)\b/i;

const EQUATION_RE = /[0-9a-z)\]]\s*[=^*/+]\s*[0-9a-z(]|\d\s*[x×÷]\s*\d/i;

const FOLLOW_UP_RE =
  /^(explain( (more|again|that|it))?|tell me more|more|why|how( come)?|continue|go on|give (me )?(an )?example|example|endelea|eleza( zaidi)?|kwa nini|kivipi|mfano)\b/i;

const FOLLOW_UP_FILLER = new Set([
  'explain', 'tell', 'me', 'more', 'again', 'that', 'it', 'this', 'why', 'how', 'come', 'continue',
  'go', 'on', 'give', 'an', 'a', 'example', 'examples', 'please', 'the', 'so', 'and', 'then',
  'endelea', 'eleza', 'zaidi', 'kwa', 'nini', 'kivipi', 'mfano', 'tafadhali', 'hilo', 'hili',
]);

/** True when the message names a topic beyond follow-up filler words. */
export function hasOwnTopic(text: string): boolean {
  const meaningful = (text || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2 && !FOLLOW_UP_FILLER.has(w));
  return meaningful.length >= 1;
}

/** Text of a UI message (parts or legacy content), without attachments. */
export function messageText(message: any): string {
  if (!message) return "";
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part?.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
      .trim();
  }
  return typeof message.content === "string" ? message.content.trim() : "";
}

/** True when the text reads like a question about curriculum content. */
export function isLikelyCurriculumQuestion(text: string): boolean {
  const trimmed = (text || "").trim();
  if (!trimmed) return false;
  if (GREETING_OR_ACK_RE.test(trimmed)) return false;
  if (MATH_OR_VISUAL_RE.test(trimmed)) return false;
  if (EQUATION_RE.test(trimmed) && !/[a-z]{4,}\s+[a-z]{4,}/i.test(trimmed)) return false;
  const words = trimmed.split(/\s+/).filter((word) => /\p{L}{2,}/u.test(word));
  return words.length >= 2;
}

/**
 * Search query for the latest user message. Short follow-ups ("explain more",
 * "kwa nini?") are combined with the previous user question so the search has
 * a topic.
 */
export function buildRetrievalQuery(messages: any[], maxChars = 500): string | null {
  const userTexts = (Array.isArray(messages) ? messages : [])
    .filter((message) => message?.role === "user")
    .map(messageText)
    .filter(Boolean);
  const latest = userTexts[userTexts.length - 1];
  if (!latest) return null;

  const wordCount = latest.split(/\s+/).length;
  // A follow-up has no topic of its own ("explain more", "kwa nini?"). A
  // message such as "Explain how volcanoes form" starts with the same word but
  // names a new topic, so it must be searched on its own, not joined to the
  // previous question.
  if (FOLLOW_UP_RE.test(latest) && wordCount <= 6 && !hasOwnTopic(latest)) {
    const previous = userTexts[userTexts.length - 2];
    if (previous && isLikelyCurriculumQuestion(previous)) {
      return `${previous} ${latest}`.slice(0, maxChars);
    }
    return null;
  }

  if (!isLikelyCurriculumQuestion(latest)) return null;
  return latest.slice(0, maxChars);
}
