/**
 * Server-side Figures API Client
 * 
 * Handles server-side interactions with the external Figures API
 * Maps API response fields to match JSON format (subject→subjectName, chapter→chapterName, topic→topicName)
 * 
 * Features:
 * - Service account authentication with token caching
 * - Redis/memory caching for improved performance
 * - Error tracking for monitoring and debugging
 */

import type { ApiFigure, MappedFigure } from '~/types/figures.interface';
import { trackFiguresApiError, categorizeHttpError } from './errorTracking';
import { 
  getCachedFigures, 
  setCachedFigures, 
  getCachedFigureByShortcode, 
  setCachedFigure,
  invalidateFigureCache 
} from './figuresCache';

const API_BASE_URL = process.env.FIGURES_API_BASE_URL || "https://opschool.tie.go.tz:5001/v1";

// Service account credentials for server-side API access
const SERVICE_USERNAME = process.env.FIGURES_API_USERNAME || 'eric.john';
const SERVICE_PASSWORD = process.env.FIGURES_API_PASSWORD || 'Ejb201313!';

// Cached service token
let cachedServiceToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get a service account token for server-side API access
 * Caches the token for 1 hour to avoid repeated logins
 */
async function getServiceToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedServiceToken && Date.now() < tokenExpiresAt - 300000) {
    console.log('[figuresApi] Using cached service token');
    return cachedServiceToken;
  }

  // Check if service credentials are configured
  if (!SERVICE_USERNAME || !SERVICE_PASSWORD) {
    console.error('[figuresApi] Service account credentials not configured (SERVICE_USERNAME or SERVICE_PASSWORD missing)');
    return '';
  }

  try {
    console.log('[figuresApi] Logging in with service account...');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: SERVICE_USERNAME,
        password: SERVICE_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[figuresApi] Service login failed: ${response.status} ${response.statusText}`, errorText);
      // Clear cache on failure
      cachedServiceToken = null;
      tokenExpiresAt = 0;
      return '';
    }

    const data = await response.json();
    const token = data.access_token || data.accessToken || data.token;

    if (token) {
      cachedServiceToken = token;
      // Cache for 1 hour
      tokenExpiresAt = Date.now() + 3600000;
      console.log('[figuresApi] Service login successful, token cached');
      return token;
    }

    console.error('[figuresApi] No token in service login response:', data);
    // Clear cache on failure
    cachedServiceToken = null;
    tokenExpiresAt = 0;
    return '';
  } catch (error: any) {
    console.error('[figuresApi] Service login error:', error?.message || error);
    // Clear cache on failure
    cachedServiceToken = null;
    tokenExpiresAt = 0;
    return '';
  }
}

/**
 * Get authentication token from parameter, environment, or service login
 */
async function getAuthToken(token?: string): Promise<string> {
  // Priority: provided token > environment variable > service login
  if (token && token.trim()) {
    console.log('[figuresApi] Using provided user token');
    return token;
  }
  if (process.env.FIGURES_API_TOKEN) {
    console.log('[figuresApi] Using environment variable token');
    return process.env.FIGURES_API_TOKEN;
  }
  
  // Fall back to service account login
  console.log('[figuresApi] No user token provided, attempting service login...');
  return await getServiceToken();
}

/**
 * Map API figure response to JSON format
 * Converts: subject → subjectName, chapter → chapterName, topic → topicName
 */
function mapApiFigureToJsonFormat(apiFigure: ApiFigure): MappedFigure {
  const mapped: MappedFigure = {
    shortcode: apiFigure.shortcode,
    alt: apiFigure.caption || apiFigure.alt || '',
    category: (apiFigure.category as MappedFigure['category']) || 'general',
  };

  // Map path fields - check for images array first (API format), then paths array, then path
  const apiFigureAny = apiFigure as any;
  if (apiFigureAny.images && Array.isArray(apiFigureAny.images) && apiFigureAny.images.length > 1) {
    // Multi-image: API returns images array with { url, alt } objects
    mapped.paths = apiFigureAny.images.map((img: any) => img.url || img.path || img);
    mapped.alts = apiFigureAny.images.map((img: any) => img.alt || apiFigure.alt || '');
  } else if (apiFigureAny.images && Array.isArray(apiFigureAny.images) && apiFigureAny.images.length === 1) {
    // Single image in images array - treat as single image, not multi-image
    const img = apiFigureAny.images[0];
    mapped.path = img.url || img.path || img;
    mapped.alt = img.alt || apiFigure.alt || apiFigure.caption || '';
  } else if (apiFigure.paths && apiFigure.paths.length > 1) {
    // Multi-image from paths array
    mapped.paths = apiFigure.paths;
    mapped.alts = apiFigure.alts || [];
  } else if (apiFigure.paths && apiFigure.paths.length === 1) {
    // Single image from paths array
    mapped.path = apiFigure.paths[0];
  } else if (apiFigure.path) {
    mapped.path = apiFigure.path;
  }

  // Map metadata fields - API returns fields with "Name" suffix (subjectName, chapterName, topicName)
  // Note: apiFigureAny is already declared above for handling images
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
 * Make authenticated API request (server-side)
 * Includes error tracking for monitoring failed requests
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}, token?: string): Promise<T | null> {
  const method = (options.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  try {
    const authToken = await getAuthToken(token);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (authToken && authToken.trim()) {
      headers['Authorization'] = `Bearer ${authToken}`;
      console.log(`[figuresApi] Using ${token ? 'provided' : 'service'} auth token for ${endpoint}`);
    } else {
      console.error('[figuresApi] No auth token available for request to', endpoint);
      console.error('[figuresApi] Token source:', token ? 'provided' : 'service/environment');
      trackFiguresApiError({
        endpoint,
        method,
        errorType: 'auth',
        message: 'No authentication token available',
      });
      // Don't make the request if we have no token - it will definitely fail
      return null;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorType = categorizeHttpError(response.status);
      
      if (response.status === 404) {
        console.log('[figuresApi] 404 - Endpoint not found');
        return null; // Not found - return null instead of throwing
      }
      
      // Track non-404 errors
      trackFiguresApiError({
        endpoint,
        method,
        statusCode: response.status,
        errorType,
        message: `HTTP ${response.status}: ${response.statusText}`,
      });
      
      if (response.status === 401) {
        console.error('[figuresApi] 401 - Unauthorized. Check authentication token.');
      } else {
        console.error(`[figuresApi] API error ${response.status}: ${response.statusText}`);
      }
      return null;
    }

    // Check if response is empty
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      return null;
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      console.log('[figuresApi] Empty response body');
      return null;
    }

    try {
      const parsed = JSON.parse(text) as T;
      console.log(`[figuresApi] Successfully parsed response, type: ${typeof parsed}, isArray: ${Array.isArray(parsed)}`);
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        console.log(`[figuresApi] Response keys: ${Object.keys(parsed).join(', ')}`);
      }
      return parsed;
    } catch (parseError: any) {
      console.error('[figuresApi] Failed to parse JSON response:', parseError);
      console.error('[figuresApi] Response text (first 500 chars):', text.substring(0, 500));
      
      trackFiguresApiError({
        endpoint,
        method,
        errorType: 'parse',
        message: `Failed to parse JSON: ${parseError.message}`,
        stack: parseError.stack,
      });
      
      return null;
    }
  } catch (error: any) {
    console.error('[figuresApi] Request failed:', error);
    
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

/**
 * Get a single figure by shortcode (server-side)
 * NOTE: The /figures/shortcode/:shortcode endpoint returns limited fields,
 * so we fetch from /figures and filter to get all metadata.
 * Uses caching to improve performance.
 * @param shortcode - The shortcode to look up
 * @param token - Optional authentication token (if not provided, uses environment variable)
 */
export async function getFigureByShortcode(shortcode: string, token?: string): Promise<MappedFigure | null> {
  // Check cache first
  const cached = await getCachedFigureByShortcode(shortcode);
  if (cached) {
    console.log(`[figuresApi] Cache HIT for shortcode: ${shortcode}`);
    return cached;
  }
  
  // Fetch all figures and find by shortcode (workaround for API returning limited fields)
  const figures = await getFigures({}, token);
  
  if (!figures || figures.length === 0) {
    return null;
  }
  
  const figure = figures.find(f => f.shortcode === shortcode);
  
  // Cache the result if found
  if (figure) {
    await setCachedFigure(figure);
  }
  
  return figure || null;
}

/**
 * Get multiple figures with optional filtering (server-side)
 * NOTE: The API has a bug where limit/offset parameters return empty results.
 * Do NOT pass limit or offset - the API returns all figures without pagination.
 * Uses Redis/memory caching for improved performance.
 * @param options - Filtering options (limit/offset are ignored due to API bug)
 * @param token - Optional authentication token (if not provided, uses environment variable)
 */
export async function getFigures(options: {
  limit?: number;  // IGNORED - API bug returns 0 with pagination params
  offset?: number; // IGNORED - API bug returns 0 with pagination params
  subject?: string;
  category?: string;
  chapter?: string;
  topic?: string;
} = {}, token?: string): Promise<MappedFigure[]> {
  // Check cache for unfiltered requests (most common case)
  const hasFilters = options.subject || options.category || options.chapter || options.topic;
  
  if (!hasFilters) {
    const cached = await getCachedFigures();
    if (cached) {
      console.log(`[figuresApi] Cache HIT for all figures (${cached.length} items)`);
      return cached;
    }
  }
  
  const params = new URLSearchParams();
  
  // NOTE: Do NOT add limit/offset - the API returns 0 items when these are present!
  // This is an API bug that needs to be fixed on the backend.
  // See: docs/API_BUG_REPORT_LIMIT_PARAMETER.md
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

  const queryString = params.toString();
  const endpoint = `/figures${queryString ? `?${queryString}` : ''}`;
  console.log(`[figuresApi] Fetching from: ${endpoint}`);
  const response = await apiRequest<any>(endpoint, {}, token);
  
  if (!response) {
    console.log('[figuresApi] No response from API');
    return [];
  }

  // Handle different response formats
  let figuresArray: ApiFigure[] = [];
  
  if (Array.isArray(response)) {
    // Format 1: Direct array
    figuresArray = response;
  } else if (response.data && Array.isArray(response.data)) {
    // Format 2: Object with data property
    figuresArray = response.data;
  } else if (response.figures && Array.isArray(response.figures)) {
    // Format 3: Object with figures property
    figuresArray = response.figures;
  } else if (response.results && Array.isArray(response.results)) {
    // Format 4: Object with results property
    figuresArray = response.results;
  } else {
    console.warn('[figuresApi] Unexpected response format:', {
      isArray: Array.isArray(response),
      keys: Object.keys(response || {}),
      type: typeof response
    });
    return [];
  }

  console.log(`[figuresApi] Parsed ${figuresArray.length} figures from API response`);
  
  const mapped = figuresArray.map(mapApiFigureToJsonFormat);
  
  // Cache unfiltered results for future requests
  if (!hasFilters && mapped.length > 0) {
    await setCachedFigures(mapped);
    console.log(`[figuresApi] Cached ${mapped.length} figures`);
  }
  
  return mapped;
}

/**
 * Create a new figure in the API (server-side)
 * @param data - Figure data to create
 * @param token - Optional authentication token (if not provided, uses environment variable)
 */
export async function createFigure(data: {
  shortcode: string;
  alt: string;
  description: string;
  category: string;
  subjectName: string;
  chapterName: string;
  topicName: string;
  figureNumber: string;
  path?: string;
  paths?: string[];
  alts?: string[];
  page_number?: number;
}, token?: string): Promise<MappedFigure | null> {
  try {
    const authToken = getAuthToken(token);
    
    // Prepare images array - API expects images array format
    const images: Array<{ url: string; alt?: string }> = [];
    if (data.paths && data.paths.length > 0) {
      data.paths.forEach((path, index) => {
        images.push({
          url: path,
          alt: data.alts?.[index] || data.alt
        });
      });
    } else if (data.path) {
      images.push({
        url: data.path,
        alt: data.alt
      });
    }

    // API expects JSON format field names (subjectName, chapterName, topicName)
    const apiData: any = {
      shortcode: data.shortcode,
      alt: data.alt,
      description: data.description || data.alt || 'No description available',
      category: data.category,
      subjectName: data.subjectName || '',
      chapterName: data.chapterName || '',
      topicName: data.topicName || '',
      figureNumber: data.figureNumber || '',
      images: images,
    };
    
    if (data.page_number !== undefined) {
      apiData.page_number = data.page_number;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/figures`, {
      method: 'POST',
      headers,
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[figuresApi] Failed to create figure: ${response.status} - ${errorData.message || response.statusText}`);
      throw new Error(errorData.message || `Failed to create figure: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return null;
    }

    const apiFigure = JSON.parse(text) as ApiFigure;
    const mappedFigure = mapApiFigureToJsonFormat(apiFigure);
    
    // Invalidate cache after successful creation
    await invalidateFigureCache();
    
    return mappedFigure;
  } catch (error: any) {
    console.error('[figuresApi] Error creating figure:', error);
    
    trackFiguresApiError({
      endpoint: '/figures',
      method: 'POST',
      errorType: 'unknown',
      message: error.message || 'Unknown create error',
      stack: error.stack,
      requestParams: data,
    });
    
    throw error;
  }
}

