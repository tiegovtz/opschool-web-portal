import { db } from "../database/drizzle";
import { documents } from "../database/schema";
import { embedQuery } from "./embeddings";

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function searchNotes(query: string) {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    console.warn("searchNotes() received invalid query:", query);
    return []; // return empty result instead of crashing
  }

  // 1️⃣ Embed query
  const queryEmbedding = await embedQuery(query);

  // 2️⃣ Fetch all documents
  const docs = await db.select().from(documents);

  // 3️⃣ Compute cosine similarity
  const scored = docs.map((d) => ({
    content: d.content,
    score: cosineSimilarity(queryEmbedding, d.embedding),
  }));

  // 4️⃣ Sort descending and pick top 3
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3);
}

