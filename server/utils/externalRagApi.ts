/**
 * External RAG API Client
 * 
 * Handles server-side interactions with the external Machine Learning RAG API
 * Endpoint: /machine-learning/books/embeddings/search?search={query}
 * 
 * Uses the same base URL (VITE_API_BASE_URL) and authentication pattern as the rest of the app:
 * - User's auth token from request (cookie or Authorization header)
 * - No service account needed - uses the user's session
 */

import { trackFiguresApiError, categorizeHttpError } from './errorTracking';

// API Configuration - uses VITE_API_BASE_URL from .env (same as client-side)
// This ensures consistency with apiDocs.ts and other API calls
const API_BASE_URL = process.env.VITE_API_BASE_URL || "https://apitie.ekima.africa/v1";

// Debug logging control
const DEBUG = process.env.NODE_ENV !== 'production' || process.env.DEBUG_RAG === 'true';
const log = (...args: any[]) => DEBUG && console.log(...args);

// ============================================
// Types
// ============================================

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

// ============================================
// Authentication
// ============================================

/**
 * Get authentication token
 * Uses the user's auth token passed from the request
 * This follows the same pattern as the rest of the app - user must be logged in
 */
function getAuthToken(token?: string): string {
  // Use provided token (from cookie signInAccessToken or Authorization header)
  if (token && token.trim()) {
    log('[externalRagApi] Using user auth token');
    return token;
  }
  
  // No token available - user needs to be logged in
  log('[externalRagApi] No auth token provided - user may need to log in');
  return '';
}

// ============================================
// API Request Helper
// ============================================

/**
 * Make authenticated API request to external RAG service
 * Uses the same base URL and auth pattern as the rest of the app
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T | null> {
  const method = (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  try {
    const authToken = getAuthToken(token);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      log(`[externalRagApi] Request with auth token to: ${endpoint}`);
    } else {
      console.warn('[externalRagApi] No auth token - request may fail if endpoint requires auth');
    }
    
    // Merge any additional headers from options
    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>;
      Object.assign(headers, optHeaders);
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    log(`[externalRagApi] Making request to: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorType = categorizeHttpError(response.status);
      
      if (response.status === 404) {
        log('[externalRagApi] 404 - Endpoint not found:', endpoint);
        return null;
      }
      
      trackFiguresApiError({
        endpoint,
        method,
        statusCode: response.status,
        errorType,
        message: `HTTP ${response.status}: ${response.statusText}`,
      });
      
      if (response.status === 401) {
        console.warn('[externalRagApi] 401 - Unauthorized. User may need to log in.');
      } else {
        console.error(`[externalRagApi] API error ${response.status}: ${response.statusText}`);
      }
      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return null;
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      log('[externalRagApi] Empty response body');
      return null;
    }

    try {
      const parsed = JSON.parse(text) as T;
      log(`[externalRagApi] Successfully parsed response`);
      return parsed;
    } catch (parseError: any) {
      console.error('[externalRagApi] Failed to parse JSON response:', parseError);
      console.error('[externalRagApi] Response text (first 500 chars):', text.substring(0, 500));
      return null;
    }
  } catch (error: any) {
    console.error('[externalRagApi] Request failed:', error);
    
    const errorType = error.name === 'AbortError' ? 'timeout' : 
                      error.name === 'TypeError' ? 'network' : 'unknown';
    
    trackFiguresApiError({
      endpoint,
      method,
      errorType,
      message: error.message || 'Unknown request error',
      stack: error.stack,
    });
    
    return null;
  }
}

// ============================================
// External RAG Search Functions
// ============================================

/**
 * Search the external RAG API for relevant context
 * 
 * @param query - The search query
 * @param options - Search options
 * @param token - User's authentication token (from cookie or header)
 * @returns Array of search results with content and metadata
 */
export async function searchExternalRAG(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
  } = {},
  token?: string
): Promise<ExternalRAGResult[]> {
  if (!query?.trim()) {
    log('[externalRagApi] Empty search query, skipping');
    return [];
  }

  const searchQuery = query.trim();
  log(`[externalRagApi] Searching for: "${searchQuery.substring(0, 100)}"`);

  // Build query parameters
  const params = new URLSearchParams();
  params.append('search', searchQuery);
  
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }
  if (options.threshold) {
    params.append('threshold', options.threshold.toString());
  }

  const endpoint = `/machine-learning/books/embeddings/search?${params.toString()}`;
  
  const response = await apiRequest<any>(endpoint, {}, token);
  
  if (!response) {
    log('[externalRagApi] No response from API');
    return [];
  }

  // Handle different response formats
  let results: ExternalRAGResult[] = [];
  
  if (Array.isArray(response)) {
    // Format 1: Direct array of results
    results = response.map(normalizeResult);
  } else if (response.results && Array.isArray(response.results)) {
    // Format 2: Object with results property
    results = response.results.map(normalizeResult);
  } else if (response.data && Array.isArray(response.data)) {
    // Format 3: Object with data property
    results = response.data.map(normalizeResult);
  } else if (response.documents && Array.isArray(response.documents)) {
    // Format 4: Object with documents property
    results = response.documents.map(normalizeResult);
  } else {
    console.warn('[externalRagApi] Unexpected response format:', {
      isArray: Array.isArray(response),
      keys: Object.keys(response || {}),
      type: typeof response
    });
    return [];
  }

  log(`[externalRagApi] Found ${results.length} results`);
  return results;
}

