/**
 * Classify AI request failures into a small set of codes the chat UI can turn
 * into specific, localized messages (instead of one "connection issue" text).
 */

export type ChatErrorCode = "quota" | "rate_limit" | "provider" | "validation" | "auth";

/** Prefix of the error text written into the UI message stream. */
export const CHAT_ERROR_PREFIX = "chat_error:";

type ErrorDetails = {
  statusCode?: number;
  message: string;
  responseBody?: string;
};

function unwrap(error: unknown): ErrorDetails {
  let current: any = error;
  // RetryError keeps the provider error in lastError.
  for (let depth = 0; depth < 3 && current; depth += 1) {
    if (current.lastError) current = current.lastError;
    else break;
  }
  return {
    statusCode: typeof current?.statusCode === "number" ? current.statusCode : undefined,
    message: String(current?.message || current || "Unknown error"),
    responseBody: typeof current?.responseBody === "string" ? current.responseBody : undefined,
  };
}

export function classifyChatError(error: unknown): ChatErrorCode {
  const { statusCode, message, responseBody } = unwrap(error);
  const text = `${message} ${responseBody || ""}`.toLowerCase();

  if (text.includes("insufficient_quota") || /\bquota\b|billing/.test(text)) return "quota";
  if (statusCode === 429 || text.includes("rate limit")) return "rate_limit";
  if (
    statusCode === 400 ||
    statusCode === 413 ||
    statusCode === 422 ||
    text.includes("context_length_exceeded") ||
    text.includes("maximum context length") ||
    text.includes("invalid_image") ||
    text.includes("unsupported image")
  ) {
    return "validation";
  }
  // A 401/403 from the model provider is a server key problem, not the student's
  // session, so it is reported as a provider failure.
  return "provider";
}

/** Log a chat failure with enough detail to debug, without message contents. */
export function logChatError(scope: string, error: unknown, extra: Record<string, unknown> = {}) {
  const { statusCode, message } = unwrap(error);
  console.error(`[${scope}] request failed`, {
    code: classifyChatError(error),
    statusCode,
    message: message.slice(0, 500),
    ...extra,
  });
}
