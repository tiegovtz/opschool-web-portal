import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { LanguageSupport } from "~/types/language.interface";
import { normalizeEducationLevel } from "~/utilities/educationRoute";

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
): LanguageSupport | null {
  const routeEducationLevel = route.query.educationLevel ?? route.query.edl;
  if (routeEducationLevel) {
    return normalizeEducationLevel(routeEducationLevel) === "primary"
      ? "kiswahili"
      : "english";
  }

  const levelRaw =
    levelParam !== undefined && levelParam !== null && String(levelParam).length > 0
      ? levelParam
      : route.params.level;

  if (levelRaw !== undefined && levelRaw !== null && String(levelRaw).length > 0) {
    const level = decodeRouteSegment(levelRaw).toLowerCase();
    if (level.includes("darasa")) return "kiswahili";
    if (/\bform\b/.test(level)) return "english";
  }

  const lang = route.query.lang;
  if (lang === "sw") return "kiswahili";
  if (lang === "en") return "english";

  return null;
}
