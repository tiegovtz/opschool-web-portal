import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { LanguageSupport } from "~/types/language.interface";

export type EducationBucket = "primary" | "lower secondary"| "upper secondary" | "secondary";

const PRIMARY_ALIASES = new Set([
  "primary",
  "primary education",
  "elimu ya msingi",
  "msingi",
]);

const SECONDARY_ALIASES = new Set([
  "secondary",
  "secondary education",
  "lower secondary",
  "upper secondary",
  "elimu ya sekondari",
  "sekondari",
]);

const ENGLISH_ALIASES = new Set(["english", "en"]);
const KISWAHILI_ALIASES = new Set(["kiswahili", "swahili", "sw"]);

export const normalizeEducationLevel = (
  value: unknown,
  fallback: EducationBucket = "lower secondary",
): EducationBucket => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (PRIMARY_ALIASES.has(normalized)) return "primary";
  if (SECONDARY_ALIASES.has(normalized)) return "lower secondary";
  return fallback;
};

export const getHubPath = (educationLevel: unknown): string =>
  normalizeEducationLevel(educationLevel) === "primary"
    ? "/primary"
    : "/secondary";

export const normalizeLanguageSupport = (
  value: unknown,
  fallback: LanguageSupport = "english",
): LanguageSupport => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (KISWAHILI_ALIASES.has(normalized)) return "kiswahili";
  if (ENGLISH_ALIASES.has(normalized)) return "english";
  return fallback;
};

export const getHubLanguage = (
  educationLevel: unknown,
  preferredLanguage?: unknown,
): LanguageSupport =>
  normalizeEducationLevel(educationLevel) === "primary"
    ? normalizeLanguageSupport(preferredLanguage, "kiswahili")
    : "english";

export const getHubLanguageCode = (
  educationLevel: unknown,
  preferredLanguage?: unknown,
): "sw" | "en" =>
  getHubLanguage(educationLevel, preferredLanguage) === "kiswahili" ? "sw" : "en";

export const getApiContentLanguage = (
  educationLevel: unknown,
  preferredLanguage?: unknown,
): "Kiswahili" | "English" | undefined => {
  if (normalizeEducationLevel(educationLevel) !== "primary") return undefined;
  return getHubLanguage(educationLevel, preferredLanguage) === "kiswahili"
    ? "Kiswahili"
    : "English";
};

export const resolveRouteLanguage = (
  route: Pick<RouteLocationNormalizedLoaded, "path" | "query">,
  educationLevel?: unknown,
  fallback: LanguageSupport = "kiswahili",
): LanguageSupport =>
  getHubLanguage(
    educationLevel ?? resolveEducationLevelFromRoute(route),
    route.query.lang ?? fallback,
  );

export const getEducationRouteQuery = (
  educationLevel: unknown,
  extra: Record<string, any> = {},
  preferredLanguage?: unknown,
) => {
  const normalized = normalizeEducationLevel(educationLevel);
  return {
    educationLevel: normalized,
    edl: normalized,
    lang: getHubLanguageCode(normalized, preferredLanguage),
    ...extra,
  };
};

export const resolveEducationLevelFromRoute = (
  route: Pick<RouteLocationNormalizedLoaded, "path" | "query">,
  fallback: EducationBucket ="lower secondary",
): EducationBucket => {
  if (
    route.path === "/primary" ||
    route.path.startsWith("/primary/")
  ) {
    return "primary";
  }

  if (
    route.path === "/secondary" ||
    route.path.startsWith("/secondary/")
  ) {
    return "lower secondary";
  }

  return normalizeEducationLevel(
    route.query.educationLevel ?? route.query.edl,
    fallback,
  );
};
