export * from "~/utilities/utils";

// No known live "smartbook" host exists in this deployment (not in nginx,
// the API, or the portal's own server routes) -- this looks like leftover
// config from a predecessor system. Falls back to a gateway-relative path
// instead of a hardcoded, long-dead external host.
const SMARTBOOK_BASE_URL = import.meta.env?.VITE_SMARTBOOK_BASE_URL || "/smartbook";

export function getImageUrl(
  path?: string | null,
  _preferAbsolute?: boolean,
): string {
  if (!path) return "";

  const normalizedPath = String(path).trim();
  if (!normalizedPath) return "";

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("//") ||
    normalizedPath.startsWith("data:") ||
    normalizedPath.startsWith("blob:")
  ) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith("/")) {
    return normalizedPath;
  }

  return `${SMARTBOOK_BASE_URL}/${normalizedPath.replace(/^\.?\//, "")}`;
}
