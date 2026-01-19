import { defineEventHandler, readBody, getCookie } from "h3";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type CoreMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { fetchRAGContext } from "../utils/rag";

// ============================================
// Types & Interfaces
// ============================================

interface ChapterContext {
  subject?: string;
  level?: string;
  topic?: string;
  chapterNo?: number;
}

interface RequestContext {
  chapterName?: string;
  context?: ChapterContext;
}

// ============================================
// Prompt Builders
// ============================================

function buildContextString(context?: ChapterContext): string {
  if (!context) return "";

  const parts: string[] = [];
  if (context.subject) parts.push(`Subject: ${context.subject}`);
  if (context.level) parts.push(`Level: ${context.level}`);
  if (context.topic) parts.push(`Topic: ${context.topic}`);
  if (context.chapterNo != null) parts.push(`Chapter ${context.chapterNo}`);

  return parts.length > 0 ? `\n\nContext: ${parts.join(" | ")}` : "";
}

function getSubjectAITeacherPrompt(chapterName: string, context?: ChapterContext): string {
  const contextString = buildContextString(context);

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

function getGeneralAITeacherPrompt(): string {
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

function getSystemPrompt(chapterName?: string, context?: ChapterContext): string {
  return chapterName
    ? getSubjectAITeacherPrompt(chapterName, context)
    : getGeneralAITeacherPrompt();
}

function addRAGContextToPrompt(basePrompt: string, ragContext: string): string {
  return `${basePrompt}

RELEVANT CONTEXT FROM KNOWLEDGE BASE:
The following information has been retrieved from the knowledge base to help answer the student's question. Each piece of information includes its source in the format [Source: filename | Citation: citation]. Use this context to provide accurate and comprehensive answers:

${ragContext}

IMPORTANT: When using the context above:
- Prioritize information that directly relates to the student's question
- If the context contains information outside the chapter scope (when in Subject AI Teacher mode), focus only on the relevant parts
- Combine the context with your teaching approach to provide clear explanations
- If the context contradicts the Tanzanian curriculum, prioritize the curriculum
- ALWAYS cite your sources when using information from the knowledge base. Reference the source file name (e.g., "According to [filename.pdf]..." or "As mentioned in [filename.pdf]...") so students know where the information comes from`;
}

function addChapterReminderToPrompt(prompt: string, chapterName: string): string {
  return `${prompt}

REMINDER: You are currently helping with the chapter/competence: "${chapterName}". You MUST ONLY answer questions related to this specific chapter.`;
}

// ============================================
// Message Utilities
// ============================================

function isUIMessageFormat(message: any): boolean {
  return (
    message &&
    (Array.isArray(message.parts) ||
      (message.id !== undefined && message.parts !== undefined))
  );
}

function extractMessageContent(msg: any): string {
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p: any) => p?.type === "text" && p?.text)
      .map((p: any) => String(p.text))
      .join("");
  }
  return msg.content ? String(msg.content) : "";
}

function extractLatestUserQuery(messages: any[]): string | null {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  // Find the last user message (iterate backwards)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role === "user") {
      const content = extractMessageContent(msg);
      return content.trim() || null;
    }
  }

  return null;
}

function convertMessageToCore(msg: any): CoreMessage {
  const content = extractMessageContent(msg);
  const role = msg.role || "user";

  if (role === "user") return { role: "user", content };
  if (role === "assistant") return { role: "assistant", content };
  if (role === "system") return { role: "system", content };

  return { role: "user", content };
}

function convertMessagesToCore(messages: any[]): CoreMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const hasUIMessageFormat = messages.some(isUIMessageFormat);

  if (hasUIMessageFormat) {
    try {
      return convertToModelMessages(messages);
    } catch (error) {
      // Fallback: extract content manually
      return messages.map(convertMessageToCore);
    }
  }

  return messages.map(convertMessageToCore);
}

// ============================================
// RAG Utilities
// ============================================
// RAG functionality has been moved to ~/server/utils/rag.ts
// Import fetchRAGContext from there

// ============================================
// Request Parsing Utilities
// ============================================

function getHeaderValue(event: any, headerName: string): string | null {
  return (
    event.headers.get(headerName.toLowerCase()) ||
    event.headers.get(headerName) ||
    null
  );
}

function extractRequestContext(event: any, body: any): RequestContext {
  const chapterName =
    body?.chapterName ||
    getHeaderValue(event, "x-chapter-name") ||
    undefined;

  const subject =
    getHeaderValue(event, "x-subject") || body?.subject || "";
  const level = getHeaderValue(event, "x-level") || body?.level || "";
  const topic = getHeaderValue(event, "x-topic") || body?.topic || "";

  const chapterNoHeader = getHeaderValue(event, "x-chapter-no");
  const chapterNo = chapterNoHeader
    ? parseInt(chapterNoHeader)
    : body?.chapterNo ?? null;

  const validChapterName =
    chapterName?.trim() && chapterName !== "this competence"
      ? chapterName.trim()
      : undefined;

  const context: ChapterContext | undefined = validChapterName
    ? { subject, level, topic, chapterNo }
    : undefined;

  return {
    chapterName: validChapterName,
    context,
  };
}

function getAuthToken(event: any): string | undefined {
  return (
    getCookie(event, "signInAccessToken") ||
    event.headers.get("authorization")?.replace("Bearer ", "").trim() ||
    undefined
  );
}

// ============================================
// Main Handler
// ============================================

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const messages: any[] = Array.isArray(body?.messages) ? body.messages : [];

  // Extract request context
  const { chapterName, context } = extractRequestContext(event, body);

  // Validate OpenAI API key
  const apiKey = useRuntimeConfig().openaiApiKey;
  if (!apiKey) {
    throw new Error("Missing OpenAI API key");
  }

  // Build system prompt
  let systemPrompt = getSystemPrompt(chapterName, context);

  // Fetch RAG context if user query exists
  const latestUserQuery = extractLatestUserQuery(messages);
  if (latestUserQuery) {
    const authToken = getAuthToken(event);
    const ragContext = await fetchRAGContext(latestUserQuery, authToken);

    if (ragContext) {
      systemPrompt = addRAGContextToPrompt(systemPrompt, ragContext);
    }
  }

  // Add chapter reminder if applicable
  if (chapterName) {
    systemPrompt = addChapterReminderToPrompt(systemPrompt, chapterName);
  }

  // Convert messages and prepare model input
  const coreMessages = convertMessagesToCore(messages);
  const openai = createOpenAI({ apiKey });

  const modelInput = {
    model: openai("gpt-4o"),
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
