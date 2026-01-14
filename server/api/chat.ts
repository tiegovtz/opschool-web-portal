import { defineEventHandler, readBody } from "h3";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type CoreMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// --------------------------------------
// System Prompt Builder
// --------------------------------------
function getBaseSystemPrompt(
  chapterName?: string,
  context?: {
    subject?: string;
    level?: string;
    topic?: string;
    chapterNo?: number;
  }
) {
  if (chapterName) {
    // Build context string
    const contextParts = [];
    if (context?.subject) contextParts.push(`Subject: ${context.subject}`);
    if (context?.level) contextParts.push(`Level: ${context.level}`);
    if (context?.topic) contextParts.push(`Topic: ${context.topic}`);
    if (context?.chapterNo !== null && context?.chapterNo !== undefined) {
      contextParts.push(`Chapter ${context.chapterNo}`);
    }
    const contextString =
      contextParts.length > 0 ? `\n\nContext: ${contextParts.join(" | ")}` : "";

    // Subject AI Teacher mode - focused on teaching a specific competence
    return `
You are a Subject AI Teacher, an intelligent teaching assistant specialized in the Tanzanian (NECTA) curriculum. Your PRIMARY and ONLY focus is to help students understand the specific competence/chapter: "${chapterName}".${contextString}

CRITICAL RULES - Chapter Scope:
1. STRICT CHAPTER BOUNDARIES:
   - You MUST ONLY answer questions that are directly related to "${chapterName}"
   - If a student asks about a different chapter, topic, or subject, you MUST politely decline and redirect them:
     "I'm here specifically to help you with ${chapterName}. For questions about other topics, please use the general TIE AI Assistant or navigate to the relevant chapter."
   - Do NOT answer questions that are outside the scope of "${chapterName}"
   - If a question is only partially related, focus ONLY on the parts relevant to "${chapterName}" and mention that other aspects are outside this chapter's scope

2. Active Teaching Role (within chapter scope only):
   - Don't just retrieve and repeat information from the context
   - Actively teach by providing clear explanations, examples, analogies, and step-by-step guidance
   - Adapt your explanations to the student's level and learning style
   - ALL teaching must be strictly within the boundaries of "${chapterName}"

3. Provide Additional Examples (chapter-specific):
   - Create relevant examples that help illustrate concepts from "${chapterName}"
   - Use Tanzanian context (cities, culture, industries, wildlife, agriculture, etc.) when appropriate
   - Provide multiple examples to ensure understanding
   - Use analogies that resonate with Tanzanian students
   - All examples must relate directly to "${chapterName}"

4. Adapt to Student Needs (within chapter):
   - If a student seems confused about "${chapterName}", break down concepts further
   - If a student asks follow-up questions about "${chapterName}", build on previous explanations
   - Adjust your language complexity based on the student's questions
   - Be encouraging and supportive
   - If questions drift outside "${chapterName}", gently redirect back to the chapter

5. Curriculum Boundaries:
   - Your primary source of truth is the Tanzanian curriculum (NECTA) and the notes provided in the context
   - If necessary, you may use nearby East African curricula (Kenya, Uganda, Rwanda) ONLY as secondary references — never as replacements
   - If a question cannot be answered using Tanzanian curriculum or provided notes, respond:
     "Sorry, I can only answer questions based on the Tanzanian curriculum and specifically about ${chapterName}."
   - Never use information outside the provided context or approved curricula
   - Stay STRICTLY within the boundaries of "${chapterName}" - do not discuss other chapters or topics

6. Teaching Style:
   - When introducing yourself, mention: "I'm here to help you understand ${chapterName}. Feel free to ask me any questions about this specific competence!"
   - Explanations must be clear, simple, step-by-step, and aligned with the Tanzanian syllabus
   - Be conversational and encouraging
   - Use a warm, friendly tone appropriate for Tanzanian students
   - Celebrate when students ask good questions about "${chapterName}"
   - Offer to clarify or explain further if needed (within chapter scope)

Remember: Your EXCLUSIVE goal is to help the student understand "${chapterName}" and ONLY "${chapterName}". Do not answer questions about other chapters, topics, or subjects.
    `.trim();
  }

  // TIE AI Teacher mode - general assistant
  return `
You are TIE AI, a student assistant specialized in the Tanzanian (NECTA) curriculum.

Priority Rules:
1. Your primary source of truth is the Tanzanian curriculum (NECTA) and the notes provided in the context.
2. If necessary, you may use nearby East African curricula (Kenya, Uganda, Rwanda) ONLY as secondary references — never as replacements.
3. If a question cannot be answered using Tanzanian curriculum or provided notes, respond:
   "Sorry, I can only answer questions based on the Tanzanian curriculum."
4. Explanations must be clear, simple, step-by-step, and aligned with the Tanzanian syllabus.
5. Never use information outside the provided context or approved curricula.
  `.trim();
}

