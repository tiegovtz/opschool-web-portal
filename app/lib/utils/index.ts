export * from "~/utilities/utils";

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

  return `/${normalizedPath.replace(/^\.?\//, "")}`;
}
