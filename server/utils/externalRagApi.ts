/**
 * External RAG API Client
 *
 * Handles server-side interactions with the external Machine Learning RAG API
 * Endpoint: /machine-learning/books/embeddings/search?search={query}
 *
 * Uses the same base URL (VITE_API_BASE_URL) and authentication pattern as the rest of the app
 */

import { createHash } from "crypto";
import { trackRagApiError, categorizeHttpError } from "./errorTracking";
import apiDocs from "~/utilities/apiDocs";

const resolveApiUrl = (docUrl: string, fallbackPath: string) => {
  const baseUrl = apiDocs.baseURL;
  if (docUrl && !docUrl.includes("undefined")) {
    return docUrl.replace(apiDocs.baseURL || baseUrl, baseUrl);
  }
  return `${baseUrl}${fallbackPath}`;
};

export interface ExternalRAGResult {
  content: string;
  similarity: number;
  metadata: {
    bookId?: string;
    bookTitle?: string;
    source?: string;
    citation?: string;
    chunkIndex?: number;
    tokenEstimate?: number;
    pageNumber?: number;
    [key: string]: any;
  };
}

export interface ExternalRAGResponse {
  success: boolean;
  query: string;
  resultsCount: number;
  results: ExternalRAGResult[];
  message?: string;
}

function getAuthToken(token?: string): string {
  if (token && token.trim()) {
    return token;
  }
  return "";
}

const DEFAULT_TIMEOUT_MS = parseInt(
  process.env.EXTERNAL_RAG_TIMEOUT_MS || "2500",
  10,
);
const RETRY_TIMEOUT_MS = parseInt(
  process.env.EXTERNAL_RAG_RETRY_TIMEOUT_MS || "4000",
  10,
);

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  token?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  throwOnTimeout: boolean = false,
): Promise<T | null> {
  const method = (options.method || "GET") as
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE";

  try {
    const authToken = getAuthToken(token);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>;
      Object.assign(headers, optHeaders);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorType = categorizeHttpError(response.status);

      if (response.status === 404) {
        return null;
      }

      trackRagApiError({
        endpoint: url,
        method,
        statusCode: response.status,
        errorType,
        message: `HTTP ${response.status}: ${response.statusText}`,
      });

      return null;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength === "0") {
      return null;
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return null;
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  } catch (error: any) {
    const errorType =
      error.name === "AbortError"
        ? "timeout"
        : error.name === "TypeError"
          ? "network"
          : "unknown";

    trackRagApiError({
      endpoint: url,
      method,
      errorType,
      message: error.message || "Unknown request error",
      stack: error.stack,
    });

    if (throwOnTimeout && error.name === "AbortError") {
      throw new Error("timeout");
    }

    return null;
  }
}

export async function searchExternalRAG(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
  } = {},
  token?: string,
): Promise<ExternalRAGResult[]> {
  if (!query?.trim()) {
    return [];
  }

  const searchQuery = query.trim();

  const params = new URLSearchParams();
  params.append("search", searchQuery);

  if (options.limit) {
    params.append("limit", options.limit.toString());
  }
  if (options.threshold) {
    params.append("threshold", options.threshold.toString());
  }

  const endpoint = resolveApiUrl(
    apiDocs.machineLearning.searchBookEmbeddings,
    "/machine-learning/books/embeddings/search",
  );
  const url = `${endpoint}?${params.toString()}`;

  let response: any | null = null;
  try {
    response = await apiRequest<any>(url, {}, token, DEFAULT_TIMEOUT_MS, true);
  } catch (error: any) {
    if (error?.message === "timeout") {
      response = await apiRequest<any>(url, {}, token, RETRY_TIMEOUT_MS);
    } else {
      throw error;
    }
  }

  if (!response) {
    return [];
  }

  let results: ExternalRAGResult[] = [];

  if (Array.isArray(response)) {
    results = response.map(normalizeResult);
  } else if (response.results && Array.isArray(response.results)) {
    results = response.results.map(normalizeResult);
  } else if (response.data && Array.isArray(response.data)) {
    results = response.data.map(normalizeResult);
  } else if (response.documents && Array.isArray(response.documents)) {
    results = response.documents.map(normalizeResult);
  } else {
    return [];
  }

  return results;
}

