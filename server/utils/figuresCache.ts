/**
 * Figures Cache Service
 * 
 * Provides caching layer for figures data with support for:
 * - In-memory cache (default, always available)
 * - Redis cache (optional, for production environments)
 * 
 * The cache automatically falls back to in-memory when Redis is unavailable.
 */

import type { MappedFigure } from '~/types/figures.interface';

// Cache configuration
const CACHE_TTL_SECONDS = 300; // 5 minutes default TTL
const MEMORY_CACHE_MAX_SIZE = 500; // Max items in memory cache

// Redis client (lazily initialized)
let redisClient: any = null;
let redisAvailable = false;
let redisCheckPerformed = false;

// In-memory cache fallback
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Initialize Redis connection if available
 */
async function initializeRedis(): Promise<boolean> {
  if (redisCheckPerformed) {
    return redisAvailable;
  }

  redisCheckPerformed = true;
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;

  if (!redisUrl) {
    console.log('[figuresCache] Redis not configured, using in-memory cache');
    return false;
  }

  try {
    // Dynamic import to avoid bundling redis if not used
    const { createClient } = await import('redis');
    
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err: Error) => {
      console.error('[figuresCache] Redis error:', err.message);
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('[figuresCache] Redis connected');
      redisAvailable = true;
    });

    await redisClient.connect();
    redisAvailable = true;
    console.log('[figuresCache] Redis initialized successfully');
    return true;
  } catch (error: any) {
    console.warn('[figuresCache] Redis initialization failed:', error.message);
    console.log('[figuresCache] Falling back to in-memory cache');
    redisAvailable = false;
    return false;
  }
}

/**
 * Generate cache key with prefix
 */
function getCacheKey(key: string): string {
  return `figures:${key}`;
}

/**
 * Clean up expired entries in memory cache
 */
function cleanupMemoryCache(): void {
  const now = Date.now();
  let deletedCount = 0;

  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    console.log(`[figuresCache] Cleaned up ${deletedCount} expired entries from memory cache`);
  }

  // If still over max size, remove oldest entries
  if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
    const entries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    const toDelete = entries.slice(0, memoryCache.size - MEMORY_CACHE_MAX_SIZE);
    for (const [key] of toDelete) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const cacheKey = getCacheKey(key);

  // Try Redis first if available
  if (redisAvailable && redisClient) {
    try {
      const data = await redisClient.get(cacheKey);
      if (data) {
        console.log(`[figuresCache] Redis HIT: ${key}`);
        return JSON.parse(data) as T;
      }
      console.log(`[figuresCache] Redis MISS: ${key}`);
      return null;
    } catch (error: any) {
      console.error('[figuresCache] Redis get error:', error.message);
      // Fall through to memory cache
    }
  }

  // Memory cache fallback
  const entry = memoryCache.get(cacheKey);
  if (entry && entry.expiresAt > Date.now()) {
    console.log(`[figuresCache] Memory HIT: ${key}`);
    return entry.data as T;
  }

  if (entry) {
    // Expired entry, clean it up
    memoryCache.delete(cacheKey);
  }

  console.log(`[figuresCache] Memory MISS: ${key}`);
  return null;
}

/**
 * Set value in cache
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  const cacheKey = getCacheKey(key);

  // Try Redis first if available
  if (redisAvailable && redisClient) {
    try {
      await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(value));
      console.log(`[figuresCache] Redis SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error: any) {
      console.error('[figuresCache] Redis set error:', error.message);
      // Fall through to memory cache
    }
  }

  // Always store in memory cache as well (for quick access and fallback)
  const expiresAt = Date.now() + (ttlSeconds * 1000);
  memoryCache.set(cacheKey, { data: value, expiresAt });

  // Periodic cleanup
  if (memoryCache.size > MEMORY_CACHE_MAX_SIZE * 0.9) {
    cleanupMemoryCache();
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<void> {
  const cacheKey = getCacheKey(key);

  // Delete from Redis if available
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(cacheKey);
      console.log(`[figuresCache] Redis DEL: ${key}`);
    } catch (error: any) {
      console.error('[figuresCache] Redis delete error:', error.message);
    }
  }

  // Delete from memory cache
  memoryCache.delete(cacheKey);
}

/**
 * Clear all figures cache
 */
export async function cacheClear(): Promise<void> {
  // Clear Redis cache (pattern match)
  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys('figures:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`[figuresCache] Redis cleared ${keys.length} keys`);
      }
    } catch (error: any) {
      console.error('[figuresCache] Redis clear error:', error.message);
    }
  }

  // Clear memory cache
  const count = memoryCache.size;
  memoryCache.clear();
  console.log(`[figuresCache] Memory cache cleared ${count} entries`);
}

// ============================================================================
// Figures-specific cache helpers
// ============================================================================

/**
 * Cache key for all figures
 */
export const CACHE_KEYS = {
  ALL_FIGURES: 'all',
  FIGURES_BY_SUBJECT: (subject: string) => `subject:${subject.toLowerCase()}`,
  FIGURES_BY_CATEGORY: (category: string) => `category:${category.toLowerCase()}`,
  FIGURES_BY_CHAPTER: (chapter: string) => `chapter:${chapter.toLowerCase()}`,
  FIGURE_BY_SHORTCODE: (shortcode: string) => `shortcode:${shortcode}`,
} as const;

/**
 * Get all cached figures
 */
export async function getCachedFigures(): Promise<MappedFigure[] | null> {
  return cacheGet<MappedFigure[]>(CACHE_KEYS.ALL_FIGURES);
}

/**
 * Cache all figures
 */
export async function setCachedFigures(
  figures: MappedFigure[],
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  await cacheSet(CACHE_KEYS.ALL_FIGURES, figures, ttlSeconds);
}

/**
 * Get cached figure by shortcode
 */
export async function getCachedFigureByShortcode(
  shortcode: string
): Promise<MappedFigure | null> {
  return cacheGet<MappedFigure>(CACHE_KEYS.FIGURE_BY_SHORTCODE(shortcode));
}

/**
 * Cache a single figure
 */
export async function setCachedFigure(
  figure: MappedFigure,
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  await cacheSet(CACHE_KEYS.FIGURE_BY_SHORTCODE(figure.shortcode), figure, ttlSeconds);
}

/**
 * Invalidate figure cache (when a figure is updated/deleted)
 */
export async function invalidateFigureCache(shortcode?: string): Promise<void> {
  // Always invalidate the all-figures cache
  await cacheDelete(CACHE_KEYS.ALL_FIGURES);

  // If shortcode provided, invalidate specific figure cache
  if (shortcode) {
    await cacheDelete(CACHE_KEYS.FIGURE_BY_SHORTCODE(shortcode));
  }

  console.log(`[figuresCache] Cache invalidated ${shortcode ? `for ${shortcode}` : 'globally'}`);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  redisAvailable: boolean;
  memoryCacheSize: number;
  memoryCacheMaxSize: number;
} {
  return {
    redisAvailable,
    memoryCacheSize: memoryCache.size,
    memoryCacheMaxSize: MEMORY_CACHE_MAX_SIZE,
  };
}

// Initialize Redis on module load (non-blocking)
initializeRedis().catch(() => {
  // Silently handle initialization failure
});

export default {
  get: cacheGet,
  set: cacheSet,
  delete: cacheDelete,
  clear: cacheClear,
  getCachedFigures,
  setCachedFigures,
  getCachedFigureByShortcode,
  setCachedFigure,
  invalidateFigureCache,
  getCacheStats,
  CACHE_KEYS,
};


