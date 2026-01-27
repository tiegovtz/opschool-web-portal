/**
 * Server-side Figures API Client
 * 
 * Handles server-side interactions with the external Figures API
 * Maps API response fields to match JSON format (subject→subjectName, chapter→chapterName, topic→topicName)
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

async function getAuthToken(token?: string): Promise<string> {
  // Only use provided user token - no fallbacks
  if (token && token.trim()) {
    return token;
  }
  
  // No token available - return empty string
  // This will trigger proper error tracking in apiRequest
  return '';
}

function mapApiFigureToJsonFormat(apiFigure: ApiFigure): MappedFigure {
  const mapped: MappedFigure = {
    shortcode: apiFigure.shortcode,
    alt: apiFigure.caption || apiFigure.alt || '',
    category: (apiFigure.category as MappedFigure['category']) || 'general',
  };

  const apiFigureAny = apiFigure as any;
  if (apiFigureAny.images && Array.isArray(apiFigureAny.images) && apiFigureAny.images.length > 1) {
    mapped.paths = apiFigureAny.images.map((img: any) => img.url || img.path || img);
    mapped.alts = apiFigureAny.images.map((img: any) => img.alt || apiFigure.alt || '');
  } else if (apiFigureAny.images && Array.isArray(apiFigureAny.images) && apiFigureAny.images.length === 1) {
    const img = apiFigureAny.images[0];
    mapped.path = img.url || img.path || img;
    mapped.alt = img.alt || apiFigure.alt || apiFigure.caption || '';
  } else if (apiFigure.paths && apiFigure.paths.length > 1) {
    mapped.paths = apiFigure.paths;
    mapped.alts = apiFigure.alts || [];
  } else if (apiFigure.paths && apiFigure.paths.length === 1) {
    mapped.path = apiFigure.paths[0];
  } else if (apiFigure.path) {
    mapped.path = apiFigure.path;
  }

  if (apiFigure.description) {
    mapped.description = apiFigure.description;
  }
  if (apiFigureAny.subjectName) {
    mapped.subjectName = apiFigureAny.subjectName;
  } else if (apiFigure.subject) {
    mapped.subjectName = apiFigure.subject;
  }
  if (apiFigureAny.chapterName) {
    mapped.chapterName = apiFigureAny.chapterName;
  } else if (apiFigure.chapter) {
    mapped.chapterName = apiFigure.chapter;
  }
  if (apiFigureAny.topicName) {
    mapped.topicName = apiFigureAny.topicName;
  } else if (apiFigure.topic) {
    mapped.topicName = apiFigure.topic;
  }
  if (apiFigureAny.figureNumber) {
    mapped.figure_number = apiFigureAny.figureNumber;
  } else if (apiFigure.figure_number) {
    mapped.figure_number = apiFigure.figure_number;
  }
  if (apiFigureAny.pageNumber) {
    mapped.page_number = apiFigureAny.pageNumber;
  } else if (apiFigure.page_number) {
    mapped.page_number = apiFigure.page_number;
  }

  return mapped;
}

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
    } else {
      const errorMessage = 'No user authentication token available. User must be authenticated to access figures API.';
      trackFiguresApiError({
        endpoint,
        method,
        errorType: 'auth',
        message: errorMessage,
      });
      throw new Error(errorMessage);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorType = categorizeHttpError(response.status);
      
      // 404 means resource not found - return null (not an error)
      if (response.status === 404) {
        return null;
      }
      
      // 401/403 are authentication/authorization errors - throw error
      if (response.status === 401 || response.status === 403) {
        const errorText = await response.text().catch(() => response.statusText);
        const errorMessage = `Authentication failed: HTTP ${response.status} - ${errorText}`;
        trackFiguresApiError({
          endpoint,
          method,
          statusCode: response.status,
          errorType,
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
      
      // Other errors - log and return null (let caller decide)
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
    } catch (parseError: any) {
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

export async function getFigureByShortcode(shortcode: string, token?: string): Promise<MappedFigure | null> {
  const cached = await getCachedFigureByShortcode(shortcode);
  if (cached) {
    return cached;
  }
  
  const figures = await getFigures({}, token);
  
  if (!figures || figures.length === 0) {
    return null;
  }
  
  const figure = figures.find(f => f.shortcode === shortcode);
  
  if (figure) {
    await setCachedFigure(figure);
  }
  
  return figure || null;
}

export async function getFigures(options: {
  limit?: number;
  offset?: number;
  subject?: string;
  category?: string;
  chapter?: string;
  topic?: string;
} = {}, token?: string): Promise<MappedFigure[]> {
  const hasFilters = options.subject || options.category || options.chapter || options.topic;
  
  if (!hasFilters) {
    const cached = await getCachedFigures();
    if (cached) {
      return cached;
    }
  }
  
  const params = new URLSearchParams();
  
  if (options.subject) {
    params.append('subject', options.subject);
  }
  if (options.category) {
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
  
  // apiRequest will throw errors for auth failures (401/403) or missing tokens
  // It returns null for 404 (not found) or empty responses
  const response = await apiRequest<any>(endpoint, {}, token);
  
  // If apiRequest returns null, it means no figures found (404 or empty response)
  // Auth errors would have been thrown above
  if (!response) {
    return [];
  }

  let figuresArray: ApiFigure[] = [];
  
  if (Array.isArray(response)) {
    figuresArray = response;
  } else if (response.data && Array.isArray(response.data)) {
    figuresArray = response.data;
  } else if (response.figures && Array.isArray(response.figures)) {
    figuresArray = response.figures;
  } else if (response.results && Array.isArray(response.results)) {
    figuresArray = response.results;
  } else {
    return [];
  }

  const mapped = figuresArray.map(mapApiFigureToJsonFormat);
  
  if (!hasFilters && mapped.length > 0) {
    await setCachedFigures(mapped);
  }
  
  return mapped;
}

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
    const authToken = await getAuthToken(token);
    
    if (!authToken || !authToken.trim()) {
      throw new Error('No authentication token available for creating figure');
    }
    
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
      'Authorization': `Bearer ${authToken}`,
    };

    const response = await fetch(`${API_BASE_URL}/figures`, {
      method: 'POST',
      headers,
      body: JSON.stringify(apiData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create figure: ${response.statusText}`);
    }

    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return null;
    }

    const apiFigure = JSON.parse(text) as ApiFigure;
    const mappedFigure = mapApiFigureToJsonFormat(apiFigure);
    
    await invalidateFigureCache();
    
    return mappedFigure;
  } catch (error: any) {
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
    const existing = await getFigureByShortcode(shortcode, token);
    if (!existing) {
      throw new Error(`Figure with shortcode ${shortcode} not found`);
    }

    const authToken = await getAuthToken(token);
    
    if (!authToken || !authToken.trim()) {
      throw new Error('No authentication token available for updating figure');
    }
    
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
      'Authorization': `Bearer ${authToken}`,
    };

    let response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(apiData),
    });

    if (!response.ok && response.status !== 404) {
      response = await fetch(`${API_BASE_URL}/figures/shortcode/${shortcode}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(apiData),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update figure: ${response.statusText}`);
    }

    const text = await response.text();
    
    await invalidateFigureCache(shortcode);
    
    if (!text || text.trim().length === 0) {
      return await getFigureByShortcode(shortcode, token);
    }

    const apiFigure = JSON.parse(text) as ApiFigure;
    return mapApiFigureToJsonFormat(apiFigure);
  } catch (error: any) {
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

export async function deleteFigure(shortcode: string, token?: string): Promise<boolean> {
  try {
    const authToken = await getAuthToken(token);
    
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

    const deleteResponse = await fetch(`${API_BASE_URL}/figures/${figureId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete figure: ${deleteResponse.statusText}`);
    }

    await invalidateFigureCache(shortcode);
    
    return true;
  } catch (error: any) {
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
