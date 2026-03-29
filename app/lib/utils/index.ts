export * from "~/utilities/utils";

const SMARTBOOK_BASE_URL = "http://41.59.251.164:9000/smartbook";

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
