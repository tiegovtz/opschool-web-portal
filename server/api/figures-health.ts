/**
 * Figures API Health & Monitoring Endpoint
 * 
 * Provides health check and monitoring data for the figures system:
 * - Error statistics
 * - Cache status
 * - Recent errors for debugging
 */

import { getErrorStats, resetErrorCounters } from '../utils/errorTracking';
import { getCacheStats } from '../utils/figuresCache';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const action = query.action as string | undefined;

  // Reset error counters if requested
  if (action === 'reset') {
    resetErrorCounters();
    return {
      success: true,
      message: 'Error counters reset successfully',
      timestamp: new Date().toISOString(),
    };
  }

  // Get current stats
  const errorStats = getErrorStats();
  const cacheStats = getCacheStats();

  // Calculate error rate (errors per minute since last reset)
  const minutesSinceReset = (Date.now() - errorStats.lastReset.getTime()) / 60000;
  const imageErrorRate = minutesSinceReset > 0 
    ? (errorStats.imageLoadErrors / minutesSinceReset).toFixed(2) 
    : '0.00';
  const apiErrorRate = minutesSinceReset > 0 
    ? (errorStats.apiRequestErrors / minutesSinceReset).toFixed(2) 
    : '0.00';

  return {
    success: true,
    timestamp: new Date().toISOString(),
    health: {
      status: errorStats.apiRequestErrors > 50 ? 'degraded' : 'healthy',
      cacheAvailable: cacheStats.redisAvailable || cacheStats.memoryCacheSize > 0,
    },
    errors: {
      imageLoadErrors: errorStats.imageLoadErrors,
      apiRequestErrors: errorStats.apiRequestErrors,
      imageErrorRate: `${imageErrorRate}/min`,
      apiErrorRate: `${apiErrorRate}/min`,
      lastReset: errorStats.lastReset.toISOString(),
      recentImageErrors: errorStats.recentImageErrors.map(e => ({
        shortcode: e.shortcode,
        type: e.errorType,
        message: e.message,
        time: e.timestamp,
      })),
      recentApiErrors: errorStats.recentApiErrors.map(e => ({
        endpoint: e.endpoint,
        method: e.method,
        statusCode: e.statusCode,
        type: e.errorType,
        message: e.message,
        time: e.timestamp,
      })),
    },
    cache: {
      redisAvailable: cacheStats.redisAvailable,
      memoryCacheSize: cacheStats.memoryCacheSize,
      memoryCacheMaxSize: cacheStats.memoryCacheMaxSize,
      memoryCacheUtilization: `${((cacheStats.memoryCacheSize / cacheStats.memoryCacheMaxSize) * 100).toFixed(1)}%`,
    },
    configuration: {
      figuresApiUrl: process.env.FIGURES_API_BASE_URL || 'https://opschool.tie.go.tz:5001/v1',
      redisConfigured: !!process.env.REDIS_URL,
      errorWebhookConfigured: !!process.env.ERROR_TRACKING_WEBHOOK_URL,
    },
  };
});


