import apiDocs from "~/utilities/api-docs";

/**
 * Extract plain text from HTML content, removing all HTML tags and formatting
 */
function extractTextContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  // Remove HTML comments
  let text = html.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove script and style tags with their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags but preserve text content
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');
  
  // Decode numeric entities
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
  text = text.replace(/&#x([a-f\d]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Clean up whitespace - multiple spaces, newlines, tabs to single space
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove any remaining special characters that might be from parsed content
  // (like expPackage, model tags, etc.)
  text = text.replace(/expPackage="[^"]*"/g, '');
  text = text.replace(/model="[^"]*"/g, '');
  
  return text;
}

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    });
  }

  // Get auth token from cookie or Authorization header
  const auth_token = getCookie(event, "signInAccessToken") || 
                     event.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!auth_token) {
    throw createError({
      statusCode: 401,
      message: "No authorization token provided. Please sign in."
    });
  }

  let body;
  try {
    body = await readBody(event);
  } catch (error) {
    console.error("Error reading request body:", error);
    throw createError({
      statusCode: 400,
      message: "Invalid request body"
    });
  }

  const { question, chapterId, conversationHistory } = body || {};

  if (!question || !chapterId) {
    console.error("Missing required fields:", {
      hasQuestion: !!question,
      hasChapterId: !!chapterId,
      body: body
    });
    throw createError({
      statusCode: 400,
      message: `Missing required fields. Question: ${!!question}, ChapterId: ${!!chapterId}`
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
          "Content-Type": "application/json",
        },
      }
    );

    if (!chapterResponse.ok) {
      const errorText = await chapterResponse.text().catch(() => '');
      console.error("Chapter fetch error:", {
        status: chapterResponse.status,
        statusText: chapterResponse.statusText,
        chapterId,
        hasToken: !!auth_token,
        error: errorText
      });
      
      if (chapterResponse.status === 401) {
        throw createError({
          statusCode: 401,
          message: "Authentication failed. Your session may have expired. Please sign in again."
        });
      }
      
      throw createError({
        statusCode: chapterResponse.status,
        message: `Failed to fetch chapter content: ${chapterResponse.statusText || 'Unknown error'}`,
      });
    }

    const chapterData = await chapterResponse.json();
    
    // Extract raw content (may contain HTML)
    const rawContent = chapterData?.content || chapterData?.notes || chapterData?.description || "";
    
    // Extract only text content, removing HTML tags and formatting
    const chapterContent = extractTextContent(rawContent);
    
    const chapterName = chapterData?.name || "this competence";
    
    // Log content length for debugging
    console.log("Chapter content extracted:", {
      chapterName,
      rawLength: rawContent.length,
      textLength: chapterContent.length,
      hasContent: chapterContent.length > 0
    });
    
    // If no text content was extracted, provide a fallback message
    if (!chapterContent || chapterContent.trim().length === 0) {
      throw createError({
        statusCode: 400,
        message: "Chapter content is empty or could not be extracted"
      });
    }

    // 2. Prepare prompt with strict instructions
    const systemPrompt = `You are Madam Ana, a friendly and experienced STEM (Science, Technology, Engineering, and Mathematics) subjects teacher teaching Tanzanian students. Your goal is to help students understand and learn about the current competence/chapter they are studying.

COMPETENCE/CHAPTER: ${chapterName}

CONTENT:
${chapterContent}

YOUR ROLE:
You should help students understand this competence by:
- Explaining concepts in simple, clear terms suitable for Tanzanian students
- Providing relevant examples and analogies that use Tanzanian context (Tanzanian cities like Dar es Salaam, Arusha, Dodoma; Tanzanian culture, industries, geography, wildlife, agriculture, etc.)
- Breaking down complex ideas into understandable parts
- Responding to greetings and maintaining a friendly, encouraging tone
- Asking clarifying questions if a student's question is unclear
- Connecting different parts of the content to help students see the bigger picture
- When students ask for English explanations (especially if they mention learning in Swahili), use Tanzanian examples and context to make concepts relatable

IMPORTANT RULES:
1. Stay focused on the competence/chapter: ${chapterName}
   - You can provide examples, explanations, and clarifications related to this competence
   - If asked about topics outside this competence, politely redirect: "That's a great question! However, it's outside the scope of [${chapterName}]. Would you like help understanding something from this chapter instead?"
   
2. Be educational and helpful:
   - Don't just repeat what's in the content - explain it in a way that helps understanding
   - Use examples, analogies, or step-by-step explanations when helpful
   - When possible, use Tanzanian context and examples (Tanzanian geography, culture, industries, local examples) to make concepts more relatable
   - For students learning English or transitioning from Swahili, provide simple, clear explanations with Tanzanian cultural context
   - Encourage the student and acknowledge their learning efforts
   
3. Respond to greetings:
   - Greet students warmly when they say hello, hi, or similar
   - Introduce yourself: "Hello! I'm Madam Ana, your STEM subjects teacher. I'm here to help you understand [${chapterName}]. Feel free to ask me any questions about this competence!"
   - When introducing yourself, always mention that you're a STEM teacher and the specific chapter/competence you can help with
   
4. If the content doesn't fully cover a question:
   - Use your knowledge to provide helpful context and examples related to this competence
   - Stay within the boundaries of the competence topic
   - Clearly indicate if something is beyond the scope
   - When appropriate, use Tanzanian examples to illustrate concepts

5. Be conversational and encouraging:
   - Use a warm, friendly tone appropriate for Tanzanian students
   - Celebrate when students ask good questions
   - Offer to clarify or explain further if needed
   
6. Tanzanian Context:
   - Understand that you are teaching Tanzanian students
   - Use Tanzanian examples when relevant (cities, culture, industries, wildlife, agriculture, etc.)
   - When students ask for English explanations or mention learning in Swahili, prioritize Tanzanian context to make learning more relatable
   - Be culturally aware and use examples that resonate with Tanzanian students`;

    // 3. Build conversation messages
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt }
    ];
    
    // Limit conversation history to prevent token overflow (keep last 10 exchanges)
    const maxHistoryMessages = 20; // 10 user + 10 assistant messages

    // Add conversation history if provided (excluding system messages)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Filter and add previous messages (only user and assistant roles)
      // Keep only the most recent messages to prevent token overflow
      const recentHistory = conversationHistory
        .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-maxHistoryMessages);
      
      recentHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current user question
    messages.push({ role: "user", content: question });

    // 4. Call OpenAI API
    const config = useRuntimeConfig();
    const openaiApiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw createError({
        statusCode: 500,
        message: "OpenAI API key not configured"
      });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000, // Increased from 500 to allow for complete responses
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json().catch(() => ({}));
      throw createError({
        statusCode: openaiResponse.status,
        message: error.error?.message || "OpenAI API error"
      });
    }

    const aiData = await openaiResponse.json();
    const choice = aiData.choices[0];
    const answer = choice?.message?.content || "Sorry, I couldn't generate an answer.";
    const finishReason = choice?.finish_reason;

    // Log if response was truncated
    if (finishReason === 'length') {
      console.warn("AI response was truncated due to token limit. Consider increasing max_tokens or shortening context.");
    }

    return {
      answer,
      chapterName,
      timestamp: new Date().toISOString(),
      finishReason: finishReason // Include for debugging
    };

  } catch (error: any) {
    console.error("AI Assistant error:", error);
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to get AI assistance"
    });
  }
});

