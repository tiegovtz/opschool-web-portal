import apiDocs from "~/utilities/apiDocs";
import { truncateAtBoundary } from "../../utils/ragContext";
import { readSessionToken } from "../../utils/sessionAuth";
import { classifyChatError, logChatError, type ChatErrorCode } from "../../utils/chatErrors";

/** Chapter text budget; the teaching instructions are never cut. */
const CHAPTER_CONTENT_MAX_CHARS = 24000;
const MAX_HISTORY_MESSAGES = 20; // 10 user + 10 assistant messages
const OPENAI_TIMEOUT_MS = 45000;

type UiLanguage = "english" | "kiswahili";

const ERROR_MESSAGES: Record<string, Record<UiLanguage, string>> = {
  method: { english: "Method Not Allowed", kiswahili: "Njia hii hairuhusiwi" },
  signIn: {
    english: "Please sign in to use the AI Subject Teacher.",
    kiswahili: "Tafadhali ingia ili kutumia Mwalimu wa Somo wa AI.",
  },
  badBody: {
    english: "The request could not be read. Please reload the page and try again.",
    kiswahili: "Ombi halikuweza kusomwa. Tafadhali pakia ukurasa upya kisha ujaribu tena.",
  },
  missingFields: {
    english: "Please type a question. If this keeps happening, reload the page.",
    kiswahili: "Tafadhali andika swali. Hali hii ikiendelea, pakia ukurasa upya.",
  },
  sessionExpired: {
    english: "Your session has expired. Please sign in again.",
    kiswahili: "Muda wako wa kuingia umeisha. Tafadhali ingia tena.",
  },
  chapterNotFound: {
    english: "This chapter could not be found. Please reload the page.",
    kiswahili: "Sura hii haikupatikana. Tafadhali pakia ukurasa upya.",
  },
  chapterFetchFailed: {
    english: "The chapter content could not be loaded right now. Please try again in a few minutes.",
    kiswahili: "Maudhui ya sura hayakuweza kupakiwa kwa sasa. Tafadhali jaribu tena baada ya dakika chache.",
  },
  chapterEmpty: {
    english: "This chapter has no text content for the AI teacher to use yet.",
    kiswahili: "Sura hii bado haina maandishi ambayo Mwalimu wa AI anaweza kutumia.",
  },
  quota: {
    english: "The AI service has reached its usage limit. Please try again later.",
    kiswahili: "Huduma ya AI imefikia kikomo cha matumizi. Tafadhali jaribu tena baadaye.",
  },
  rate_limit: {
    english: "The AI service is busy. Please wait a minute and try again.",
    kiswahili: "Huduma ya AI ina shughuli nyingi. Tafadhali subiri dakika moja kisha ujaribu tena.",
  },
  validation: {
    english: "This question could not be processed. Try a shorter question.",
    kiswahili: "Swali hili halikuweza kushughulikiwa. Jaribu swali fupi zaidi.",
  },
  provider: {
    english: "AI Subject Teacher is temporarily unavailable. Please try again in a few minutes.",
    kiswahili: "Mwalimu wa Somo wa AI hapatikani kwa muda huu. Tafadhali jaribu tena baada ya muda mfupi.",
  },
};

function localizedError(
  statusCode: number,
  key: keyof typeof ERROR_MESSAGES,
  language: UiLanguage,
  code: ChatErrorCode | "chapter",
) {
  return createError({
    statusCode,
    message: ERROR_MESSAGES[key]![language],
    data: { code },
  });
}

/**
 * Keep the latest messages, and drop the trailing user turn when it is the
 * current question (the client includes it in the history as well).
 */
function buildHistory(conversationHistory: unknown, question: string) {
  if (!Array.isArray(conversationHistory)) return [];
  const history = conversationHistory
    .filter(
      (msg: any) =>
        (msg?.role === "user" || msg?.role === "assistant") &&
        typeof msg.content === "string" &&
        msg.content.trim(),
    )
    .map((msg: any) => ({ role: msg.role as "user" | "assistant", content: msg.content as string }));
  const last = history[history.length - 1];
  if (last && last.role === "user" && last.content.trim() === question.trim()) {
    history.pop();
  }
  return history.slice(-MAX_HISTORY_MESSAGES);
}

/**
 * Extract plain text from HTML content, removing all HTML tags and formatting
 */