/**
 * Detects if a message is in UIMessage format (has parts array) or simple format (has content)
 */
function isUIMessageFormat(message: any): boolean {
  return (
    message &&
    (Array.isArray(message.parts) ||
      (message.id !== undefined && message.parts !== undefined))
  );
}

/**
 * Converts messages to CoreMessage format
 * Handles both UIMessage format (from Chat component) and simple format (from external API)
 */
function convertMessagesToCore(messages: any[]): CoreMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  // Check if any message has UIMessage format (parts array)
  const hasUIMessageFormat = messages.some(isUIMessageFormat);

  if (hasUIMessageFormat) {
    // Use convertToModelMessages for UIMessage format (from Chat component)
    try {
      return convertToModelMessages(messages);
    } catch (error) {
      // Fallback: extract content from parts manually
      return messages.map((msg: any) => {
        let content = "";
        if (Array.isArray(msg.parts)) {
          content = msg.parts
            .filter((p: any) => p?.type === "text" && p?.text)
            .map((p: any) => String(p.text))
            .join("");
        } else if (msg.content) {
          content = String(msg.content);
        }

        const role = msg.role || "user";
        if (role === "user") {
          return { role: "user", content };
        } else if (role === "assistant") {
          return { role: "assistant", content };
        } else if (role === "system") {
          return { role: "system", content };
        }
        return { role: "user", content };
      });
    }
  } else {
    // Simple format: convert directly to CoreMessage
    return messages.map((msg: any) => {
      const role = msg.role || "user";
      const content = msg.content || "";

      if (role === "user") {
        return { role: "user", content };
      } else if (role === "assistant") {
        return { role: "assistant", content };
      } else if (role === "system") {
        return { role: "system", content };
      }
      return { role: "user", content };
    });
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Safely parse user messages
  const messages: any[] = Array.isArray(body?.messages) ? body.messages : [];

  // Extract context if provided (for Subject AI Teacher mode)
  // Check both body and headers (headers are more reliable)
  const chapterNameFromBody = body?.chapterName;
  const chapterNameFromHeader =
    event.headers.get("x-chapter-name") || event.headers.get("X-Chapter-Name");
  const chapterName = chapterNameFromBody || chapterNameFromHeader;

  // Additional context - check headers first, then body
  const subject =
    event.headers.get("x-subject") ||
    event.headers.get("X-Subject") ||
    body?.subject ||
    "";
  const level =
    event.headers.get("x-level") ||
    event.headers.get("X-Level") ||
    body?.level ||
    "";
  const topic =
    event.headers.get("x-topic") ||
    event.headers.get("X-Topic") ||
    body?.topic ||
    "";
  const chapterNoHeader =
    event.headers.get("x-chapter-no") || event.headers.get("X-Chapter-No");
  const chapterNo = chapterNoHeader
    ? parseInt(chapterNoHeader)
    : body?.chapterNo ?? null;

  // Validate API key
  const apiKey = useRuntimeConfig().openaiApiKey;
  if (!apiKey) {
    throw new Error("Missing OpenAI API key");
  }

  const openai = createOpenAI({ apiKey });

  // Validate chapterName - only use it if it's a real chapter name (not empty or default)
  const validChapterName =
    chapterName && chapterName.trim() && chapterName !== "this competence"
      ? chapterName.trim()
      : undefined;

  // Build context object only if we have a valid chapter name
  const context = validChapterName
    ? {
        subject: subject,
        level: level,
        topic: topic,
        chapterNo: chapterNo,
      }
    : undefined;

  let systemPrompt = getBaseSystemPrompt(validChapterName, context);
  const modelName = "gpt-4o";

  // If chapterName is provided, ensure it's emphasized in the final prompt
  if (chapterName) {
    systemPrompt = `${systemPrompt}

REMINDER: You are currently helping with the chapter/competence: "${chapterName}". You MUST ONLY answer questions related to this specific chapter.`;
  }

  // Convert messages to CoreMessage format (handles both UIMessage and simple formats)
  const coreMessages = convertMessagesToCore(messages);

  // Create Model Input
  const modelInput = {
    model: openai(modelName),
    messages: [
      { role: "system", content: systemPrompt },
      ...coreMessages,
    ] as any,
    stopWhen: stepCountIs(10),
  };

  // Stream the response
  const result = streamText(modelInput as any);
  return result.toUIMessageStreamResponse();
});
