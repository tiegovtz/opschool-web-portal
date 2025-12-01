import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

export async function embedQuery(text: string) {
  const openaiApiKey = process.env.NUXT_OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.error("Invalid embedding input:", text);
    throw new Error("embedQuery() requires a non-empty string");
  }

  const openai = createOpenAI({ apiKey: openaiApiKey });

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });

  return embedding;
}
