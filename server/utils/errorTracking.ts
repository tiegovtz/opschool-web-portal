/**
 * Error Tracking Utility for Figures and Image Loading
 * 
 * Provides centralized error logging and tracking for image-related failures.
 * Supports both console logging and optional external error tracking services.
 */

export interface ImageLoadError {
  shortcode: string;
  url?: string;
  errorType: 'fetch' | 'parse' | 'auth' | 'notfound' | 'network' | 'timeout' | 'unknown';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
}

export interface FiguresApiError {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  statusCode?: number;
  errorType: 'auth' | 'network' | 'timeout' | 'parse' | 'server' | 'unknown';
  message: string;
  timestamp: Date;
  requestParams?: Record<string, any>;
  stack?: string;
}

// In-memory error storage for debugging (last 100 errors)
const MAX_STORED_ERRORS = 100;
const imageErrors: ImageLoadError[] = [];
const apiErrors: FiguresApiError[] = [];

// Error counters for monitoring
const errorCounts = {
  imageLoad: 0,
  apiRequest: 0,
  lastReset: new Date(),
};

/**
 * Track an image loading error
 */
export function trackImageLoadError(error: Omit<ImageLoadError, 'timestamp'>): void {
  const fullError: ImageLoadError = {
    ...error,
    timestamp: new Date(),
  };

  // Store in memory
  imageErrors.push(fullError);
  if (imageErrors.length > MAX_STORED_ERRORS) {
    imageErrors.shift();
  }

  // Increment counter
  errorCounts.imageLoad++;

  // Log to console with structured format
  console.error('[ErrorTracking:ImageLoad]', JSON.stringify({
    shortcode: fullError.shortcode,
    url: fullError.url,
    errorType: fullError.errorType,
    message: fullError.message,
    timestamp: fullError.timestamp.toISOString(),
    context: fullError.context,
  }));

  // If external tracking service is configured, send error
  sendToExternalService('image_load_error', fullError);
}

/**
 * Track a Figures API error
 */
export function trackFiguresApiError(error: Omit<FiguresApiError, 'timestamp'>): void {
  const fullError: FiguresApiError = {
    ...error,
    timestamp: new Date(),
  };

  // Store in memory
  apiErrors.push(fullError);
  if (apiErrors.length > MAX_STORED_ERRORS) {
    apiErrors.shift();
  }

  // Increment counter
  errorCounts.apiRequest++;

  // Log to console with structured format
  console.error('[ErrorTracking:FiguresAPI]', JSON.stringify({
    endpoint: fullError.endpoint,
    method: fullError.method,
    statusCode: fullError.statusCode,
    errorType: fullError.errorType,
    message: fullError.message,
    timestamp: fullError.timestamp.toISOString(),
    requestParams: fullError.requestParams,
  }));

  // If external tracking service is configured, send error
  sendToExternalService('figures_api_error', fullError);
}

/**
 * Track a RAG API error
 */
export function trackRagApiError(error: Omit<FiguresApiError, 'timestamp'>): void {
  const fullError: FiguresApiError = {
    ...error,
    timestamp: new Date(),
  };

  apiErrors.push(fullError);
  if (apiErrors.length > MAX_STORED_ERRORS) {
    apiErrors.shift();
  }

  errorCounts.apiRequest++;

  console.error('[ErrorTracking:RAGAPI]', JSON.stringify({
    endpoint: fullError.endpoint,
    method: fullError.method,
    statusCode: fullError.statusCode,
    errorType: fullError.errorType,
    message: fullError.message,
    timestamp: fullError.timestamp.toISOString(),
    requestParams: fullError.requestParams,
  }));

  sendToExternalService('rag_api_error', fullError);
}

/**
 * Get error statistics for monitoring
 */
export function getErrorStats(): {
  imageLoadErrors: number;
  apiRequestErrors: number;
  lastReset: Date;
  recentImageErrors: ImageLoadError[];
  recentApiErrors: FiguresApiError[];
} {
  return {
    imageLoadErrors: errorCounts.imageLoad,
    apiRequestErrors: errorCounts.apiRequest,
    lastReset: errorCounts.lastReset,
    recentImageErrors: imageErrors.slice(-10),
    recentApiErrors: apiErrors.slice(-10),
  };
}

/**
 * Reset error counters (call periodically for rate monitoring)
 */
export function resetErrorCounters(): void {
  errorCounts.imageLoad = 0;
  errorCounts.apiRequest = 0;
  errorCounts.lastReset = new Date();
}

/**
 * Get all stored image errors
 */
export function getImageErrors(): ImageLoadError[] {
  return [...imageErrors];
}

/**
 * Get all stored API errors
 */
export function getApiErrors(): FiguresApiError[] {
  return [...apiErrors];
}

/**
 * Clear all stored errors
 */
export function clearStoredErrors(): void {
  imageErrors.length = 0;
  apiErrors.length = 0;
}

/**
 * Categorize HTTP status code to error type
 */
export function categorizeHttpError(statusCode: number): FiguresApiError['errorType'] {
  if (statusCode === 401 || statusCode === 403) {
    return 'auth';
  }
  if (statusCode === 404) {
    return 'notfound' as any; // Map to 'unknown' for API errors
  }
  if (statusCode >= 500) {
    return 'server';
  }
  if (statusCode === 0) {
    return 'network';
  }
  return 'unknown';
}

/**
 * Send error to external tracking service (if configured)
 * Supports Sentry, LogRocket, or custom webhook
 */
async function sendToExternalService(
  errorType: string,
  errorData: ImageLoadError | FiguresApiError
): Promise<void> {
  const webhookUrl = process.env.ERROR_TRACKING_WEBHOOK_URL;
  const sentryDsn = process.env.SENTRY_DSN;

  // Skip if no external service configured
  if (!webhookUrl && !sentryDsn) {
    return;
  }

  try {
    // Send to custom webhook if configured
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: errorType,
          data: errorData,
          environment: process.env.NODE_ENV || 'development',
          service: 'tie-web-portal',
        }),
      }).catch(() => {
        // Silently fail - don't create infinite error loops
      });
    }

    // Sentry integration would go here if needed
    // if (sentryDsn && typeof Sentry !== 'undefined') {
    //   Sentry.captureException(new Error(errorData.message), { extra: errorData });
    // }
  } catch {
    // Silently fail - error tracking should never break the app
  }
}

/**
 * Create a wrapped fetch that tracks errors automatically
 */
export function createTrackedFetch(baseEndpoint: string) {
  return async function trackedFetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const method = (options.method || 'GET') as FiguresApiError['method'];
    const startTime = Date.now();

    try {
      const response = await fetch(`${baseEndpoint}${endpoint}`, options);

      if (!response.ok) {
        trackFiguresApiError({
          endpoint,
          method,
          statusCode: response.status,
          errorType: categorizeHttpError(response.status),
          message: `HTTP ${response.status}: ${response.statusText}`,
          requestParams: options.body ? JSON.parse(options.body as string) : undefined,
        });
      }

      return response;
    } catch (error: any) {
      const errorType: FiguresApiError['errorType'] = 
        error.name === 'AbortError' ? 'timeout' :
        error.name === 'TypeError' ? 'network' : 'unknown';

      trackFiguresApiError({
        endpoint,
        method,
        errorType,
        message: error.message || 'Unknown fetch error',
        stack: error.stack,
      });

      throw error;
    }
  };
}

export default {
  trackImageLoadError,
  trackFiguresApiError,
  getErrorStats,
  resetErrorCounters,
  getImageErrors,
  getApiErrors,
  clearStoredErrors,
  categorizeHttpError,
  createTrackedFetch,
};

