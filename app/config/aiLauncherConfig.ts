export const normalizeSubjectSlug = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
};

export const extractSubjectSlugs = (payload: unknown): string[] => {
  if (!Array.isArray(payload)) return [];

  const slugs = payload
    .map((item) =>
      normalizeSubjectSlug(
        (item as { name?: string; subjectName?: string; title?: string })?.name ??
          (item as { name?: string; subjectName?: string; title?: string })?.subjectName ??
          (item as { name?: string; subjectName?: string; title?: string })?.title
      )
    )
    .filter(Boolean);

  return Array.from(new Set(slugs));
};