/**
 * Normalize different API response formats to consistent structure
 */
function normalizeResult(item: any): ExternalRAGResult {
  return {
    content: item.content || item.text || item.chunk || item.document || '',
    similarity: item.similarity || item.score || item.relevance || 0,
    metadata: {
      bookId: item.bookId || item.book_id || item.metadata?.bookId || item.metadata?.book_id,
      bookTitle: item.bookTitle || item.book_title || item.title || item.metadata?.bookTitle || item.metadata?.book_title,
      source: item.source || item.metadata?.source,
      citation: item.citation || item.metadata?.citation,
      chunkIndex: item.chunkIndex || item.chunk_index || item.metadata?.chunkIndex || item.metadata?.chunk_index,
      tokenEstimate: item.tokenEstimate || item.token_estimate || item.tokens || item.metadata?.tokenEstimate,
      pageNumber: item.pageNumber || item.page_number || item.page || item.metadata?.pageNumber || item.metadata?.page_number,
      ...item.metadata,
    },
  };
}

/**
 * Format external RAG results into context text with citations
 */
export function formatExternalRAGContext(
  results: ExternalRAGResult[],
  options: {
    maxResults?: number;
    includeQualityHeader?: boolean;
  } = {}
): string {
  if (results.length === 0) {
    return "";
  }

  const maxResults = options.maxResults || 5;
  const limitedResults = results.slice(0, maxResults);

  // Build quality indicator header if requested
  let qualityHeader = "";
  if (options.includeQualityHeader && limitedResults.length > 0) {
    const avgSimilarity = limitedResults.reduce((sum, r) => sum + r.similarity, 0) / limitedResults.length;
    const qualityLevel = avgSimilarity >= 0.7 ? "High" : avgSimilarity >= 0.5 ? "Medium" : avgSimilarity >= 0.3 ? "Low" : "Very Low";
    qualityHeader = `[External RAG Quality: ${qualityLevel}, Avg Similarity: ${avgSimilarity.toFixed(3)}, Results: ${limitedResults.length}]\n\n`;
  }

  const formattedChunks = limitedResults.map((result) => {
    const { content, similarity, metadata } = result;
    
    // Build source information
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

/**
 * Fetches RAG context from the external API
 * This is the main function to use for external RAG
 * 
 * NOTE: Named with underscore prefix to avoid Nuxt auto-import conflicts with rag.ts
 * Import this directly: import { _fetchExternalRAGContext } from "./externalRagApi"
 * 
 * @param searchQuery - The search query
 * @param authToken - User's authentication token (from cookie signInAccessToken or Authorization header)
 * @returns Formatted context text with citations, or empty string if no results
 */
export async function _fetchExternalRAGContext(
  searchQuery: string,
  authToken?: string
): Promise<string> {
  if (!searchQuery?.trim()) {
    log("[External RAG] Empty search query, skipping");
    return "";
  }

  const query = searchQuery.trim();
  log(`[External RAG] Starting search for: "${query.substring(0, 100)}"`);

  try {
    const results = await searchExternalRAG(
      query,
      {
        limit: 5,
        threshold: 0.3, // Lower threshold to get more results
      },
      authToken
    );

    if (results.length === 0) {
      log(`[External RAG] No results found for query: "${query.substring(0, 50)}"`);
      return "";
    }

    log(`[External RAG] Found ${results.length} results`);

    const contextText = formatExternalRAGContext(results, {
      maxResults: 5,
      includeQualityHeader: true,
    });

    if (contextText.trim()) {
      log(`[External RAG] Generated context text (${contextText.length} characters)`);
      return contextText.trim();
    }

    return "";
  } catch (error: any) {
    console.error("[External RAG] Search failed:", error?.message || error);
    return "";
  }
}

/**
 * Check if external RAG API is available
 * Returns true if the API base URL is configured
 */
export function isExternalRAGAvailable(): boolean {
  return !!API_BASE_URL;
}

/**
 * Get external RAG API configuration info (for debugging)
 */
export function getExternalRAGConfig(): {
  baseUrl: string;
  isConfigured: boolean;
} {
  return {
    baseUrl: API_BASE_URL,
    isConfigured: !!API_BASE_URL,
  };
}
