import apiDocs from "~/utilities/apiDocs";

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

  // Clean up whitespace - multiple spaces, newlines, tabs to single space
  text = text.replace(/\s+/g, " ").trim();

  // Remove any remaining special characters that might be from parsed content
  // (like expPackage, model tags, etc.)
  text = text.replace(/expPackage="[^"]*"/g, "");
  text = text.replace(/model="[^"]*"/g, "");

  return text;
}

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    throw createError({
      statusCode: 405,
      message: "Method Not Allowed",
    });
  }

  // Get auth token from cookie or Authorization header
  const auth_token =
    getCookie(event, "signInAccessToken") ||
    event.headers.get("authorization")?.replace("Bearer ", "").trim();

  if (!auth_token) {
    throw createError({
      statusCode: 401,
      message: "No authorization token provided. Please sign in.",
    });
  }

  let body;
  try {
    body = await readBody(event);
  } catch {
    throw createError({
      statusCode: 400,
      message: "Invalid request body",
    });
  }

  const { question, chapterId, conversationHistory, uiLanguage } = body || {};

  if (!question || !chapterId) {
    throw createError({
      statusCode: 400,
      message: `Missing required fields. Question: ${!!question}, ChapterId: ${!!chapterId}`,
    });
  }

  try {
    // 1. Fetch chapter content/notes
    const chapterResponse = await fetch(
      apiDocs.chapters.getChapterId.replaceAll(":id", chapterId),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth_token}`,
        },
      }
    );

    if (!chapterResponse.ok) {
      if (chapterResponse.status === 401) {
        throw createError({
          statusCode: 401,
          message:
            "Authentication failed. Your session may have expired. Please sign in again.",
        });
      }

      throw createError({
        statusCode: chapterResponse.status,
        message: `Failed to fetch chapter content: ${
          chapterResponse.statusText || "Unknown error"
        }`,
      });
    }

    const chapterData = await chapterResponse.json();

    // Extract raw content (may contain HTML)
    const rawContent =
      chapterData?.content ||
      chapterData?.notes ||
      chapterData?.description ||
      "";

    // Extract only text content, removing HTML tags and formatting
    const chapterContent = extractTextContent(rawContent);

    const chapterName = chapterData?.name || "this competence";

    // If no text content was extracted, provide a fallback message
    if (!chapterContent || chapterContent.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: "Chapter content is empty or could not be extracted",
      });
    }

    const preferredUiLanguage =
      typeof uiLanguage === "string" && uiLanguage.trim().toLowerCase() === "kiswahili"
        ? "kiswahili"
        : "english";

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

    // 3. Build conversation messages
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Limit conversation history to prevent token overflow (keep last 10 exchanges)
    const maxHistoryMessages = 20; // 10 user + 10 assistant messages

    // Add conversation history if provided (excluding system messages)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Filter and add previous messages (only user and assistant roles)
      // Keep only the most recent messages to prevent token overflow
      const recentHistory = conversationHistory
        .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
        .slice(-maxHistoryMessages);

      recentHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current user question
    messages.push({ role: "user", content: question });

    // 4. Call LLM API with GPT as primary and Gemma as fallback
    const config = useRuntimeConfig();
    const openaiApiKey =
      config.OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";

    // Primary: OpenAI GPT configuration
    const primaryConfig = {
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini",
      provider: "OpenAI",
      maxTokens: 2000,
      timeout: 30000, // 30 seconds
      requiresAuth: true,
    };

    // Fallback: Ollama Gemma configuration
    const fallbackConfig = {
      baseUrl: "http://localhost:11434/v1",
      model: "gemma3:1b",
      provider: "Ollama",
      maxTokens: 1500,
      timeout: 45000, // 45 seconds
      requiresAuth: false,
    };

    // Limit chapter content length for faster processing (keep first 8000 chars for fallback)
    const optimizedSystemPrompt =
      systemPrompt.length > 8000
        ? systemPrompt.substring(0, 8000) +
          "\n\n[Content truncated for faster response]"
        : systemPrompt;

    // Replace system message with optimized version if needed
    const optimizedMessages = messages.map((msg, idx) =>
      idx === 0 && msg.role === "system"
        ? { ...msg, content: optimizedSystemPrompt }
        : msg
    );

    const promptCacheKey = `tie:ai-assistant:${chapterId}`;

    // Helper function to make LLM API call
    const callLLM = async (llmConfig: typeof primaryConfig): Promise<any> => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (llmConfig.requiresAuth && openaiApiKey) {
        headers["Authorization"] = `Bearer ${openaiApiKey}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), llmConfig.timeout);

      try {
        const llmResponse = await fetch(
          `${llmConfig.baseUrl}/chat/completions`,
          {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              model: llmConfig.model,
              messages: optimizedMessages,
              temperature: 0.7,
              max_tokens: llmConfig.maxTokens,
              prompt_cache_key: promptCacheKey,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text().catch(() => "");
          let error;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { message: errorText || llmResponse.statusText };
          }

          throw new Error(
            error.error?.message ||
              error.message ||
              `${llmConfig.provider} API error`
          );
        }

        const aiData = await llmResponse.json();
        const choice = aiData.choices[0];
        const answer =
          choice?.message?.content || "Sorry, I couldn't generate an answer.";
        const finishReason = choice?.finish_reason;

        return {
          answer,
          finishReason,
          provider: llmConfig.provider,
          model: llmConfig.model,
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          throw new Error(`Request timed out after ${llmConfig.timeout}ms`);
        }

        throw fetchError;
      }
    };

    // Try primary (OpenAI GPT) first
    try {
      // Check if OpenAI API key is available
      if (!openaiApiKey) {
        throw new Error("OpenAI API key not configured");
      }

      const result = await callLLM(primaryConfig);
      return {
        answer: result.answer,
        chapterName,
        timestamp: new Date().toISOString(),
        finishReason: result.finishReason,
        provider: result.provider,
        model: result.model,
      };
    } catch (primaryError: any) {
      // Try fallback (Ollama Gemma)
      try {
        const result = await callLLM(fallbackConfig);
        return {
          answer: result.answer,
          chapterName,
          timestamp: new Date().toISOString(),
          finishReason: result.finishReason,
          provider: result.provider,
          model: result.model,
        };
      } catch (fallbackError: any) {
        throw createError({
          statusCode: 503,
          message: `Both primary (OpenAI) and fallback (${fallbackConfig.provider}) providers failed. Primary error: ${primaryError.message}. Fallback error: ${fallbackError.message}`,
        });
      }
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to get AI assistance",
    });
  }
});