function normalizeResult(item: any): ExternalRAGResult {
  return {
    content: item.content || item.text || item.chunk || item.document || "",
    similarity: item.similarity || item.score || item.relevance || 0,
    metadata: {
      bookId:
        item.bookId ||
        item.book_id ||
        item.metadata?.bookId ||
        item.metadata?.book_id,
      bookTitle:
        item.bookTitle ||
        item.book_title ||
        item.title ||
        item.metadata?.bookTitle ||
        item.metadata?.book_title,
      source: item.source || item.metadata?.source,
      citation: item.citation || item.metadata?.citation,
      chunkIndex:
        item.chunkIndex ||
        item.chunk_index ||
        item.metadata?.chunkIndex ||
        item.metadata?.chunk_index,
      tokenEstimate:
        item.tokenEstimate ||
        item.token_estimate ||
        item.tokens ||
        item.metadata?.tokenEstimate,
      pageNumber:
        item.pageNumber ||
        item.page_number ||
        item.page ||
        item.metadata?.pageNumber ||
        item.metadata?.page_number,
      ...item.metadata,
    },
  };
}

export function formatExternalRAGContext(
  results: ExternalRAGResult[],
  options: {
    maxResults?: number;
    includeQualityHeader?: boolean;
  } = {},
): string {
  if (results.length === 0) {
    return "";
  }

  const maxResults = options.maxResults || 5;
  const limitedResults = results.slice(0, maxResults);

  let qualityHeader = "";
  if (options.includeQualityHeader && limitedResults.length > 0) {
    const avgSimilarity =
      limitedResults.reduce((sum, r) => sum + r.similarity, 0) /
      limitedResults.length;
    const qualityLevel =
      avgSimilarity >= 0.7
        ? "High"
        : avgSimilarity >= 0.5
          ? "Medium"
          : avgSimilarity >= 0.3
            ? "Low"
            : "Very Low";
    qualityHeader = `[External RAG Quality: ${qualityLevel}, Avg Similarity: ${avgSimilarity.toFixed(3)}, Results: ${limitedResults.length}]\n\n`;
  }

  const formattedChunks = limitedResults.map((result) => {
    const { content, similarity, metadata } = result;

    const sourceParts: string[] = [];
    sourceParts.push("Source: External API");
    if (metadata.bookTitle) {
      sourceParts.push(`Book: ${metadata.bookTitle}`);
    }
    if (metadata.citation && metadata.citation !== "Unknown") {
      sourceParts.push(metadata.citation);
    }
    sourceParts.push(`Similarity: ${similarity.toFixed(3)}`);

    const sourceInfo = `[${sourceParts.join(" | ")}]`;
    return `${sourceInfo}\n${content}`;
  });

  return qualityHeader + formattedChunks.join("\n\n---\n\n");
}

export async function _fetchExternalRAGContext(
  searchQuery: string,
  authToken?: string,
): Promise<string> {
  if (!searchQuery?.trim()) {
    return "";
  }

  const query = searchQuery.trim();

  const limit = parseInt(process.env.EXTERNAL_RAG_LIMIT || "3", 10);
  const threshold = parseFloat(process.env.EXTERNAL_RAG_THRESHOLD || "0.5");
  const cacheTtlMs = parseInt(
    process.env.EXTERNAL_RAG_CACHE_TTL_MS || "300000",
    10,
  );

  const hash = createHash("sha256")
    .update(`${authToken || "anon"}:${query}:${limit}:${threshold}`)
    .digest("hex");

  const cached = externalRagCache.get(hash);
  if (cached && Date.now() - cached.timestamp < cacheTtlMs) {
    return cached.value;
  }

  try {
    const results = await searchExternalRAG(
      query,
      {
        limit,
        threshold,
      },
      authToken,
    );

    if (results.length === 0) {
      return "";
    }

    const contextText = formatExternalRAGContext(results, {
      maxResults: 5,
      includeQualityHeader: true,
    });

    const trimmed = contextText.trim();
    externalRagCache.set(hash, { timestamp: Date.now(), value: trimmed });
    return trimmed;
  } catch {
    return "";
  }
}

const externalRagCache = new Map<
  string,
  { timestamp: number; value: string }
>();

export function isExternalRAGAvailable(): boolean {
  try {
    return !!apiDocs.baseURL;
  } catch {
    return false;
  }
}

export function getExternalRAGConfig(): {
  baseUrl: string;
  isConfigured: boolean;
} {
  let baseUrl = "";
  try {
    baseUrl = apiDocs.baseURL;
  } catch {
    baseUrl = "";
  }
  return {
    baseUrl,
    isConfigured: !!baseUrl,
  };
}