function extractTextContent(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // Remove HTML comments
  let text = html.replace(/<!--[\s\S]*?-->/g, "");

  // Remove script and style tags with their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Block-level boundaries become paragraph breaks so long chapters can be
  // shortened at a paragraph instead of mid-sentence.
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote|table|ul|ol)>/gi, "\n\n");

  // Remove HTML tags but preserve text content
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");

  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  text = text.replace(/&#x([a-f\d]+);/gi, (match, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  // Clean up whitespace: collapse spaces within lines, keep paragraph breaks
  text = text
    .replace(/[ \t\f\v\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Remove any remaining special characters that might be from parsed content
  // (like expPackage, model tags, etc.)
  text = text.replace(/expPackage="[^"]*"/g, "");
  text = text.replace(/model="[^"]*"/g, "");

  return text;
}

export default defineEventHandler(async (event) => {
  let body: any;
  try {
    body = await readBody(event);
  } catch {
    body = undefined;
  }

  const { question, chapterId, conversationHistory, uiLanguage } = body || {};
  const preferredUiLanguage: UiLanguage =
    typeof uiLanguage === "string" && uiLanguage.trim().toLowerCase() === "kiswahili"
      ? "kiswahili"
      : "english";

  if (event.method !== "POST") {
    throw localizedError(405, "method", preferredUiLanguage, "validation");
  }
  if (!body || typeof body !== "object") {
    throw localizedError(400, "badBody", preferredUiLanguage, "validation");
  }

  // The ai-auth middleware has already validated this token.
  const auth_token = readSessionToken(event);
  if (!auth_token) {
    throw localizedError(401, "signIn", preferredUiLanguage, "auth");
  }

  if (typeof question !== "string" || !question.trim() || typeof chapterId !== "string" || !chapterId.trim()) {
    throw localizedError(400, "missingFields", preferredUiLanguage, "validation");
  }

  // 1. Fetch chapter content/notes
  let chapterResponse: Response;
  try {
    chapterResponse = await fetch(
      apiDocs.chapters.getChapterId.replaceAll(":id", encodeURIComponent(chapterId)),
      {
        method: "GET",
        headers: { Authorization: `Bearer ${auth_token}` },
        signal: AbortSignal.timeout(15000),
      }
    );
  } catch (error: any) {
    console.error("[AI Subject Teacher] Chapter fetch failed", {
      chapterId,
      message: error?.message || String(error),
    });
    throw localizedError(503, "chapterFetchFailed", preferredUiLanguage, "chapter");
  }

  if (!chapterResponse.ok) {
    console.error("[AI Subject Teacher] Chapter fetch returned an error", {
      chapterId,
      status: chapterResponse.status,
    });
    if (chapterResponse.status === 401 || chapterResponse.status === 403) {
      throw localizedError(401, "sessionExpired", preferredUiLanguage, "auth");
    }
    if (chapterResponse.status === 404) {
      throw localizedError(404, "chapterNotFound", preferredUiLanguage, "chapter");
    }
    throw localizedError(503, "chapterFetchFailed", preferredUiLanguage, "chapter");
  }

  const chapterData: any = await chapterResponse.json().catch(() => null);

  // Extract raw content (may contain HTML)
  const rawContent =
    chapterData?.content ||
    chapterData?.notes ||
    chapterData?.description ||
    "";

  // Extract only text content, removing HTML tags and formatting
  const fullChapterContent = extractTextContent(rawContent);
  const chapterName = chapterData?.name || "this competence";

  if (!fullChapterContent) {
    throw localizedError(422, "chapterEmpty", preferredUiLanguage, "chapter");
  }

  // Only the chapter text is shortened (at a paragraph boundary); the
  // instructions below always stay whole.
  const chapterWasShortened = fullChapterContent.length > CHAPTER_CONTENT_MAX_CHARS;
  const chapterContent = chapterWasShortened
    ? `${truncateAtBoundary(fullChapterContent, CHAPTER_CONTENT_MAX_CHARS)}\n\n[Only the first part of this chapter is included here.]`
    : fullChapterContent;

  // 2. Prepare prompt with strict instructions
  const systemPrompt = `You are AI Subject Teacher, a friendly and experienced teacher helping Tanzanian students. Your goal is to help students understand and learn about the current competence/chapter they are studying.

*** LANGUAGE RULE ***
- The student's current interface language is ${preferredUiLanguage}.
- Respond in ${preferredUiLanguage === "kiswahili" ? "Kiswahili" : "English"} by default so your explanation matches the active learning mode.
- If the student explicitly asks for a translation or asks you to explain in the other language, you may switch for that request.

*** NON-NEGOTIABLE - CHAPTER SCOPE ONLY ***
You may ONLY answer questions that are directly about this chapter: "${chapterName}". You must REFUSE to answer any question that is:
- About a different subject (e.g. if this chapter is "Concept of Physics" and the student asks "What is biology?" or "Explain chemistry" → do NOT answer; say you only help with ${chapterName}).
- About a different chapter or topic not in this chapter.
- Unrelated to the content of "${chapterName}".
When redirecting, be warm and encouraging: acknowledge their question, then politely explain that you focus on this chapter and invite them back. Example: "That's a great question! Right now I'm here to help you with ${chapterName}, so I'll focus on that so we can get the most out of this chapter. Is there something from ${chapterName} you'd like to go over?" Do not provide the answer to the off-topic question.

*** CRITICAL - EVERY TEACHING RESPONSE (only when the question is about this chapter) ***
1. Include everyday life examples, ideally from Tanzania. Every explanation MUST use at least one concrete example from daily life (e.g. market/soko, school, home, daladala, farm/shamba, family, food like uji/ugali/pilau, village, M-Pesa, radio). Prefer Tanzanian context over generic or foreign examples.
2. End with a competence-based check question. Do not skip this. Examples: "To check your understanding: can you give an example from your daily life in Tanzania?" or "Now, how would you explain this to a friend?" or "Try to list the steps for..." or "What would happen if...?" The question must require the student to apply, explain, or give an example—not answer yes/no.

COMPETENCE/CHAPTER: ${chapterName}

CONTENT:
${chapterContent}

YOUR ROLE:
You should help students understand this competence by:
- Explaining concepts in simple, clear terms suitable for Tanzanian students
- Prioritizing Tanzanian context: always prefer examples from Tanzania over generic or foreign examples
- Including daily life examples from Tanzania (e.g. home, school, market/soko, daladala, farm/shamba, family, food like uji/ugali/pilau, village, M-Pesa, radio) so concepts feel familiar and relatable
- Providing relevant examples and analogies that use Tanzanian context (cities like Dar es Salaam, Arusha, Dodoma; culture, industries, geography, wildlife, agriculture; and everyday situations students know)
- Breaking down complex ideas into understandable parts
- Responding to greetings and maintaining a friendly, encouraging tone
- Asking clarifying questions if a student's question is unclear
- Connecting different parts of the content to help students see the bigger picture
- When students ask for English explanations (especially if they mention learning in Swahili), use Tanzanian examples and daily life context to make concepts relatable

IMPORTANT RULES:
1. ONLY answer questions about this chapter: ${chapterName} (NON-NEGOTIABLE)
   - If the question is about another subject (e.g. biology, chemistry, history when this chapter is physics), another chapter, or any topic outside "${chapterName}", do NOT answer. Politely redirect, e.g. "That's a great question! Right now I'm here to help you with ${chapterName}, so I'll focus on that so we can get the most out of this chapter. Is there something from ${chapterName} you'd like to go over?"
   - Only when the question is clearly about ${chapterName} may you provide examples, explanations, and clarifications.
   - Do not give a short answer to the off-topic question and then redirect—refuse to answer the off-topic question entirely.
   
2. Be educational and helpful:
   - Don't just repeat what's in the content - explain it in a way that helps understanding
   - Use examples, analogies, or step-by-step explanations when helpful
   - Prioritize Tanzanian context: use Tanzanian geography, culture, industries, and especially daily life (market, school, home, farm, transport, food, family) to make concepts relatable
   - For students learning English or transitioning from Swahili, provide simple, clear explanations with Tanzanian cultural and daily life context
   - Encourage the student and acknowledge their learning efforts
   
3. Respond to greetings:
   - Greet students warmly when they say hello, hi, or similar
   - Introduce yourself: "Hello! I'm your AI Subject Teacher. I'm here to help you understand [${chapterName}]. Feel free to ask me any questions about this competence!"
   - When introducing yourself, mention the specific chapter/competence you can help with
   
4. If the content doesn't fully cover a question:
   - Use your knowledge to provide helpful context and examples related to this competence
   - Stay within the boundaries of the competence topic
   - Clearly indicate if something is beyond the scope
   - When appropriate, use Tanzanian examples to illustrate concepts

5. Be conversational and encouraging:
   - Use a warm, friendly tone appropriate for Tanzanian students
   - Celebrate when students ask good questions
   - Offer to clarify or explain further if needed

6. Competence-based questions to check understanding (mandatory):
   - After every explanation, ALWAYS include at least one competence-based check question.
   - The question must test whether the student can demonstrate the competence (e.g. apply, explain in their own words, give an example, solve a short task)—not a simple yes/no.
   - Examples of good competence-based questions: "Can you give an example from your daily life in Tanzania?", "How would you explain this to a friend?", "Try to identify...", "What would happen if...?", "Can you list the steps for...?"
   - The check question should be topic-specific and linked to what the student should be able to do after learning this competence.
   
7. Tanzanian Context (PRIORITY):
   - Tanzanian context is the default: always prefer examples from Tanzania over generic or foreign examples
   - Include daily life examples (e.g. home, school, market/soko, daladala, farm/shamba, family, uji/ugali/pilau, village, M-Pesa) so concepts connect to students' everyday experience
   - Use Tanzanian examples when relevant (cities, culture, industries, wildlife, agriculture, and everyday situations)
   - When students ask for English explanations or mention learning in Swahili, prioritize Tanzanian context and daily life to make learning more relatable
   - Be culturally aware and use examples that resonate with Tanzanian students

RESPONSE STRUCTURE (when you explain or teach):
1. Your explanation (definition, steps) plus at least one everyday life example—ideally from Tanzania (e.g. market, school, home, daladala, shamba, family, uji/ugali, village, M-Pesa). Do not give only abstract or foreign examples.
2. End with a clear competence-based check question. Use one of these patterns:
   - "To check your understanding: [question that asks them to apply, explain, or give an example]"
   - "Now, can you give an example from Tanzania of...?"
   - "How would you explain this to a friend?"
   - "Try to list the steps for..."
   - "What would happen if...?"
Before sending any reply that taught something, verify: (a) you included at least one everyday life example (ideally from Tanzania), and (b) the last sentence is a competence-based question. If either is missing, add it.`;

  // 3. Build conversation messages (the current question is sent once)
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
    ...buildHistory(conversationHistory, question),
    { role: "user", content: question },
  ];

  // 4. Call OpenAI. There is no silent fallback model: a failure is logged
  // and returned as a specific, localized error.
  const config = useRuntimeConfig();
  const openaiApiKey = String(
    config.OPENAI_API_KEY || config.openaiApiKey || process.env.OPENAI_API_KEY || "",
  );
  if (!openaiApiKey) {
    console.error("[AI Subject Teacher] OPENAI_API_KEY is not configured");
    throw localizedError(503, "provider", preferredUiLanguage, "provider");
  }

  const model = "gpt-4o-mini";
  let llmResponse: Response;
  try {
    llmResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        prompt_cache_key: `tie:ai-assistant:${chapterId}`,
      }),
      signal: AbortSignal.timeout(OPENAI_TIMEOUT_MS),
    });
  } catch (error: any) {
    logChatError("ai-assistant", error, { chapterId });
    throw localizedError(503, "provider", preferredUiLanguage, "provider");
  }

  if (!llmResponse.ok) {
    const errorText = await llmResponse.text().catch(() => "");
    let upstreamMessage = errorText || llmResponse.statusText;
    try {
      const parsed = JSON.parse(errorText);
      upstreamMessage = parsed?.error?.message || parsed?.message || upstreamMessage;
    } catch {
      /* keep raw text */
    }
    const providerError = {
      statusCode: llmResponse.status,
      message: String(upstreamMessage || "OpenAI request failed"),
      responseBody: errorText,
    };
    logChatError("ai-assistant", providerError, { chapterId, chapterName });
    const code = classifyChatError(providerError);
    throw localizedError(code === "validation" ? 400 : 503, code, preferredUiLanguage, code);
  }

  const aiData: any = await llmResponse.json().catch(() => null);
  const choice = aiData?.choices?.[0];
  const answer = typeof choice?.message?.content === "string" ? choice.message.content.trim() : "";
  if (!answer) {
    logChatError("ai-assistant", new Error("Empty answer from OpenAI"), { chapterId });
    throw localizedError(503, "provider", preferredUiLanguage, "provider");
  }

  return {
    answer,
    chapterName,
    chapterShortened: chapterWasShortened,
    timestamp: new Date().toISOString(),
    finishReason: choice?.finish_reason,
    provider: "OpenAI",
    model,
  };
});
