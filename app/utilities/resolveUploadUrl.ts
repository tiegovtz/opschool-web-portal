/**
 * Resolves a possibly-relative upload path (e.g. "uploads/models/x.glb")
 * against the current environment's uploads base URL, so content authored
 * on one environment (or copied from a DB seed) still loads wherever it's
 * rendered. Known backend upload URLs are rebased; external URLs stay intact.
 */
export function resolveUploadUrl(src: string, baseUrl: string): string {
  const trimmed = (src || "").trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('#') || /^(?:data|blob):/i.test(trimmed)) return trimmed;
  const cleanBase = (baseUrl || "").replace(/\/+$/, "").replace(/\/v\d+$/i, "");
  if (!cleanBase) return trimmed;
  let path = trimmed;
  if (/^(https?:)?\/\//i.test(trimmed)) {
    try {
      const source = new URL(trimmed, 'https://relative.invalid');
      const configuredHost = /^https?:\/\//i.test(cleanBase) ? new URL(cleanBase).hostname : '';
      const backendHosts = ['opschool.tie.go.tz', 'apitie.ekima.africa', '41.59.251.166', 'localhost', '127.0.0.1', '[::1]', 'gateway'];
      if (source.hostname !== configuredHost && !backendHosts.includes(source.hostname)) return trimmed;
      const uploads = source.pathname.match(/(?:^|\/)uploads(?:\/.*)?$/);
      if (!uploads) return trimmed;
      path = uploads[0].replace(/^\//, '') + source.search + source.hash;
    } catch {
      return trimmed;
    }
  }
  // Strip an existing gateway/API prefix instead of producing /api/api/uploads.
  path = path.replace(/^\/?(?:api\/(?:v\d+\/)?)?(uploads(?:\/|$))/i, '$1');
  if (path.startsWith(`${cleanBase}/`)) return path;
  return `${cleanBase}/${path.replace(/^\/+/, "")}`;
}
