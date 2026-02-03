export const AI_LAUNCHER_ALLOWED_SUBJECTS = [
  "physics",
  "chemistry",
  "mathematics",
  "biology",
  "geography",
] as const;

export const normalizeSubjectSlug = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export const isAllowedSubjectSlug = (value: unknown): boolean => {
  const slug = normalizeSubjectSlug(value);
  return AI_LAUNCHER_ALLOWED_SUBJECTS.includes(
    slug as (typeof AI_LAUNCHER_ALLOWED_SUBJECTS)[number]
  );
};
