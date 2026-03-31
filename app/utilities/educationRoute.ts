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

export const getHubLanguage = (
  educationLevel: unknown,
): LanguageSupport =>
  normalizeEducationLevel(educationLevel) === "primary"
    ? "kiswahili"
    : "english";

export const getHubLanguageCode = (educationLevel: unknown): "sw" | "en" =>
  normalizeEducationLevel(educationLevel) === "primary" ? "sw" : "en";

export const getEducationRouteQuery = (
  educationLevel: unknown,
  extra: Record<string, any> = {},
) => {
  const normalized = normalizeEducationLevel(educationLevel);
  return {
    educationLevel: normalized,
    edl: normalized,
    lang: getHubLanguageCode(normalized),
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
