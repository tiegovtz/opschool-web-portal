/**
 * Figures API Client
 * 
 * Handles all interactions with the external Figures API
 * Maps API response fields to match JSON format (subject→subjectName, chapter→chapterName, topic→topicName)
 */

import type { ApiFigure, MappedFigure, GetFiguresOptions } from '~/types/figures.interface';
import { Config } from '~/constants/config';

const API_BASE_URL = Config.FIGURES_API_BASE_URL;

// Cache for API responses
const figureCache: Map<string, { data: MappedFigure | MappedFigure[]; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get authentication token
 * Tries to get from auth store, environment variable, or returns empty string
 */
async function getAuthToken(): Promise<string> {
  // Try to get from auth store (client-side)
  if (process.client) {
    try {
      const { useAuthStore } = await import('~/stores/auth');
      const authStore = useAuthStore();
      if (authStore.token) {
        return authStore.token;
      }
    } catch (error) {
      // Auth store not available, continue
    }
  }
  
  // Try environment variable (server-side)
  if (process.server) {
    return process.env.FIGURES_API_TOKEN || '';
  }
  
  return '';
}

/**
 * Map API figure response to JSON format
 * API returns fields with "Name" suffix (subjectName, chapterName, topicName)
 */
function mapApiFigureToJsonFormat(apiFigure: ApiFigure): MappedFigure {
  const apiFigureAny = apiFigure as any;
  
  const mapped: MappedFigure = {
    shortcode: apiFigure.shortcode,
    alt: apiFigure.caption || apiFigure.alt || '',
    category: (apiFigure.category as MappedFigure['category']) || 'general',
  };

  // Map path fields - handle images array from API
  if (apiFigureAny.images && Array.isArray(apiFigureAny.images) && apiFigureAny.images.length > 1) {
    // Multi-image
    mapped.paths = apiFigureAny.images.map((img: any) => img.url || img.path || img);
    mapped.alts = apiFigureAny.images.map((img: any) => img.alt || apiFigure.alt || '');
  } else if (apiFigureAny.images && Array.isArray(apiFigureAny.images) && apiFigureAny.images.length === 1) {
    // Single image in images array
    const img = apiFigureAny.images[0];
    mapped.path = img.url || img.path || img;
  } else if (apiFigure.paths && apiFigure.paths.length > 1) {
    mapped.paths = apiFigure.paths;
    mapped.alts = apiFigure.alts || [];
  } else if (apiFigure.paths && apiFigure.paths.length === 1) {
    mapped.path = apiFigure.paths[0];
  } else if (apiFigure.path) {
    mapped.path = apiFigure.path;
  }

  // Map metadata fields - API returns fields with "Name" suffix
  if (apiFigure.description) {
    mapped.description = apiFigure.description;
  }
  // Handle both API formats: subjectName OR subject
  if (apiFigureAny.subjectName) {
    mapped.subjectName = apiFigureAny.subjectName;
  } else if (apiFigure.subject) {
    mapped.subjectName = apiFigure.subject;
  }
  // Handle both API formats: chapterName OR chapter
  if (apiFigureAny.chapterName) {
    mapped.chapterName = apiFigureAny.chapterName;
  } else if (apiFigure.chapter) {
    mapped.chapterName = apiFigure.chapter;
  }
  // Handle both API formats: topicName OR topic
  if (apiFigureAny.topicName) {
    mapped.topicName = apiFigureAny.topicName;
  } else if (apiFigure.topic) {
    mapped.topicName = apiFigure.topic;
  }
  // Handle both: figureNumber OR figure_number
  if (apiFigureAny.figureNumber) {
    mapped.figure_number = apiFigureAny.figureNumber;
  } else if (apiFigure.figure_number) {
    mapped.figure_number = apiFigure.figure_number;
  }
  // Handle both: pageNumber OR page_number
  if (apiFigureAny.pageNumber) {
    mapped.page_number = apiFigureAny.pageNumber;
  } else if (apiFigure.page_number) {
    mapped.page_number = apiFigure.page_number;
  }

  return mapped;
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Not found - return null instead of throwing
      }
      console.error(`[figuresApi] API error ${response.status}: ${response.statusText}`);
      return null;
    }

    // Check if response is empty
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
    } catch (parseError) {
      console.error('[figuresApi] Failed to parse JSON response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('[figuresApi] Request failed:', error);
    return null;
  }
}

/**
 * Get a single figure by shortcode
 * NOTE: Fetches from /figures list and filters because /figures/shortcode/:shortcode returns limited fields
 */
export async function getFigureByShortcode(shortcode: string): Promise<MappedFigure | null> {
  const cacheKey = `shortcode:${shortcode}`;
  const cached = figureCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Array.isArray(cached.data) ? cached.data[0] : cached.data;
  }

  // Fetch all figures and find by shortcode (workaround for API returning limited fields)
  const figures = await getFigures({});
  
  if (!figures || figures.length === 0) {
    return null;
  }
  
  const figure = figures.find(f => f.shortcode === shortcode);
  
  if (figure) {
    figureCache.set(cacheKey, { data: figure, timestamp: Date.now() });
  }
  
  return figure || null;
}

/**
 * Get multiple figures with optional filtering
 * NOTE: The API has a bug where limit/offset parameters return empty results.
 * Do NOT pass limit or offset - the API returns all figures without pagination.
 */
export async function getFigures(options: GetFiguresOptions = {}): Promise<MappedFigure[]> {
  const params = new URLSearchParams();
  
  // NOTE: Do NOT add limit/offset - the API returns 0 items when these are present!
  // This is an API bug that needs to be fixed on the backend.
  // if (options.limit) params.append('limit', options.limit.toString());
  // if (options.offset) params.append('offset', options.offset.toString());
  
  if (options.subject) {
    params.append('subject', options.subject);
  }
  if (options.category) {
    // API is case-sensitive - use lowercase
    params.append('category', options.category.toLowerCase());
  }
  if (options.chapter) {
    params.append('chapter', options.chapter);
  }
  if (options.topic) {
    params.append('topic', options.topic);
  }
  if (options.shortcode) {
    params.append('shortcode', options.shortcode);
  }

  const queryString = params.toString();
  const cacheKey = `figures:${queryString}`;
  const cached = figureCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return Array.isArray(cached.data) ? cached.data : [cached.data];
  }

  const endpoint = `/figures${queryString ? `?${queryString}` : ''}`;
  const response = await apiRequest<ApiFigure[]>(endpoint);
  
  if (!response || !Array.isArray(response)) {
    return [];
  }

  const mapped = response.map(mapApiFigureToJsonFormat);
  figureCache.set(cacheKey, { data: mapped, timestamp: Date.now() });
  
  return mapped;
}

/**
 * Get figures by subject
 */
export async function getFiguresBySubject(subject: string, limit?: number): Promise<MappedFigure[]> {
  return getFigures({ subject, limit });
}

/**
 * Get figures by category
 */
export async function getFiguresByCategory(category: string, limit?: number): Promise<MappedFigure[]> {
  return getFigures({ category, limit });
}

/**
 * Get figures by chapter
 */
export async function getFiguresByChapter(chapter: string, subject?: string, limit?: number): Promise<MappedFigure[]> {
  return getFigures({ chapter, subject, limit });
}

/**
 * Clear the API cache
 */
export function clearFiguresCache(): void {
  figureCache.clear();
}

