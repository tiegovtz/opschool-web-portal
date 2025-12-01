import { defineEventHandler, readBody } from "h3";
import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { shouldUseRAG } from "./utils/shouldUseRAG";
import { searchNotes } from "./utils/searchNotes";
import { studentTools } from "./utils/tools";

// --------------------------------------
// System Prompt Builder
// --------------------------------------
function getBaseSystemPrompt() {
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

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Safely parse user messages
  const messages: UIMessage[] = Array.isArray(body?.messages)
    ? body.messages
    : [];

  const userMessage = messages.at(-1)?.content || "";

  const apiKey = useRuntimeConfig().openaiApiKey;
  if (!apiKey) throw new Error("Missing OpenAI API key");

  const openai = createOpenAI({ apiKey });

  // --------------------------------------
  // Decide whether to use RAG
  // --------------------------------------
  const useRAG = await shouldUseRAG(userMessage, apiKey);

  let systemPrompt = getBaseSystemPrompt();
  let modelName = "gpt-4o";

  // --------------------------------------
  // RAG Flow
  // --------------------------------------
  if (useRAG) {
    const results = await searchNotes(userMessage);
    const context = results.map((r: { content: string }) => `- ${r.content}`).join("\n");

    // Only add context if something was retrieved
    const systemPromptWithContext = `
${systemPrompt}

Context:
${context || "(No relevant notes found)"}
    `.trim();

    systemPrompt = systemPromptWithContext;
    modelName = "gpt-4o";
  }

  // --------------------------------------
  // Create Model Input
  // --------------------------------------
  const modelInput = {
    model: openai(modelName),
    messages: [
      { role: "system", content: systemPrompt },
      ...convertToModelMessages(messages),
    ],
    stopWhen: stepCountIs(10),
    tools: studentTools,
  };

  // Stream the response
  const result = streamText(modelInput);
  return result.toUIMessageStreamResponse();
});
