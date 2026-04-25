import type { PersonalizedRecommendationsResponse } from "~/types/recommendation.interface";

const CACHE_TTL_MS = 10 * 60 * 1000;
type RecommendationLanguage = "english" | "kiswahili";

const recommendationCache = new Map<
  string,
  { timestamp: number; value: PersonalizedRecommendationsResponse }
>();

const buildCacheKey = (
  userId: string | null | undefined,
  language: RecommendationLanguage = "english",
) => {
  if (!userId) return null;
  return `${userId}:${language}`;
};

export const getCachedRecommendations = (
  userId: string | null | undefined,
  language: RecommendationLanguage = "english",
) => {
  const cacheKey = buildCacheKey(userId, language);
  if (!cacheKey) return null;

  const cached = recommendationCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.timestamp >= CACHE_TTL_MS) {
    recommendationCache.delete(cacheKey);
    return null;
  }

  return cached.value;
};

export const setCachedRecommendations = (
  userId: string | null | undefined,
  language: RecommendationLanguage = "english",
  value: PersonalizedRecommendationsResponse,
) => {
  const cacheKey = buildCacheKey(userId, language);
  if (!cacheKey) return;

  recommendationCache.set(cacheKey, {
    timestamp: Date.now(),
    value,
  });

  if (recommendationCache.size > 100) {
    const firstKey = recommendationCache.keys().next().value;
    if (firstKey) recommendationCache.delete(firstKey);
  }
};

export const clearRecommendationCache = () => {
  recommendationCache.clear();
};
