import {
  buildRagContext,
  type RagCitation,
  type RagResult,
  DEFAULT_RAG_CONTEXT_MAX_CHARS,
} from "./ragContext";

/**
 * Textbook retrieval against Insights `POST /rag/query`, shared by the AI
 * teacher chat (server-side pre-retrieval and the searchTextbooks tool) and
 * the home AI search. A search that fails is reported as an error, never as
 * "nothing found", so outages are not presented to students as missing topics.
 */

export type TextbookSearchErrorCode =
  | "not_configured"
  | "unauthorized"
  | "timeout"
  | "unreachable"
  | "store_unavailable"
  | "provider_error"
  | "bad_request"
  | "upstream_error";

export type TextbookSearchFilters = {
  /** Class level ID (as stored in Insights), e.g. Form 1's ObjectId. */
  classLevel?: string;
  /** Subject ID (as stored in Insights). */
  subject?: string;
};

export type TextbookSearchOptions = TextbookSearchFilters & {
  topK?: number;
  maxChars?: number;
  timeoutMs?: number;
  /** Short label for log lines, e.g. "chat" or "home-search". */
  caller?: string;
};

export type TextbookSearchOutcome =
  | {
      status: "found";
      context: string;
      citations: RagCitation[];
      resultCount: number;
      queriesUsed: string[];
      methods: string[];
    }
  | { status: "not_found" }
  | { status: "error"; code: TextbookSearchErrorCode; message: string; httpStatus?: number };

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/** Only pass real IDs to Insights; display names would filter everything out. */
export function normalizeFilterId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return OBJECT_ID_RE.test(trimmed) ? trimmed : undefined;
}

/**
 * Read an error body from Insights. Supports the new `{error:{code,message}}`
 * shape and the older `{detail: string | [{msg}]}`, `{error: string}` and
 * `{message}` shapes.
 */
export function readInsightsError(body: unknown): { code?: string; message?: string } {
  if (!body || typeof body !== "object") {
    return typeof body === "string" && body.trim() ? { message: body.trim().slice(0, 300) } : {};
  }
  const data = body as Record<string, any>;
  if (data.error && typeof data.error === "object") {
    return {
      code: typeof data.error.code === "string" ? data.error.code : undefined,
      message: typeof data.error.message === "string" ? data.error.message : undefined,
    };
  }
  if (typeof data.error === "string") return { message: data.error };
  if (typeof data.detail === "string") return { message: data.detail };
  if (Array.isArray(data.detail)) {
    const msg = data.detail
      .map((item: any) => (typeof item?.msg === "string" ? item.msg : ""))
      .filter(Boolean)
      .join("; ");
    return msg ? { message: msg } : {};
  }
  if (typeof data.message === "string") return { message: data.message };
  return {};
}

function codeFromUpstream(status: number, insightsCode?: string): TextbookSearchErrorCode {
  switch (insightsCode) {
    case "unauthorized":
      return "unauthorized";
    case "store_unavailable":
      return "store_unavailable";
    case "provider_error":
      return "provider_error";
    case "bad_file":
    case "unreadable_pdf":
    case "too_large":
      return "bad_request";
  }
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 503) return "store_unavailable";
  if (status === 502) return "provider_error";
  if (status >= 400 && status < 500) return "bad_request";
  return "upstream_error";
}

function logSearchError(caller: string, code: TextbookSearchErrorCode, detail: Record<string, unknown>) {
  console.error(`[textbook-search:${caller}] search failed`, { code, ...detail });
}

export async function searchTextbookPassages(
  query: string,
  options: TextbookSearchOptions = {},
): Promise<TextbookSearchOutcome> {
  const caller = options.caller || "unknown";
  const rawQuery = (query || "").trim();
  if (!rawQuery) return { status: "not_found" };

  const config = useRuntimeConfig();
  const baseUrl = String(config.ragApiBaseUrl || "").trim().replace(/\/+$/, "");
  const apiKey = String(config.insightsApiKey || "").trim();
  if (!baseUrl || !apiKey) {
    const message = !baseUrl
      ? "RAG_API_BASE_URL is not configured"
      : "INSIGHTS_API_KEY is not configured";
    logSearchError(caller, "not_configured", { message });
    return { status: "error", code: "not_configured", message };
  }

  const body: Record<string, unknown> = {
    query: rawQuery,
    topK: options.topK ?? 5,
    useQueryExpansion: true,
    useMultiQuery: true,
    useHybrid: true,
    useReranking: false,
    returnParent: true,
  };
  const classLevel = normalizeFilterId(options.classLevel);
  const subject = normalizeFilterId(options.subject);
  if (classLevel) body.classLevel = classLevel;
  if (subject) body.subject = subject;

  const timeoutMs = options.timeoutMs ?? 15000;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/rag/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error: any) {
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    const code: TextbookSearchErrorCode = timedOut ? "timeout" : "unreachable";
    const message = timedOut
      ? `Insights did not answer within ${timeoutMs}ms`
      : `Insights could not be reached: ${error?.message || String(error)}`;
    logSearchError(caller, code, { message });
    return { status: "error", code, message };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* keep raw text */
    }
    const upstream = readInsightsError(parsed);
    const code = codeFromUpstream(response.status, upstream.code);
    const message = upstream.message || response.statusText || "Insights request failed";
    logSearchError(caller, code, {
      httpStatus: response.status,
      insightsCode: upstream.code,
      message,
    });
    return { status: "error", code, message, httpStatus: response.status };
  }

  let data: any;
  try {
    data = await response.json();
  } catch (error: any) {
    const message = `Insights returned invalid JSON: ${error?.message || String(error)}`;
    logSearchError(caller, "upstream_error", { message });
    return { status: "error", code: "upstream_error", message };
  }

  const results: RagResult[] = Array.isArray(data?.results) ? data.results : [];
  if (results.length === 0) return { status: "not_found" };

  const { context, citations, passagesUsed } = buildRagContext(results, {
    maxChars: options.maxChars ?? DEFAULT_RAG_CONTEXT_MAX_CHARS,
  });
  if (!context.trim()) return { status: "not_found" };

  return {
    status: "found",
    context,
    citations,
    resultCount: passagesUsed,
    queriesUsed: Array.isArray(data?.queriesUsed) ? data.queriesUsed : [rawQuery],
    methods: Array.isArray(data?.methods) ? data.methods : [],
  };
}
