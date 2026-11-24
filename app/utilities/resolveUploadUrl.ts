/**
 * Resolves a possibly-relative upload path (e.g. "uploads/models/x.glb")
 * against the current environment's uploads base URL, so content authored
 * on one environment (or copied from a DB seed) still loads wherever it's
 * rendered. Already-absolute URLs are left untouched.
 */
export function resolveUploadUrl(src: string, baseUrl: string): string {
  const trimmed = (src || "").trim();
  if (!trimmed) return trimmed;
  if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;

  const cleanBase = (baseUrl || "").replace(/\/+$/, "");
  if (!cleanBase) return trimmed;
  return `${cleanBase}/${trimmed.replace(/^\/+/, "")}`;
}
