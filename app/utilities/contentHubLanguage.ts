import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { LanguageSupport } from "~/types/language.interface";
import {
  getHubLanguage,
  resolveEducationLevelFromRoute,
  normalizeLanguageSupport,
} from "~/utilities/educationRoute";

export function decodeRouteSegment(value: unknown): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw) return "";
  try {
    return decodeURIComponent(raw).replaceAll("-", " ");
  } catch {
    return String(raw).replaceAll("-", " ");
  }
}

/**
 * Primary hub → Swahili header; Secondary → English.
 * Returns null when unknown so callers can fall back to the hub cookie (e.g. last /primary vs /secondary).
 */
export function inferHubLanguageFromContentRoute(
  route: RouteLocationNormalizedLoaded,
  levelParam?: unknown,
  primaryFallback: LanguageSupport = "kiswahili",
): LanguageSupport | null {
  const routeLanguage = typeof route.query.lang === "string"
    ? normalizeLanguageSupport(route.query.lang, primaryFallback)
    : null;
  const resolvedEducationLevel = resolveEducationLevelFromRoute(route, "lower secondary");
  if (resolvedEducationLevel) {
    return getHubLanguage(resolvedEducationLevel, routeLanguage ?? primaryFallback);
  }

  if (routeLanguage) return routeLanguage;

  return null;
}
