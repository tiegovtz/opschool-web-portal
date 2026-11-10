/**
 * AI routes call paid providers (OpenAI, Piper, Insights), so they require a
 * signed-in student and are rate limited per user.
 *
 * Protected: /api/chat, /api/ai/*, /api/conversation/*, /api/ai-assistant/*
 *
 * The rate limit is a fixed one-minute window kept in memory (per server
 * process). Limits can be tuned with AI_RATE_LIMIT_PER_MINUTE and
 * AI_TTS_RATE_LIMIT_PER_MINUTE.
 */

import { requireSessionUser } from "../utils/sessionAuth";

type Bucket = { windowStart: number; count: number };

const WINDOW_MS = 60 * 1000;
const MAX_BUCKETS = 10000;
const buckets = new Map<string, Bucket>();

const AI_LIMIT = Math.max(1, Number(process.env.AI_RATE_LIMIT_PER_MINUTE) || 20);
// Conversation practice makes several TTS/validation calls per turn.
const CONVERSATION_LIMIT = Math.max(1, Number(process.env.AI_TTS_RATE_LIMIT_PER_MINUTE) || 90);

function matchRoute(path: string): { group: string; limit: number } | null {
  if (/^\/api\/chat\/?$/.test(path)) return { group: "chat", limit: AI_LIMIT };
  if (/^\/api\/ai-assistant\//.test(path)) return { group: "ai-assistant", limit: AI_LIMIT };
  if (/^\/api\/ai\//.test(path)) return { group: "ai", limit: AI_LIMIT };
  if (/^\/api\/conversation\//.test(path)) return { group: "conversation", limit: CONVERSATION_LIMIT };
  return null;
}

function hitRateLimit(key: string, limit: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    bucket = { windowStart: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, value] of buckets) {
      if (now - value.windowStart >= WINDOW_MS) buckets.delete(bucketKey);
    }
  }

  if (bucket.count <= limit) return { allowed: true, retryAfterSec: 0 };
  return {
    allowed: false,
    retryAfterSec: Math.max(1, Math.ceil((bucket.windowStart + WINDOW_MS - now) / 1000)),
  };
}

export default defineEventHandler(async (event) => {
  if (event.method === "OPTIONS") return;

  let path = (event.path || "").split("?")[0] || "";
  const base = String(useRuntimeConfig(event).app?.baseURL || "/").replace(/\/+$/, "");
  if (base && path.startsWith(`${base}/`)) path = path.slice(base.length);

  const route = matchRoute(path);
  if (!route) return;

  const user = await requireSessionUser(event);

  const { allowed, retryAfterSec } = hitRateLimit(`${route.group}:${user.userId}`, route.limit);
  if (!allowed) {
    setResponseHeader(event, "Retry-After", retryAfterSec);
    throw createError({
      statusCode: 429,
      message: "Too many requests. Please wait a minute and try again.",
      data: { code: "rate_limit", retryAfter: retryAfterSec },
    });
  }
});
