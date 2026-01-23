import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import OpenAI from "openai";

/**
 * Embedding model constant - MUST be the same for both embedding and retrieval
 * Changing this requires re-embedding all existing documents in the vector store
 */
const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Get OpenAI API key from runtime config
 */
function getOpenAIApiKey(): string {
  const config = useRuntimeConfig();
  const openaiApiKey = config.OPENAI_API_KEY || 
                       config.openaiApiKey || 
                       process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    console.error("[embeddings] API key not found. Checked:", {
      config_OPENAI_API_KEY: !!config.OPENAI_API_KEY,
      config_openaiApiKey: !!config.openaiApiKey,
      env_OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    });
    throw new Error("Missing OPENAI_API_KEY - check .env file has OPENAI_API_KEY set");
  }

  return openaiApiKey;
}

/**
 * Generate embeddings for multiple chunks in batch
 * Uses OpenAI SDK directly for batch operations
 */
export async function embedChunks(
  chunks: Array<{ content: string }>
): Promise<number[][]> {
  if (!chunks || chunks.length === 0) {
    throw new Error("embedChunks() requires at least one chunk");
  }

  const texts = chunks.map((chunk) => chunk.content).filter(text => text && text.trim().length > 0);
  
  if (texts.length === 0) {
    throw new Error("No valid text content found in chunks");
  }

  const openaiApiKey = getOpenAIApiKey();
  const openai = new OpenAI({ apiKey: openaiApiKey });

  try {
    console.log(`[embeddings] Generating embeddings for ${texts.length} chunks using model: ${EMBEDDING_MODEL}`);
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts,
    });

    const embeddings = response.data.map((item) => item.embedding);
    console.log(`[embeddings] Successfully generated ${embeddings.length} embeddings`);
    return embeddings;
  } catch (error) {
    console.error("[embeddings] Error generating batch embeddings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to generate embeddings: ${errorMessage}`);
  }
}

/**
 * Generate embedding for a single query string
 */
export async function embedQuery(text: string) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.error("Invalid embedding input:", text);
    throw new Error("embedQuery() requires a non-empty string");
  }

  const openaiApiKey = getOpenAIApiKey();
  const openai = createOpenAI({ apiKey: openaiApiKey });

  console.log(`[embeddings] Generating query embedding using model: ${EMBEDDING_MODEL}`);
  const { embedding } = await embed({
    model: openai.embedding(EMBEDDING_MODEL),
    value: text,
  });

  return embedding;
}