/**
 * Update an existing figure in the API (server-side)
 * @param shortcode - The shortcode to update
 * @param data - Updated figure data
 * @param token - Optional authentication token (if not provided, uses environment variable)
 */
export async function updateFigure(shortcode: string, data: {
  alt?: string;
  description?: string;
  category?: string;
  subjectName?: string;
  chapterName?: string;
  topicName?: string;
  figureNumber?: string;
  path?: string;
  paths?: string[];
  alts?: string[];
  page_number?: number;
}, token?: string): Promise<MappedFigure | null> {
  try {
    // First, get the existing figure to get its ID
    const existing = await getFigureByShortcode(shortcode, token);
    if (!existing) {
      throw new Error(`Figure with shortcode ${shortcode} not found`);
    }

    const authToken = getAuthToken(token);
    
    // Prepare images array if paths are provided
    let images: Array<{ url: string; alt?: string }> | undefined = undefined;
    if (data.paths && data.paths.length > 0) {
      images = data.paths.map((path, index) => ({
        url: path,
        alt: data.alts?.[index] || data.alt || ''
      }));
    } else if (data.path) {
      images = [{
        url: data.path,
        alt: data.alt || ''
      }];
    }

    // Build update data - only include provided fields
    const apiData: any = {};
    if (data.alt !== undefined) apiData.alt = data.alt;
    if (data.description !== undefined) apiData.description = data.description;
    if (data.category !== undefined) apiData.category = data.category;
    if (data.subjectName !== undefined) apiData.subjectName = data.subjectName;
    if (data.chapterName !== undefined) apiData.chapterName = data.chapterName;
    if (data.topicName !== undefined) apiData.topicName = data.topicName;
    if (data.figureNumber !== undefined) apiData.figureNumber = data.figureNumber;
    if (data.page_number !== undefined) apiData.page_number = data.page_number;
    if (images !== undefined) apiData.images = images;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Try PUT /figures/shortcode/:shortcode first
    let response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(apiData),
    });

    // If that doesn't work, try PATCH
    if (!response.ok && response.status !== 404) {
      response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(apiData),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`[figuresApi] Failed to update figure: ${response.status} - ${errorData.message || response.statusText}`);
      throw new Error(errorData.message || `Failed to update figure: ${response.statusText}`);
    }

    const text = await response.text();
    
    // Invalidate cache after successful update
    await invalidateFigureCache(shortcode);
    
    if (!text || text.trim().length === 0) {
      // If empty response, fetch the updated figure
      return await getFigureByShortcode(shortcode, token);
    }

    const apiFigure = JSON.parse(text) as ApiFigure;
    return mapApiFigureToJsonFormat(apiFigure);
  } catch (error: any) {
    console.error('[figuresApi] Error updating figure:', error);
    
    trackFiguresApiError({
      endpoint: `/figures/shortcode/${shortcode}`,
      method: 'PUT',
      errorType: 'unknown',
      message: error.message || 'Unknown update error',
      stack: error.stack,
      requestParams: data,
    });
    
    throw error;
  }
}

