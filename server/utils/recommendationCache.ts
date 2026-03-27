import type { PersonalizedRecommendationsResponse } from "~/types/recommendation.interface";

const CACHE_TTL_MS = 10 * 60 * 1000;

const recommendationCache = new Map<
  string,
  { timestamp: number; value: PersonalizedRecommendationsResponse }
>();

export const getCachedRecommendations = (userId: string | null | undefined) => {
  if (!userId) return null;

  const cached = recommendationCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.timestamp >= CACHE_TTL_MS) {
    recommendationCache.delete(userId);
    return null;
  }

  return cached.value;
};

export const setCachedRecommendations = (
  userId: string | null | undefined,
  value: PersonalizedRecommendationsResponse,
) => {
  if (!userId) return;

  recommendationCache.set(userId, {
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
