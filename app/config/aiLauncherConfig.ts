export const normalizeSubjectSlug = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
};

export const extractSubjectSlugs = (payload: unknown): string[] => {
  if (!Array.isArray(payload)) return [];

  const slugs = payload
    .map((item) => normalizeSubjectSlug((item as { name?: string })?.name))
    .filter(Boolean);

  return Array.from(new Set(slugs));
};
