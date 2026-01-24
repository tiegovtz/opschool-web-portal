/**
 * External RAG API Client
 * 
 * Handles server-side interactions with the external Machine Learning RAG API
 * Endpoint: /machine-learning/books/embeddings/search?search={query}
 * 
 * Uses the same base URL (VITE_API_BASE_URL) and authentication pattern as the rest of the app
 */

import { trackFiguresApiError, categorizeHttpError } from './errorTracking';

const API_BASE_URL = process.env.VITE_API_BASE_URL || "https://apitie.ekima.africa/v1";

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
  return '';
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T | null> {
  const method = (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  try {
    const authToken = getAuthToken(token);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>;
      Object.assign(headers, optHeaders);
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorType = categorizeHttpError(response.status);
      
      if (response.status === 404) {
        return null;
      }
      
      trackFiguresApiError({
        endpoint,
        method,
        statusCode: response.status,
        errorType,
        message: `HTTP ${response.status}: ${response.statusText}`,
      });
      
      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
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

export async function searchExternalRAG(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
  } = {},
  token?: string
): Promise<ExternalRAGResult[]> {
  if (!query?.trim()) {
    return [];
  }

  const searchQuery = query.trim();

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

  let qualityHeader = "";
  if (options.includeQualityHeader && limitedResults.length > 0) {
    const avgSimilarity = limitedResults.reduce((sum, r) => sum + r.similarity, 0) / limitedResults.length;
    const qualityLevel = avgSimilarity >= 0.7 ? "High" : avgSimilarity >= 0.5 ? "Medium" : avgSimilarity >= 0.3 ? "Low" : "Very Low";
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
  authToken?: string
): Promise<string> {
  if (!searchQuery?.trim()) {
    return "";
  }

  const query = searchQuery.trim();

  try {
    const results = await searchExternalRAG(
      query,
      {
        limit: 5,
        threshold: 0.3,
      },
      authToken
    );

    if (results.length === 0) {
      return "";
    }

    const contextText = formatExternalRAGContext(results, {
      maxResults: 5,
      includeQualityHeader: true,
    });

    return contextText.trim();
  } catch {
    return "";
  }
}

export function isExternalRAGAvailable(): boolean {
  return !!API_BASE_URL;
}

export function getExternalRAGConfig(): {
  baseUrl: string;
  isConfigured: boolean;
} {
  return {
    baseUrl: API_BASE_URL,
    isConfigured: !!API_BASE_URL,
  };
}
