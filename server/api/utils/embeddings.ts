import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";

export async function embedQuery(text: string) {
  // Use useRuntimeConfig() to access the API key (same pattern as other endpoints)
  const config = useRuntimeConfig();
  const openaiApiKey = config.OPENAI_API_KEY || 
                       config.openaiApiKey || 
                       process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.error("[embedQuery] API key not found. Checked:", {
      config_OPENAI_API_KEY: !!config.OPENAI_API_KEY,
      config_openaiApiKey: !!config.openaiApiKey,
      env_OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    });
    throw new Error("Missing OPENAI_API_KEY - check .env file has OPENAI_API_KEY set");
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