/**
 * Delete a figure from the API (server-side)
 * The API requires the MongoDB _id for deletion, so we first fetch the figure by shortcode.
 * @param shortcode - The shortcode of the figure to delete
 * @param token - Optional authentication token
 */
export async function deleteFigure(shortcode: string, token?: string): Promise<boolean> {
  try {
    const authToken = await getAuthToken(token);
    
    // First, get the figure by shortcode to retrieve its _id
    console.log(`[figuresApi] Looking up figure by shortcode: ${shortcode}`);
    const figureResponse = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!figureResponse.ok) {
      if (figureResponse.status === 404) {
        throw new Error(`Figure with shortcode "${shortcode}" not found`);
      }
      throw new Error(`Failed to find figure: ${figureResponse.statusText}`);
    }

    const figureText = await figureResponse.text();
    if (!figureText || figureText.trim() === '') {
      throw new Error(`Figure with shortcode "${shortcode}" not found (empty response)`);
    }

    const figure = JSON.parse(figureText);
    const figureId = figure._id;

    if (!figureId) {
      throw new Error(`Figure with shortcode "${shortcode}" has no _id`);
    }

    console.log(`[figuresApi] Found figure _id: ${figureId}, proceeding with deletion`);

    // Now delete using the _id
    const deleteResponse = await fetch(`${API_BASE_URL}/figures/${figureId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      console.error(`[figuresApi] Failed to delete figure: ${deleteResponse.status} - ${errorData.message || deleteResponse.statusText}`);
      throw new Error(errorData.message || `Failed to delete figure: ${deleteResponse.statusText}`);
    }

    console.log(`[figuresApi] Successfully deleted figure: ${shortcode} (id: ${figureId})`);
    
    // Invalidate cache after successful deletion
    await invalidateFigureCache(shortcode);
    
    return true;
  } catch (error: any) {
    console.error('[figuresApi] Error deleting figure:', error);
    
    trackFiguresApiError({
      endpoint: `/figures/${shortcode}`,
      method: 'DELETE',
      errorType: 'unknown',
      message: error.message || 'Unknown delete error',
      stack: error.stack,
    });
    
    throw error;
  }
}

